$(function () {
  let gameState = {
    currentEventId: "start_game",
    currentEventDialogueIndex: 0,
    affection: 0
  }

  let gameEvents = [];
  let currentBGM = null;
  let arrowClick = true;


  function loadEventsData() {
    return $.getJSON('events.json')
      .done(function (data) {
        gameEvents = data;
        console.log('成功', gameEvents);
      })
      .fail(function (jqxhr, textStatus, error) {
        console.error('読み込み失敗');
        $('.message-area p').text('エラー')
      });
  }

  loadEventsData().done(function () {
    console.log('読み込み成功、ゲーム開始準備完了')
  });

  //開始画面をクリックで開始
  $('#start-btn').on('click', function () {
    $('#start-wrapper').fadeOut();
    $('.game-wrapper').fadeIn(2000);
    displayEvent(gameState.currentEventId);
  });

  // スタートへ戻る


  // 次へボタンの処理
  $('#next-btn').on('click', function () {
    if (!arrowClick) return;
    displayEvent(gameState.currentEventId)
  });

  // イベントの種類を判別する司令塔
  //処理はそれぞれの関数で行う
  function displayEvent(eventId) {
    const event = gameEvents.find(e => e.id === eventId);

    gameState.currentEventId = eventId;



    switch (event.type) {
      case "dialogue":
        processDialogue(event);
        break;
      case "choice":
        renderChoice(event, processChoice);
        break;
      case "bg":
        processImage(event);
        break;
      case "sound":
        processSound(event);
        break;
      case "stopSound":
        stopSound(event);
        break;
      case "soundEffect":
        processSoundEffect(event);
        break;
      case "person":
        processPerson(event);
        break;
      case "personFade":
        processPersonFadeOut(event);
        break;
      case "ending":
        processEnding();
        break;
      case "returnStart":
        processReturnStart();
        break;
      default:
        console.log("イベントが見つからないです");
    }
  }


  // セリフ処理関数
  function processDialogue(event) {
    if (event.dialogues.length > gameState.currentEventDialogueIndex) {
      const serif = event.dialogues[gameState.currentEventDialogueIndex]; //〇番目のセリフの配列を取得
      console.log(serif);
      $('#message-name').text(serif.name);
      $('#message-txt').text(serif.text);
      gameState.currentEventDialogueIndex++;
    } else {
      const event = gameEvents.find(e => e.id === gameState.currentEventId);
      gameState.currentEventDialogueIndex = 0;
      gameState.currentEventId = event.nextEvent;
      console.log(gameState.currentEventId);
      displayEvent(gameState.currentEventId)
    }
  }

  //背景切り替え関数
  function processImage(event) {
    const path = event.imagePath;
    arrowClick = false;
    $('.game-wrapper').fadeOut(400, function () {
      $('.game-wrapper').css('background-image', `url('${path}')`).fadeIn(400);
    });
    setTimeout(function () {
      arrowClick = true;
    }, 2000);
    gameState.currentEventDialogueIndex = 0;
    gameState.currentEventId = event.nextEvent;
    console.log(gameState.currentEventId);
    displayEvent(gameState.currentEventId)
  }

  // キャラ切り替え
  function processPerson(event) {
    const path = event.imagePath;
    arrowClick = false;
    $('#person-img').fadeOut(0);
    $('#person-img').attr('src', path)
    $('#person-img').fadeIn();
    setTimeout(function () {
      arrowClick = true;
    },
      1000);
    console.log('キャラ切り替え');
    gameState.currentEventDialogueIndex = 0;
    gameState.currentEventId = event.nextEvent;
    console.log(gameState.currentEventId);
    displayEvent(gameState.currentEventId);
  }

  // キャラ退場
  function processPersonFadeOut(event) {
    console.log('キャラ退場');
    $('#person-img').fadeOut(100);
    gameState.currentEventDialogueIndex = 0;
    gameState.currentEventId = event.nextEvent;
    console.log(gameState.currentEventId);
    displayEvent(gameState.currentEventId);
  }

  //BGM再生
  function processSound(event) {

    if (currentBGM) {
      currentBGM.pause();
      currentBGM.currentTime = 0;
    }
    const soundPath = event.soundPath;
    currentBGM = new Audio(`${soundPath}`);
    currentBGM.loop = true;
    currentBGM.volume = 0.2;
    currentBGM.play();
    gameState.currentEventDialogueIndex = 0;
    gameState.currentEventId = event.nextEvent;
    console.log(gameState.currentEventId);
    displayEvent(gameState.currentEventId);
  }

  // BGMストップ関数
  function stopSound(event) {
    if (currentBGM) {
      currentBGM.pause();
      currentBGM.currentTime = 0;
      currentBGM = null;
      console.log('BGM停止');
      gameState.currentEventDialogueIndex = 0;
      gameState.currentEventId = event.nextEvent;
      console.log(gameState.currentEventId);
      displayEvent(gameState.currentEventId);
    }
  }
  // 効果音再生関数
  function processSoundEffect(event) {
    const audio = new Audio(soundPath);
    audio.play();
    console.log('効果音');
    gameState.currentEventDialogueIndex = 0;
    gameState.currentEventId = event.nextEvent;
    console.log(gameState.currentEventId);
    displayEvent(gameState.currentEventId);
  }

  // 選択肢を生成する関数
  function renderChoice(event, callBack) {
    const choices = event.choices;
    const $choicesContainer = $('.choice-area');
    $choicesContainer.empty();

    choices.forEach((choice, index) => {
      const $btn = $('<button>')
        .addClass('choice-btn')
        .text(choice.text) // choice.text に表示用の文字列を持たせる想定
        .on('click', function () {
          callBack(index);
        });

      $choicesContainer.append($btn);
    });
  }

  // 選択された選択肢に処理を実行する関数
  function processChoice(index) {
    const currentEvent = gameEvents.find(e => e.id === gameState.currentEventId);
    const choice = currentEvent.choices[index];
    gameState.affection += choice.affection;

    gameState.currentEventId = choice.nextEvent;
    gameState.currentEventDialogueIndex = 0;

    $('.choice-area').empty();

    displayEvent(choice.nextEvent);
    console.log('選択肢を選んだ');
  }

  // エンディング判定関数
  function processEnding() {
    const affection = gameState.affection;
    if (affection >= 100) {
      displayEvent("changePerson-trueEnd");
    } else {
      displayEvent("badEnd");
    }
  }

  // スタート画面に戻る処理
  function processReturnStart() {
    $('.game-wrapper').fadeOut();
    $('#start-wrapper').fadeIn(2000);
    currentBGM.pause();
    gameState.currentEventId = "start_game";
    currentEventDialogueIndex =0;
    affection = 0;
  }

  // ここまで
});


