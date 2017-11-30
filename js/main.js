// Maps keys on typing keyboard to midi notes
let keyboardMap = {"0":87,"2":73,"3":75,"5":78,"6":80,"7":82,"9":85,"q":72,"w":74,"e":76,"r":77,"t":79,"y":81,"u":83,"i":84,"o":86,"p":88,"[":89,"=":90,"]":91,"/":76,";":75,".":74,"l":73,",":72,"m":71,"j":70,"n":69,"h":68,"b":67,"g":66,"v":65,"c":64,"d":63,"x":62,"s":61,"z":60}

var socket = io("music.atoms.one:3000");

let engine = new Engine();

let instruments = engine.getInstruments();
let currentInstrument = instruments[0];
let midiConnected = false;

//https://www.w3schools.com/js/tryit.asp?filename=tryjs_prompt
var userName = "";
window.onload = function(){
	var txt;
	userName = prompt("Please Enter your Username: ", "" );
	if (userName == null || userName == "") {
        userName = "Anonymous";
    }

    instrumentSelectBox = document.getElementById("instrumentSelect");
    for (let i = 0; i < instruments.length; i++) {
        instrumentSelectBox.options[instrumentSelectBox.options.length] = new Option(instruments[i], instruments[i]);
    }
    instrumentSelectBox.addEventListener("change", event => {
        currentInstrument = event.target.value;
    });
};


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
    
    this.onKeyDown = function(event){
        var keyCode = event.keyCode;
        if(this.keysStatus[keyCode]){
            //consoleOutput('Key ['+keyCode+'] Hold <br/>');
        } else {
            this.keysStatus[keyCode] = new Date();
            
            const keyName = event.key;
            const keyNum = keyboardMap[keyName];
			if (keyNum != undefined) {
				engine.noteOn(userName, keyNum);
                pingServer(userName, keyNum, 'note on', "Piano", 1.0);
			}
			var keyElementColour = document.querySelector("[data-notenumber='" + keyNum.toString() + "']");
			keyElementColour.style.backgroundColor = "red";
			//setTimeout( function() { keyElementColour.removeAttribute("style");}, 500);

            //this.detectCombinations();
        }
    }
    
    this.onKeyUp = function(event){
        var keyCode = event.keyCode;
        var keyDownDate = this.keysStatus[keyCode];
        var keyUpDate = new Date();
        var keyHoldTime = keyUpDate-keyDownDate;
        this.keysStatus[keyCode] = false;
		
		const keyName = event.key;
        const keyNum = keyboardMap[keyName];

        if (keyNum != undefined) {
            engine.noteOff(userName, keyNum);
            pingServer(userName, keyNum, 'note off');
        }

		var keyElementColour = document.querySelector("[data-notenumber='" + keyNum.toString() + "']");
		keyElementColour.removeAttribute("style");
        // do things maybe
    }
    
    /*this.detectCombinations = function(){
        if(this.keysStatus[17] && this.keysStatus[66]){
            consoleOutput('Combination CTRL+B detected <br/>');
        }
    }*/
}


var noteKeys = document.getElementsByClassName("note");
for (var i = 0; i < noteKeys.length; i++)
{
	var element = noteKeys[i];
	element.addEventListener("click", function(event) {
		engine.noteOn(userName, parseInt(event.target.dataset.notenumber));
		event.style.backgroundColor = "red";
		setTimeout( function() { event.target.removeAttribute("style");}, 500);
		pingServer(userName, parseInt(event.target.dataset.notenumber), 'note on', "Piano", 1.0);
	});
	
	/*element.addEventListener("mouseUp", function(event) {
		engine.noteOn(userName, parseInt(event.target.dataset.notenumber));
	});*/
}

var KeyListener = new KeyListener();

function pingServer(userID, noteNumber, msgType, instrument = "", velocity = 0){
	socket.emit(msgType, { 
		userID: userID,
		noteNumber: noteNumber,
		instrument: instrument,
		velocity: velocity} );
}

socket.on('note on', function(msg) {
	engine.noteOn(msg.userID, msg.noteNumber, msg.instrument, msg.velocity);
});

socket.on('note off', function(msg) {
    engine.noteOff(msg.userID, msg.noteNumber);
});

document.getElementById("midiButton").addEventListener("click", function(event) {
    if (!midiConnected && navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(midi => {
            let inputs = midi.inputs.values();
            for (let input = inputs.next();
                 input && !input.done;
                 input = inputs.next()) {
                input.value.onmidimessage = message => {
                    if (message.data[0] == 145) {
                        engine.noteOn(userName, message.data[1], currentInstrument, message.data[2]/127);
                        pingServer(userName, message.data[1], "note on", currentInstrument, message.data[2]/127);
                    }
                    else if (message.data[0] == 129) {
                        engine.noteOff(userName, message.data[1]);
                        pingServer(userName, message.data[1], "note off");
                    }
                };
                midiConnected = true;
            }
        });
    }
});