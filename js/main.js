// Maps keys on typing keyboard to midi notes
let keyboardMap = {"0":87,"2":73,"3":75,"5":78,"6":80,"7":82,"9":85,"q":72,"w":74,"e":76,"r":77,"t":79,"y":81,"u":83,"i":84,"o":86,"p":88,"[":89,"=":90,"]":91,"/":76,";":75,".":74,"l":73,",":72,"m":71,"j":70,"n":69,"h":68,"b":67,"g":66,"v":65,"c":64,"d":63,"x":62,"s":61,"z":60}

var socket = io("music.atoms.one:3000");

let engine = new Engine();

let instruments = engine.getInstruments();
let currentInstrument = instruments[0];
let currentMIDIDevice = "";
let midiConnected = false;

let octave = 0;

let color;

let users = {};

let userCounts = {};

//https://www.w3schools.com/js/tryit.asp?filename=tryjs_prompt
var userName = "";
window.onload = function(){
	let noteColorElem = document.getElementById("noteColor");
	color = new jscolor(noteColorElem);
	let r = parseInt(Math.random()*255);
	let g = parseInt(Math.random()*255);
	let b = parseInt(Math.random()*255);
	let rand = parseInt(Math.random()*3);
	if (rand == 0)
		r = 255;
	else if (rand == 1)
		g = 255;
	else
		b = 255;

	color.fromRGB(r, g, b);

	var txt;
	userName = prompt("Please enter your username: ", "");
	if (userName == null || userName == "") {
        userName = "Anonymous";
    }

    /*socket.emit("update user info", {
    	username: userName,
    	color: noteColorElem.value
    });*/
    UpdateUserInfo();

    noteColorElem.onchange = () => {
    	UpdateUserInfo();
    };

    instrumentSelectBox = document.getElementById("instrumentSelect");
    for (let i = 0; i < instruments.length; i++) {
        instrumentSelectBox.options[instrumentSelectBox.options.length] = new Option(instruments[i], instruments[i]);
    }
    instrumentSelectBox.addEventListener("change", event => {
        currentInstrument = event.target.value;
    });

	WebMidi.enable(error => {

		let midiSelectBox = document.getElementById("midiSelect");

		midiSelectBox.innerHTML = "";

		midiSelectBox.options[0] = new Option("(select a MIDI device)", "(select a MIDI device)");

		for (let i = 0; i < WebMidi.inputs.length; i++) {
			midiSelectBox.options[midiSelectBox.options.length] = new Option(WebMidi.inputs[i].name, WebMidi.inputs[i].name);
		}
		midiSelectBox.addEventListener("change", event => {
			for (let i = 0; i < WebMidi.inputs.length; i++) {
				WebMidi.inputs[i].removeListener('noteon');
				WebMidi.inputs[i].removeListener('noteoff');
			}
			let input = WebMidi.getInputByName(event.target.value);
			if (input == undefined || input == null)
				return;
			input.addListener("noteon", "all", event => {
				NoteOn(userName, event.data[1], currentInstrument, event.data[2]/127);
				console.log(event.data[2]/127);
			});
			input.addListener("noteoff", "all", event => {
				NoteOff(userName, event.data[1]);
			});
		});
	});
};

function AddColor(keyNum, color) {
	try {
	    let element = document.querySelector("[data-notenumber='" + keyNum.toString() + "']");
	    element.style.backgroundColor = color;
	}
	catch (e) {

	}
}

function RemoveColor(keyNum, previousColor) {
	try {
	    let element = document.querySelector("[data-notenumber='" + keyNum.toString() + "']");
	    if (rgb2hex(element.style.backgroundColor) == previousColor.toLowerCase()) {
	        element.removeAttribute("style");
	    }
	}
	catch (e) {

	}
}

// https://jsfiddle.net/Mottie/xcqpF/1/light/
function rgb2hex(rgb){
 rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
 return (rgb && rgb.length === 4) ?
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}

function GetColorFromPage() {
    return document.querySelector("#noteColor").value;
}

function NoteOn(userName, keyNum, currentInstrument, velocity) {
	engine.noteOn(userName, keyNum, currentInstrument, velocity);
	pingServer(socket.id, keyNum, 'note on', currentInstrument, velocity);
	AddColor(keyNum, GetColorFromPage());
	AddToUserCounts(socket.id, 1);
	MoveName(socket.id);
}

