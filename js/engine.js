// Define the instruments
let patches = {
	"Piano": {
		"layers": [
			{
				"filename": "audio/pianoC2.ogg",
				"startNote": 0,
				"endNote": 39,
				"centerNote": 36
			},
			{
				"filename": "audio/pianoG2.ogg",
				"startNote": 40,
				"endNote": 45,
				"centerNote": 43
			},
			{
				"filename": "audio/pianoC3.ogg",
				"startNote": 46,
				"endNote": 51,
				"centerNote": 48
			},
			{
				"filename": "audio/pianoG3.ogg",
				"startNote": 52,
				"endNote": 57,
				"centerNote": 55
			},
			{
				"filename": "audio/pianoC4.ogg",
				"startNote": 58,
				"endNote": 63,
				"centerNote": 60
			},
			{
				"filename": "audio/pianoG4.ogg",
				"startNote": 64,
				"endNote": 69,
				"centerNote": 67
			},
			{
				"filename": "audio/pianoC5.ogg",
				"startNote": 70,
				"endNote": 75,
				"centerNote": 72
			},
			{
				"filename": "audio/pianoG5.ogg",
				"startNote": 76,
				"endNote": 81,
				"centerNote": 79
			},
			{
				"filename": "audio/pianoC6.ogg",
				"startNote": 82,
				"endNote": 87,
				"centerNote": 84
			},
			{
				"filename": "audio/pianoG6.ogg",
				"startNote": 88,
				"endNote": 93,
				"centerNote": 91
			},
			{
				"filename": "audio/pianoC7.ogg",
				"startNote": 94,
				"endNote": 99,
				"centerNote": 96
			},
			{
				"filename": "audio/pianoG7.ogg",
				"startNote": 100,
				"endNote": 105,
				"centerNote": 103
			},
			{
				"filename": "audio/pianoC8.ogg",
				"startNote": 106,
				"endNote": 127,
				"centerNote": 108
			}
		]
	}
}

// Maps keys on typing keyboard to midi notes
let keyboardMap = {"0":87,"2":73,"3":75,"5":78,"6":80,"7":82,"9":85,"q":72,"w":74,"e":76,"r":77,"t":79,"y":81,"u":83,"i":84,"o":86,"p":88,"[":89,"=":90,"]":91,"/":76,";":75,".":74,"l":73,",":72,"m":71,"j":70,"n":69,"h":68,"b":67,"g":66,"v":65,"c":64,"d":63,"x":62,"s":61,"z":60}

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Webkit/blink browsers need prefix, Safari won't work without window
// code examples are nice

let buffers = {};

// Load the audio files
for (let patchName in patches) {
	let patch = patches[patchName];
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
}

// Takes a file to play and a tuining value and plays the file
let playSample = function(audioFile, coarseDetune) {
	let source = audioCtx.createBufferSource();
	source.buffer = buffers[audioFile];
	source.connect(audioCtx.destination);
	source.detune.value = 100*coarseDetune;
	source.start(0);
}

// Plays a note given an instrument and a midi number
let playNote = function(instrument, midiNumber) {
	let patch = patches[instrument];
	if (patch == undefined) {
		return;
	}

	layersToPlay = [];

	for (let i in patch.layers) {
		let layer = patch.layers[i];
		if ((midiNumber >= layer.startNote) && (midiNumber <= layer.endNote)) {
			layersToPlay.push(layer);
		}
	}

	for (let i in layersToPlay) {
		let layer = layersToPlay[i];
		playSample(layer.filename, midiNumber - layer.centerNote);
	}
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
				playNote("Piano", keyNum);
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