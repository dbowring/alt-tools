(function($) {
  var selector = null;

  var initialize = function() {
    setupEvents();
    $('input').first().focus();
  };

  /* **************************************************************************
  Methods
  ************************************************************************** */

  var setupEvents = function() {
    $('#start').click(resetSelector);
  };

  var resetSelector = function() {
    selector = new StudentSelector();
    _addStudentsEl('Boys');
    _addStudentsEl('Girls');
    initialRender();
  };

  var _addStudentsEl = function(style) {
    selector.addStudents(
      $('#rangeStart' + style).val(),
      $('#rangeEnd' + style).val(),
      style
    );
  };

  var initialRender = function() {
    $('#setup').addClass('hidden');
    var target = $('#main-ui');

    selector.render(target);

    target.removeClass('hidden');
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
    var flickerNumber = Math.floor(Math.random() * 10) + 5;
    var currentDiv = $('.current-student');
    $('.ctrl-wrapper button').hide();
    currentDiv.addClass('flickering');
    var flicker = function() {
      if (flickerCount < flickerNumber) {
        flickerCount++;
        currentDiv.text(randomChoice(pool).number);
        var delay = Math.floor(Math.random()* 50) + 25;
        window.setTimeout(flicker, delay);
      } else {
        selectNext();
      }
    };
    flicker();
  };

  var randomChoice = function(pool) {
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


  var StudentSelector = function() {
    this.students = [];
    this.selectionRound = 0;
    this.current = null;
  };

  StudentSelector.prototype.addStudents= function(start, end, style) {
    // `end` is inclusive
    for (var i=start; i<=end; i++) {
      this.students.push(new Student(i, style));
    }
  };

  StudentSelector.prototype.getPool = function() {
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

  StudentSelector.prototype.selectNext= function() {
    var pool = this.getPool();

    this.current = randomChoice(pool);
    this.current.selectedCount++;
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
      .text(this.current ? this.current.number : '--');
    target.append(currentDiv);

    var nextBtn = $(document.createElement('button'));
    nextBtn
      .text('Next')
      .click(animatedSelectNext)
    var resetBtn = $(document.createElement('button'));
    resetBtn
      .text('Reset')
      .click(resetSelector);
    target
      .append(
        $(document.createElement('div'))
          .addClass('ctrl-wrapper')
          .append(nextBtn)
          .append(resetBtn)
      );
    nextBtn.focus();
  };

  StudentSelector.prototype._renderStudent = function(student) {
    var li = $(document.createElement('li'));
    li
      .text(student.number)
      .addClass('student')
      .addClass(
        student.selectedCount === this.selectionRound ? 'pool-in' : 'pool-out'
      );
    return li;
  };


  $(initialize);
}(jQuery));