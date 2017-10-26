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

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Webkit/blink browsers need prefix, Safari won't work without window
// code examples are nice

let sources = {};

// Load the audio files
patches.forEach(function(patch) {
	patch.layers.forEach(function(layer) {
		let request = new XMLHttpRequest();

		request.open('GET', layer.filename, true);

		request.responseType = 'arraybuffer';

		request.onload = function() {
			let audioData = request.response;

			let source = audioCtx.createBufferSource();
			audioCtx.decodeAudioData(audioData).then(function(buffer) {
				source.buffer = buffer;

				source.connect(audioCtx.destination);

				// play the audio woot
				source.start(0);
			});
			sources[layer.filename] = source;
		};

		request.send();
	});
});