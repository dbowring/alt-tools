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
    var display = null, ready = false, nextTimer = null, timeout = null;
    var finishAt = null;
    var elements = {
      countdown: $('#countdown'),
      totalTime: $('#totalTime')
    }
    
    var init = function() {
      setupEvents();
      $('#main-ui').hide();
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
      display.postMessage({cmd: 'beep'}, '*');
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

    var onTimerEnd = function() {
      timeout = null;
      finishAt = null;
      display.postMessage({cmd: 'explode'}, '*');
    }

    var setupEvents = function() {
      $('#start').click(onStart);
      $('#show').click(showDisplay);
    };

    var onStart = function() {
      var min = parseInt($('#minSeconds').val());
      var splash = parseInt($('#splash').val());
      var time = min + Math.random() * splash;
      setTimer(time);
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
    var parent = window.opener.window, timer = null, timeout = null;
    var audio = {
      beep: document.createElement('audio'),
      explode: document.createElement('audio')
    };
    audio.beep.src = 'beep.ogg';
    audio.beep.loop = true;
    audio.beep.preload = 'auto';
    audio.explode.src = 'explode.ogg';
    audio.explode.preload = 'auto';
    

    var init = function() {
      $('#setup').hide();
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
        audio.explode.pause();
        audio.explode.currentTime = 0;
        audio.beep.play();
      } else if (data.cmd === 'explode') {
        $('.flasher').removeClass('active').addClass('exploded');
        audio.beep.pause();
        audio.beep.currentTime = 0;
        audio.explode.play();
      }
    };

    return {
      init: init,
      onMessage: onMessage
    };
  };

  




  $(init);

}(jQuery));