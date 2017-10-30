(function($) {
  var manager = null;

  var isDisplay = function() {
    return window.location.hash === '#display';
  };

  var init = function() {
    manager = isDisplay() ? DisplayManager() : ControlManager();
    window.addEventListener('message', manager.onMessage)
    manager.init();
  };

  var ControlManager = function() {
    var display = null, ready = false, nextTimer = null, timeout = null,
        displayTimer = false;
    var finishAt = null;
    var elements = {
      countdown: $('#setup #countdown'),
      totalTime: $('#totalTime'),
      optDisplayTimer: $('#displayTimer'),
      optIsContinious: $('#isContinious'),
      optRollWait: $('#rollWait'),
    }

    var init = function() {
      setupEvents();
      $('#main-ui').hide();
      $('title').text('Bomb Timer Controls');
    };

    var showDisplay = function() {
      if (!display || display.closed) {
        ready = false;
        display = window.open('index.html#display');
      } else {
        console.log('display already shown');
      }
    };
    var displayReady = function() {
      return (display && !display.closed) && ready;
    };

    var setTimer = function(seconds) {
      if (displayReady()) {
        _setTimer(seconds);
      } else {
        showDisplay();
        nextTimer = seconds;
      }
    };

    var _setTimer = function(seconds) {
      if (!!timeout) {
        window.clearTimeout(timeout);
        timeout = null;
        finishAt = null;
      }
      timeout = window.setTimeout(onTimerEnd, seconds * 1000);
      finishAt = new Date((new Date()).getTime() + (seconds * 1000));
      elements.totalTime.text(seconds.toFixed(3));
      showTimer();
      display.postMessage({cmd: 'beep', finishAt: displayTimer ? finishAt.getTime() : null}, '*');
    };

    var showTimer = function() {
      if (finishAt) {
        var now = new Date();
        var delta = finishAt.getTime() - now.getTime();
        var deltaText = (delta / 1000).toFixed(3);
        elements.countdown.text(deltaText);
        window.requestAnimationFrame(showTimer);
      } else {
        elements.countdown.text((0).toFixed(3));
      }
    };

    var postExplode = function() {
      if (elements.optIsContinious.is(':checked')) {
        setTimer(generateLength());
      }
    };

    var onTimerEnd = function() {
      timeout = null;
      finishAt = null;
      display.postMessage({cmd: 'explode'}, '*');
      var rollWait = parseFloat(elements.optRollWait.val());
      window.setTimeout(postExplode, rollWait * 1000);
    }

    var setupEvents = function() {
      $('#start').click(onStart);
      $('#show').click(showDisplay);
      $('#explode').click(forceExplode);
      elements.optDisplayTimer.click(updateDisplayTimer);

      window.addEventListener('unload', function() {
        if (display && !display.closed) {
          display.close();
        }
      });
    };

    var forceExplode = function() {
      if (timeout) {
        window.clearTimeout(timeout);
        timeout = null;
      }
      elements.optIsContinious.prop('checked', false);
      onTimerEnd();
    };

    var updateDisplayTimer = function() {
      displayTimer = !!elements.optDisplayTimer.is(':checked');
    };

    var generateLength = function() {
      var min = parseInt($('#minSeconds').val());
      var splash = parseInt($('#splash').val());
      return min + Math.random() * splash;
    };

    var onStart = function() {
      setTimer(generateLength());
    };

    var onMessage = function(event) {
      if (event.data && event.data.cmd) {
        onCommand(event.data, event.source);
      }
    };

    var onCommand = function(data, source) {
      if (data.cmd === 'hello') {
        ready = true;
        if (!!nextTimer) {
          _setTimer(nextTimer);
          nextTimer = null;
        }
      }
    };

    return {
      init: init,
      onMessage: onMessage
    };
  };

  var DisplayManager = function() {
    var parent = window.opener.window, timer = null, timeout = null,
        finishAt = null, lastBeep = null;
    var audio = {
      beep: new Howl({
        src: ['beep.ogg'],
        loop: true
      }),
      explode: new Howl({
        src: 'explode.ogg'
      })
    };
    var elements = {
      timer: $('#main-ui .countdown')
    };

    var init = function() {
      $('#setup').hide();
      $('title').text('Bomb Timer Display');
      parent.postMessage({cmd: 'hello'}, '*');
    };

    var onMessage = function(event) {
      if (event.data && event.data.cmd) {
        onCommand(event.data, event.source);
      }
    };

    var onCommand = function(data, source) {
      if (data.cmd === 'beep') {
        $('.flasher').removeClass('exploded').addClass('active');
        audio.explode.stop();
        lastBeep = audio.beep.play();
        finishAt = data.finishAt;
        updateCountdown()
      } else if (data.cmd === 'explode') {
        $('.flasher').removeClass('active').addClass('exploded');
        if (lastBeep) {
          audio.beep.stop(lastBeep);
          lastBeep = null;
        } else {
          audio.beep.stop();
        }
        audio.explode.play();
        finishAt = null;
      }
    };

    var updateCountdown = function() {
      if (!finishAt) {
        elements.timer.text('');
        return;
      }
      var delta = finishAt - (new Date()).getTime();
      if (delta <= 0) {
        elements.timer.text('');
        return;
      }

      elements.timer.text(getClockValue(delta));
      window.requestAnimationFrame(updateCountdown);
    };

    var getClockValue = function(delta) {
      var seconds = Math.floor(delta / 1000)
      var ms = delta % 1000;
      var minutes = Math.floor(seconds / 60);
      seconds -= minutes * 60;
      return zpad(minutes, 2) + ':' + zpad(seconds, 2) + ':' + zpad(ms, 3);
    };

    var zpad = function(intVal, spaces) {
      var s = intVal.toString();
      while (s.length < spaces) {
        s = '0' + s;
      }
      return s;
    };

    return {
      init: init,
      onMessage: onMessage
    };
  };


  $(init);

}(jQuery));