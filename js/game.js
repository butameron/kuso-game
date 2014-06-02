
/*!
 * KUSO Game JavaScript Library v1.0
 *
 * Copyright 2014 Butameron and OPAP-JP contributors.
 * http://opap.jp/
 *
 * Dual licensed under the MIT and WTFPL licenses.
 *
 */


(function (win, doc) {

    /////////////////////////////////////
    // 変数・定数
    /////////////////////////////////////

    // DOM関連のショートカット
    var root = doc.rootElement;
    var body = doc.body;

    // 出力先
    var gamescreen = null;

    // シナリオ・シーン関連
    var scenario = null;
    var sceneList = null;
    var currentSceneIdx = 0;
    var currentScene = null;

    // 表示文言
    var MSGS = {
        SCENARIO_NOT_FOUND: "ぬるぽ",
        UNEXPECTED_ERROR: "ぬるぽ"
    };

    var COMMON_QUERY = {
        GAMESCREEN: "#gamescreen",
        SCENARIO: "#scenario",
        SCENE: ".scene"
    };

    /////////////////////////////////////
    // 初期化・破棄
    /////////////////////////////////////

    function init() {
        /// <summary>初期化</summary>

        try {

            gamescreen = $(COMMON_QUERY.GAMESCREEN).first();
            loadSenario();
            goFirstScene();


            $("#btnNext").click(function () {
                goNextScene();
            });

            $("#btnPrev").click(function () {
                goPrevScene();
            });




        } catch (ex) {
            alert(MSGS.UNEXPECTED_ERROR);
        }
    }


    function dispose() {
        /// <summary>後片付け</summary>

        // メモリリークを防ぐため、一応

        var gamescreen = null;
        scenario = null;
        sceneList = null;
        currentScene = null;

        root = null;
        body = null;
        win = null;
        doc = null;
    }


    /////////////////////////////////////
    // シーンコントロール
    /////////////////////////////////////

    function loadSenario() {
        /// <summary>シナリオを読み込む</summary>

        scenario = $(COMMON_QUERY.SCENARIO);
        if (scenario.length == 0) {
            alert(MSGS.SCENARIO_NOT_FOUND);
        }

        sceneList = $(scenario).children(COMMON_QUERY.SCENE);

    }


    function goFirstScene() {
        /// <summary>最初のシーンへ遷移する</summary>

        goScene(0);
    }

    function goNextScene() {
        /// <summary>次のシーンへ遷移する</summary>

        goSceneRelative(+1);
    }

    function goPrevScene() {
        /// <summary>前のシーンへ遷移する</summary>

        goSceneRelative(-1);
    }

    function goSceneRelative(relativeSceneIdx) {
        /// <summary>相対的にシーンへ遷移する</summary>
        /// <param name="sceneIdx">現在のシーンから相対的なシーン番号</summary>

        goScene(currentSceneIdx + relativeSceneIdx);
    }

    function goScene(sceneIdx) {
        /// <summary>指定したシーンへ遷移する</summary>
        /// <param name="sceneIdx">シーン番号</summary>


        //シーンインデックスの有効範囲外の場合の対策
        sceneIdx = Math.max(sceneIdx, 0);
        sceneIdx = Math.min(sceneIdx, sceneList.length - 1);

        //現在のシーンを設定
        currentSceneIdx = sceneIdx;
        currentScene = sceneList[currentSceneIdx];

        //指定されたシーンの画面を構築する
        setupScene();
    }

    function setupScene() {
        /// <summary>現在のシーンの画面を構築する</summary>

        //現在表示中のシーンを終了する
        stopSceneBgm($(COMMON_QUERY.SCENE, gamescreen));
        gamescreen.empty();

        // シーンをシナリオから読み込む

        var sceneClone = $(currentScene).clone(false);
        sceneClone.hide();
        sceneClone.children().andSelf().hide(); // IEではposition: absolute;な子要素にopacityが反映されないのを回避
        gamescreen.append(sceneClone);


        //スタイル設定
        var imgBg = $(".img-bg", sceneClone);
        if (imgBg.length > 0) {
            sceneClone.css("background", "none");
            sceneClone.css("background-image", "url(" + imgBg.first().attr("src") + ")");
            imgBg.remove();
        }

        //イベント設定
        sceneClone.children().andSelf().click(function () {
            playSeClick();
            runAction(currentScene);
        });

        sceneClone.children().andSelf().fadeIn(function () {
            
            //BGM再生開始
            playSceneBgm(sceneClone);

        });// IEではposition: absolute;な子要素にopacityが反映されないのを回避

    }

    function playSceneBgm(scene) {
        /// <summary>シーンに関連づけられたBGMを再生する</summary>

        $("audio.audio-bgm", scene).each(function (i, elem) {
            elem.play();
        });
    }

    function stopSceneBgm(scene) {
        /// <summary>シーンに関連づけられたBGMを停止する</summary>

        $("audio.audio-bgm", scene).each(function (i, elem) {
            elem.pause();
        });
    }

    function playSeClick() {
        /// <summary>クリックSEを再生する</summary>

        $(".env audio.audio-se-onclick", scenario).each(function (i, elem) {
            elem.currentTime = 0;
            elem.play();
        });
    }

    function runAction(elem) {
        /// <summary>定義されたアクションを実行する</summary>

        //アクションが定義されている自分及び自分よりも上の階層の要素を探す
        var action = "default";
        var sender = $(elem).closest("[data-action]"); 
        if (sender.length > 0) {
            action = sender.data("action");
        }

        var jumpRangeMin = sender.data("jumpRangeMin");
        var jumpRangeMax = sender.data("jumpRangeMax");
        var url = sender.data("url");
        var customAction = sender.data("customAction");

        switch (action) {
            case "jump":
                goScene(rnd(jumpRangeMin, jumpRangeMax));
                break;
            case "jump-relative":
                goSceneRelative(rnd(jumpRangeMin, jumpRangeMax));
                break;
            case "open-url":
                doc.location.href = url;
                break;
            case "none":
                break;
            case "custom":
                eval(customAction);
                break;
            case "default":
            default:
                goSceneRelative(1);
                break;
        }

    }

    /////////////////////////////////////
    // ユーティリティ関数
    /////////////////////////////////////
    function rnd(min, max) {
        /// <summary>指定された範囲の乱数を生成する</summary>
        /// <param name="min">最小値</param>
        /// <param name="max">最大値</param>

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /////////////////////////////////////
    // 実行用イベント登録
    /////////////////////////////////////


    $(function () {
        init();
    });

    $(win).unload(function () {
        dispose();
    });


})(window, document);
