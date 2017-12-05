// A layer will use the global envelope if none is provided for it

class Engine {
	constructor() {
		//this.ready = false;
		console.log("Engine class created.");
		// Define the instruments
		this.patches = GetPatches();

		/*let loadedCount = 0;
		let bufferCount = 0;

		let patches = this.getInstruments();

		for (let i = 0; i < patches.length; i++) {
			bufferCount += this.patches[patches[i]].layers.length;
		}*/

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

						// mark this one as loaded
						/*loadedCount += 1;
						if (loadedCount == bufferCount)
							this.ready = true;*/
					});
				};

				request.send();
			});
		}

		this.ready = true;
	}

	noteOn(userID, noteNumber, instrument="Piano", velocity=1.0) {
		//if (!this.ready)
		//	return;
		/*console.log("Note on called.");
		console.log("userID:" + userID);
		console.log("noteNumber" + noteNumber.toString());
		console.log("instrument:" + instrument);
		console.log("velocity:" + velocity.toString());*/
		this.playNote(userID, instrument, noteNumber, velocity);
	}

	noteOff(userID, noteNumber) {
		//if (!this.ready)
		//	return;
		/*console.log("Note off called.");
		console.log("userID:" + userID);
		console.log("noteNumber" + noteNumber.toString());*/
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
		if (source.buffer == null || source.buffer == undefined)
			return;
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

		// I realize that this code implies that layers can overlap.
		// As it turns out, layers can most decidedly not overlap.

		for (let i in layersToPlay) {
			let layer = layersToPlay[i];
			let doesLoop = (layer.loop != undefined) && (layer.loop);
			let envelope;
			if (layer.envelope != undefined)
				envelope = layer.envelope;
			else
				envelope = patch.envelope;
			this.playSample(layer.filename, midiNumber - layer.centerNote, envelope, uniqueID, velocity, doesLoop);
		}
	}

	releaseNote(userID, midiNumber) {
		let uniqueID = userID + midiNumber.toString();
		this.releaseSample(uniqueID);
	}
}