function NoteOff(userName, keyNum) {
	engine.noteOff(userName, keyNum);
	pingServer(socket.id, keyNum, 'note off');
	RemoveColor(keyNum, GetColorFromPage());
	AddToUserCounts(socket.id, -1);
	MoveName(socket.id);
}

function AddToUserCounts(key, value) {
	if (userCounts[key] == undefined) {
		userCounts[key] = 0;
	}
	userCounts[key] += value;
	if (userCounts[key] < 0)
		userCounts[key] = 0;
}

function MoveName(id) {
	try {
		elem = document.getElementById(id);
		if (userCounts[id] > 0) {
			elem.classList.add("active");
		} else {
			elem.classList.remove("active");
		}
	}
	catch (e) {

	}
}

// modified from https://stackoverflow.com/a/10467137/8166701
function KeyListener(){
    this.keysStatus = Array();
    
    //Constructor
    $("body").keydown(
        function(e){
        	if (!(document.activeElement.nodeName == 'TEXTAREA' || document.activeElement.nodeName == 'INPUT')) {
        		e.preventDefault();
        		KeyListener.onKeyDown(e);
        	} else {
        		if (e.which == 13) {
        			let chatBoxElem = document.getElementById("chatInput");
        			sendMessage(chatBoxElem.value);
        			chatBoxElem.value = "";
        		}
        	}
        }
    );
    $("body").keyup(
        function(e){
			if (!(document.activeElement.nodeName == 'TEXTAREA' || document.activeElement.nodeName == 'INPUT')) {
				e.preventDefault();
				KeyListener.onKeyUp(e);
        	}
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
                NoteOn(userName, keyNum + 12*octave, currentInstrument, 1.0);
			}
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
            NoteOff(userName, keyNum + 12*octave);
        }
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
	/*element.addEventListener("click", function(event) {
		NoteOn(userName, parseInt(event.target.dataset.notenumber), currentInstrument, 1.0);
		event.style.backgroundColor = "red";
		setTimeout( function() { event.target.removeAttribute("style");}, 500);
	});*/
	
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
		velocity: velocity,
        color: GetColorFromPage()} );
}

socket.on('note on', function(msg) {
	engine.noteOn(msg.userID, msg.noteNumber, msg.instrument, msg.velocity);
    AddColor(msg.noteNumber, msg.color);
    AddToUserCounts(msg.userID, 1);
    MoveName(msg.userID);
});

socket.on('note off', function(msg) {
    engine.noteOff(msg.userID, msg.noteNumber);
    RemoveColor(msg.noteNumber, msg.color);
    AddToUserCounts(msg.userID, -1);
    MoveName(msg.userID);
});

socket.on('update users', function(msg) {
	let usersElem = document.getElementById("users");
	usersElem.innerHTML = "";

	users = msg;
	for (let id in users) {
	    if (users.hasOwnProperty(id)) {
	    	let user = users[id];
	    	usersElem.innerHTML += '<p id="' + id + '" style="color:' + user.color + ';">' + user.username + '</p>';
	    }
	}
});

socket.on('chat message', function(msg) {
	let chatElem = document.getElementById("messages");
	let scrollToBottom = false;
	chatElem.innerHTML += '<p class="message"><span style="color:' + msg.color + ';">' + msg.username + ': </span>' + msg.message + '</p>';
	chatElem.scrollTop = chatElem.scrollHeight;
});

function sendMessage(message) {
	let messageObj = {
		username: userName,
		color: GetColorFromPage(),
		message: message
	}

	socket.emit('chat message', messageObj);
}

/*document.getElementById("midiButton").addEventListener("click", function(event) {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(midi => {
            console.log(midi.inputs);
            let inputs = midi.inputs.values();
            console.log(inputs);
            for (let input = inputs.next();
                 input && !input.done;
                 input = inputs.next()) {
                input.value.onmidimessage = message => {
                    if (message.data[0] == 145) {
                    	NoteOn(userName, message.data[1], currentInstrument, message.data[2]/127);
                    }
                    else if (message.data[0] == 129) {
                    	NoteOff(userName, message.data[1]);
                    }
                };
                midiConnected = true;
            }
        });
    }

});*/


document.getElementById("octaveUp").addEventListener("click", function(event) {
	octave += 1;
	document.getElementById("octaveText").innerHTML = octave;
});

document.getElementById("octaveDown").addEventListener("click", function(event) {
	octave -= 1;
	document.getElementById("octaveText").innerHTML = octave;
});

function UpdateUserInfo() {
	socket.emit("update user info", {
		username: userName,
		color: GetColorFromPage()
	});
}