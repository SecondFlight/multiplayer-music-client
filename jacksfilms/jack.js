/*
Copyright 2017 Joshua Wade
https://github.com/SecondFlight

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// https://stackoverflow.com/a/18120786/8166701
Element.prototype.remove = function() {
  this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
  for(var i = this.length - 1; i >= 0; i--) {
    if(this[i] && this[i].parentElement) {
      this[i].parentElement.removeChild(this[i]);
    }
  }
}

let startTime = 0;

let happyCouples = [];

let strangeness = 1;

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let distortion = audioCtx.createWaveShaper();

// from https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode
function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
};

distortion.curve = makeDistortionCurve(strangeness);
distortion.connect(audioCtx.destination);


let buffer;

let request = new XMLHttpRequest();

request.open('GET', "jack/jack.ogg", true);

request.responseType = 'arraybuffer';

request.onload = function() {
  let dataBuffer = request.response;

  audioCtx.decodeAudioData(dataBuffer, function(thisBuffer) {
    buffer = thisBuffer;
  }).then(
    function() {
      document.getElementById("loading").remove();
      document.body.onclick = addAHappyCouple;
      window.requestAnimationFrame(jack);
    }
  );
};

request.send();

let createJack = function() {
  let source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(distortion);
  source.loop = true;
  return source;
}

let updateValues = function(value) {
  distortion.curve = makeDistortionCurve(value*10);
}

// main function to place down the happy couple
let addAHappyCouple = function(event) {
  happyCouple = {
    "element": document.createElement('img'),
    "audioBuffer": createJack(),
    "visualizer": audioCtx.createAnalyser(),
    "origX": event.clientX,
    "origY": event.clientY,
    "angle": getRandomAngle()
  };

  happyCouples.push(happyCouple);

  happyCouple["element"].src = 'jack/jack.jpg';
  happyCouple["element"].style.position = 'absolute';
  happyCouple["element"].style.left = event.clientX - 151;
  happyCouple["element"].style.top = event.clientY - 80;
  happyCouple["element"].style.width = '302px';
  document.body.appendChild(happyCouple["element"]);

  happyCouple["audioBuffer"].start(startTime);

  happyCouple["visualizer"].fftSize = 512;

  happyCouple["audioBuffer"].connect(happyCouple.visualizer);

  happyCouple["dataArray"] = new Uint8Array(happyCouple["visualizer"].fftSize);

}

// main update function, had to call at least one of them jack because come on
let jack = function(timestamp) {
  for (let i = 0; i < happyCouples.length; i++) {
    happyCouple = happyCouples[i];
    happyCouple["visualizer"].getByteTimeDomainData(happyCouple["dataArray"]);
    let amt = 0;
    
    for (let j = 0; j < happyCouple["visualizer"].fftSize; j++) {
      if (happyCouple["dataArray"][j] > amt) {
        amt = happyCouple["dataArray"][j];
      }
    }

    amt = amt - 128;
    
    // if (amt < 10) {
    //   happyCouple["angle"] = getRandomAngle();
    // }

    xAmt = Math.cos(happyCouple["angle"])*amt;
    yAmt = Math.sin(happyCouple["angle"])*amt;

    happyCouple["element"].style.left = happyCouple["origX"] - 151 + xAmt;
    happyCouple["element"].style.top = happyCouple["origY"] - 80 + yAmt;
  }
  window.requestAnimationFrame(jack);
}

let getRandomAngle = function() {
  return Math.random() * 2 * Math.PI;
}
