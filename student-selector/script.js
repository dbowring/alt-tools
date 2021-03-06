(function($) {
  var selector = null;
  var audio = {};

  var initialize = function() {
    setupEvents();
    setupAudio();
    $('input').first().focus();
  };

  /* **************************************************************************
  Methods
  ************************************************************************** */

  var setupEvents = function() {
    $('#start').click(resetSelector);
    $(window).resize(windowResize);
  };

  var setupAudio = function() {
    audio.spin = new Sound('spin.ogg', true);
    audio.ding = new Sound('ding.ogg');
  };

  var windowResize = function() {
    if (selector) {
      selector.render($('#main-ui'));
    }
  };

  var resetSelector = function() {
    var cycle = $('#doRounds').is(':checked');
    var useSound = $('#sound').is(':checked');
    var alt = $('#alt').val()
    var jte = $('#jte').val()
    selector = new StudentSelector(cycle, useSound);
    try {
      _addStudentsEl('Boys');
      _addStudentsEl('Girls');
    } catch (e) {
      console.error(e);
      return false;
    }
    if (alt.length > 0) {
      selector.students.push(new Teacher(alt, 'teacher'))
    }
    if (jte.length > 0) {
      selector.students.push(new Teacher(jte, 'teacher'))
    }
    if (selector.isUsable()) {
      initialRender();
    }
  };

  var _intVal = function(selector) {
    return parseInt($(selector).val());
  }

  var _addStudentsEl = function(style) {
    var start = _intVal('#rangeStart' + style),
      end = _intVal('#rangeEnd' + style);
    if (isNaN(start) || isNaN(end)) {
      throw "invalid input";
    }
    if (end < start || (end === 0 && start === 0)) {
      return;  // Invalid or disabled
    }

    selector.addStudents(start, end, style);
  };

  var initialRender = function() {
    $('#setup').addClass('hidden');
    var target = $('#main-ui');
    target.removeClass('hidden');
    selector.render(target);
  };

  var reconfigure = function() {
    // Forget current selector
    selector = null;
    $('#main-ui').addClass('hidden');
    $('#setup')
      .removeClass('hidden')
      .find('input').first().focus();
  };

  var selectNext= function() {
    selector.selectNext();
    selector.render($('#main-ui'));
  };

  var animatedSelectNext = function() {
    var pool = selector.getPool();
    if (pool.length === 1) {
      // Don't animate one number...
      return selectNext();
    }
    var flickerCount = 0;
    var flickerNumber;
    if (Math.random() < 0.05) {
      flickerNumber = 200;
    } else {
      flickerNumber = Math.floor(Math.random() * 30) + 10
    }
    var currentDiv = $('.current-student');
    var last;
    $('.ctrl-wrapper button').hide();
    currentDiv.addClass('flickering');
    if (this.current) {
      currentDiv.removeClass(this.current.style);
    }
    var flicker = function() {
      if (flickerCount < flickerNumber) {
        flickerCount++;
        var next = randomChoice(pool)
        if (last) {
          currentDiv.removeClass(last.style);
        }
        currentDiv.text(next.number);
        currentDiv.addClass(next.style);
        last = next;
        var delay = Math.floor(Math.random()* 90) + 25;
        window.setTimeout(flicker, delay);
      } else {
        selectNext();
        if (selector.useSound) {
          audio.spin.stop();
          audio.ding.play();
        }
      }
    };
    if (selector.useSound) {
      audio.spin.play();
    }
    flicker();
  };

  var randomChoice = function(pool) {
    Math.random(); // Chrome correlation bug
    var index = Math.floor(Math.random() * pool.length);
    return pool[index];
  };

  var formatNumber = function(n) {
    var s = n.toString();
    if (s.length === 1) {
      return '0' + s;
    }
    return s;
  };

  /* **************************************************************************
    Classes
  ************************************************************************** */
  var Student = function(number, style) {
    this.number= formatNumber(number);
    this.style = style;
    this.selectedCount = 0;
  };

  var Teacher = function(name, style) {
    this.number = name;
    this.style = style;
    this.selectedCount = 0;
  };

  var StudentSelector = function(doRounds, useSound) {
    this.doRounds = !!doRounds;
    this.useSound = !!useSound;
    this.students = [];
    this.selectionRound = 0;
    this.current = null;
  };

  StudentSelector.prototype.isUsable = function() {
    return this.students.length > 0;
  };

  StudentSelector.prototype.addStudents= function(start, end, style) {
    // `end` is inclusive
    for (var i=start; i<=end; i++) {
      this.students.push(new Student(i, style));
    }
  };

  StudentSelector.prototype._getPoolCurrent = function() {
    var pool = [];
    for (var i=0; i<this.students.length; i++) {
      if (this.students[i].selectedCount === this.selectionRound) {
        pool.push(this.students[i]);
      }
    }
    if (pool.length === 0) {
      pool = this.students;
      this.selectionRound++;
    }
    return pool;
  };

  StudentSelector.prototype.getPool = function() {
    if (this.doRounds) {
      return this._getPoolCurrent();
    }
    return this.students;
  };

  StudentSelector.prototype.selectNext= function() {
    var pool = this.getPool();

    this.current = randomChoice(pool);
    if (this.doRounds) {
      this.current.selectedCount++;
    }
  };

  StudentSelector.prototype.render = function(target) {
    target.empty();
    var ul = $(document.createElement('ul'));
    target.append(ul);
    ul.addClass('students');
    for (var i=0; i<this.students.length; i++) {
      ul.append(this._renderStudent(this.students[i]));
    }
    var width = ul.outerWidth() / this.students.length;
    ul.find('.student').width(width);

    var currentDiv = $(document.createElement('div'));
    currentDiv
      .addClass('current-student')
      .addClass(this.current ? this.current.style : 'none')
      .text(this.current ? this.current.number : '--');
    target.append(currentDiv);

    var nextBtn = $(document.createElement('button'))
      .text('Next')
      .click(animatedSelectNext)
    var resetBtn = $(document.createElement('button'))
      .text('Reset')
      .click(resetSelector);
    var reconfigureBtn = $(document.createElement('button'))
      .text('Reconfigure')
      .click(reconfigure);
    target
      .append(
        $(document.createElement('div'))
          .addClass('ctrl-wrapper')
          .append(nextBtn)
          .append(resetBtn)
          .append(reconfigureBtn)
      );
    nextBtn.focus();
  };

  StudentSelector.prototype._renderStudent = function(student) {
    var li = $(document.createElement('li'));
    li
      .text(student.number)
      .addClass('student')
      .addClass(student.style)
      .addClass(
        student.selectedCount === this.selectionRound ? 'pool-in' : 'pool-out'
      );
    if (student.constructor === Teacher) {
      li.text('??');
    }
    return li;
  };


  $(initialize);
}(jQuery));
