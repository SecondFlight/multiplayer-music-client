// The proper thing to do would be to stop the actual source audio
// when the envelope stops.
// *shrug*

class Engine {
	constructor() {
		console.log("Engine class created.");
		// Define the instruments
		this.patches = {
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
				],
				"envelope": {
					attackTime: 0,
					decayTime: 0,
					sustainLevel: 1,
					releaseTime: 0.5,
					curve: "exponential"
				}
			},
			"Sine Bell": {
				"layers": [
					{
						"filename": "audio/sineC4.ogg",
						"startNote": 0,
						"endNote": 127,
						"centerNote": 72,
						"loop": true
					}
				],
				"envelope": {
					attackTime: 0,
					decayTime: 3,
					sustainLevel: 0.9,
					releaseTime: 7,
					curve: "exponential"
				}
			}
		}

		this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		// Webkit/blink browsers need prefix, Safari won't work without window
		// code examples are nice

		this.buffers = {};
		this.activeBufferSources = {};
		this.ampEnvelopes = {};

		if (this.audioCtx == undefined) {
			console.log("AAAAAAAAAAAAAAA");
		}

		// Load the audio files
		for (let patchName in this.patches) {
			let patch = this.patches[patchName];
			patch.layers.forEach((layer) => {
				let request = new XMLHttpRequest();

				request.open('GET', layer.filename, true);

				request.responseType = 'arraybuffer';

				request.onload = () => {
					let dataBuffer = request.response;

					this.audioCtx.decodeAudioData(dataBuffer, (buffer) => {
						this.buffers[layer.filename] = buffer;
					});
				};

				request.send();
			});
		}


	}

	noteOn(userID, noteNumber, instrument="Piano", velocity=1.0) {
		console.log("Note on called.");
		console.log("userID:" + userID);
		console.log("noteNumber" + noteNumber.toString());
		console.log("instrument:" + instrument);
		console.log("velocity:" + velocity.toString());
		this.playNote(userID, instrument, noteNumber, velocity);
	}

	noteOff(userID, noteNumber) {
		console.log("Note off called.");
		console.log("userID:" + userID);
		console.log("noteNumber" + noteNumber.toString());
		this.releaseNote(userID, noteNumber);
	}

	getInstruments() {
		let instruments = [];
		for (let patchName in this.patches) {
			instruments.push(patchName);
		}
		return instruments;
	}

	// Takes a file to play and a tuining value and plays the file
	playSample(audioFile, coarseDetune, ampEnvSettings, uniqueID, velocity, doesLoop) {
		this.releaseSample(uniqueID);

		let currentTime = this.audioCtx.currentTime;

		let source = this.audioCtx.createBufferSource();
		source.buffer = this.buffers[audioFile];
		source.detune.value = 100*coarseDetune;
		source.loop = doesLoop;

		let ampEnvGain = this.audioCtx.createGain();

		this.ampEnvelopes[uniqueID] = new Envelope(this.audioCtx, ampEnvSettings);
		this.ampEnvelopes[uniqueID].connect(ampEnvGain.gain);
		ampEnvGain.gain.value = 0;

		let sampleTime = source.buffer.length / this.audioCtx.sampleRate;

		this.ampEnvelopes[uniqueID].start(currentTime);
		//this.ampEnvelopes[uniqueID].stop(currentTime + sampleTime);

		let velocityGain = this.audioCtx.createGain();
		velocityGain.gain.value = velocity;

		source.connect(ampEnvGain);
		ampEnvGain.connect(velocityGain);
		velocityGain.connect(this.audioCtx.destination);
		source.start(currentTime);

		this.activeBufferSources[uniqueID] = source;
	}

	releaseSample(uniqueID) {
		if (this.ampEnvelopes[uniqueID] == undefined)
			return;

		let currentTime = this.audioCtx.currentTime;

		this.ampEnvelopes[uniqueID].release(currentTime);
		let stopAt = this.ampEnvelopes[uniqueID].getReleaseCompleteTime();
		this.ampEnvelopes[uniqueID].stop(stopAt);
		this.activeBufferSources[uniqueID].stop(stopAt);

		this.ampEnvelopes[uniqueID] = undefined;
		this.activeBufferSources[uniqueID] = undefined;
	}

	// Plays a note given an instrument and a midi number
	playNote(userID, instrument, midiNumber, velocity) {
		let patch = this.patches[instrument];
		if (patch == undefined) {
			return;
		}

		let layersToPlay = [];

		for (let i in patch.layers) {
			let layer = patch.layers[i];
			if ((midiNumber >= layer.startNote) && (midiNumber <= layer.endNote)) {
				layersToPlay.push(layer);
			}
		}

		let uniqueID = userID + midiNumber.toString();

		// I realize that this coding implies that layers can overlap.
		// As it turns out, layers can most decidedly not overlap.

		for (let i in layersToPlay) {
			let layer = layersToPlay[i];
			let doesLoop = (layer.loop != undefined) && (layer.loop);
			this.playSample(layer.filename, midiNumber - layer.centerNote, patch.envelope, uniqueID, velocity, doesLoop);
		}
	}

	releaseNote(userID, midiNumber) {
		let uniqueID = userID + midiNumber.toString();
		this.releaseSample(uniqueID);
	}
}