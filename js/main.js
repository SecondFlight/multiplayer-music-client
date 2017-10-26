// Define the instruments
let patches = [
	{
		"name": "Piano",
		"layers": [
			{
				"filename": "audio/piano.wav",
				"startNote": 0,
				"endNote": 127
			}
		]
	}
]

let keyboardMap = {
	"q":0,
	"2":1,
	"w":2,
	"3":3,
	"e":4,
	"r":5,
	"5":6,
	"t":7,
	"6":8,
	"y":9,
	"7":10,
	"u":11,
	"i":12,
	"9":13,
	"o":14,
	"0":15,
	"p":16,
	"[":17,
	"=":18,
	"]":19,
	"/":4,
	";":3,
	".":2,
	"l":1,
	",":0,
	"m":-1,
	"j":-2,
	"n":-3,
	"h":-4,
	"b":-5,
	"g":-6,
	"v":-7,
	"c":-8,
	"d":-9,
	"x":-10,
	"s":-11,
	"z":-12
}

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Webkit/blink browsers need prefix, Safari won't work without window
// code examples are nice

let buffers = {};

// Load the audio files
patches.forEach(function(patch) {
	patch.layers.forEach(function(layer) {
		let request = new XMLHttpRequest();

		request.open('GET', layer.filename, true);

		request.responseType = 'arraybuffer';

		request.onload = function() {
			let dataBuffer = request.response;

			audioCtx.decodeAudioData(dataBuffer, function(buffer) {
				buffers[layer.filename] = buffer;
			});
		};

		request.send();
	});
});

let playnote = function(audioFile, coarseDetune) {
	let source = audioCtx.createBufferSource();
	source.buffer = buffers[audioFile];
	source.connect(audioCtx.destination);
	source.detune.value = 100*coarseDetune;
	source.start(0);
}


// modified from https://stackoverflow.com/a/10467137/8166701
function KeyListener(){
    this.keysStatus = Array();
    
    //Constructor
    $(document).keydown(
        function(e){
            e.preventDefault();
            KeyListener.onKeyDown(e);
        }
    );
    $(document).keyup(
        function(e){
            e.preventDefault();
            KeyListener.onKeyUp(e);
        }
    );
    
    this.onKeyDown = function(e){
        var keyCode = e.keyCode;
        if(this.keysStatus[keyCode]){
            //consoleOutput('Key ['+keyCode+'] Hold <br/>');
        } else {
            this.keysStatus[keyCode] = new Date();
            
            const keyName = e.key;
            const keyNum = keyboardMap[keyName];
			if (keyNum != undefined) {
				playnote("audio/piano.wav", keyNum);
			}

            //this.detectCombinations();
        }
    }
    
    this.onKeyUp = function(e){
        var keyCode = e.keyCode;
        var keyDownDate = this.keysStatus[keyCode];
        var keyUpDate = new Date();
        var keyHoldTime = keyUpDate-keyDownDate;
        this.keysStatus[keyCode] = false;

        // do things maybe
    }
    
    /*this.detectCombinations = function(){
        if(this.keysStatus[17] && this.keysStatus[66]){
            consoleOutput('Combination CTRL+B detected <br/>');
        }
    }*/
}

var KeyListener = new KeyListener();