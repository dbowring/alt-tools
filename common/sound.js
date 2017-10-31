
var SoundHtml5 = function(src, loop) {
    this.element = document.createElement('audio');
    this.element.src = src;
    this.element.loop = !!loop;
    this.element.preload = 'auto';
    this.loop = !!loop;
    this.loaded = false;
    var self = this;
    this.element.addEventListener('load', function() {
        self.loaded = true;
    });
};

SoundHtml5.prototype.play = function() {
  this.element.play();
};

SoundHtml5.prototype.stop = function() {
  this.element.pause();
  this.element.currentTime = 0;
};

var SoundWAI = function(src, loop) {
    if (!SoundWAI.context) {
        SoundWAI.context = new AudioContext();
    }
    var self = this;
    this.loaded = false;
    this.loop = !!loop;

    var request = new XMLHttpRequest();
    request.open('GET', src, true);
    request.responseType = 'arraybuffer';

    request.addEventListener('load', function() {
        SoundWAI.context.decodeAudioData(request.response, function(buffer) {
            self.buffer = buffer;
            self.loaded = true;
        });
    });
    request.send();
};

SoundWAI.prototype.play = function() {
    this.source = SoundWAI.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(SoundWAI.context.destination);
    this.source.loop = this.loop;
    this.source.start(0);
};

SoundWAI.prototype.stop = function() {
    if (this.source) {
        this.source.stop();
    }
};

var Sound = (window.location.protocol != 'file:' && window.AudioContext) ? SoundWAI : SoundHtml5;