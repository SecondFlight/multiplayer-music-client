var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var validator = require('validator');

users = {};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  users[socket.id] = {
    username: socket.id,
    color: "FFFFFF"
  };
  socket.on('disconnect', function(){
    users[socket.id] = undefined;
    sendUsers();
  });
  socket.on('chat message', function(msg){
    io.emit('chat message', {
      username:validator.escape(msg.username),
      color:validator.escape(msg.color),
      message:validator.escape(msg.message)});
  });
  socket.on('note on', function(msg) {
  	socket.broadcast.emit('note on', msg);
  });
  socket.on('note off', function(msg) {
  	socket.broadcast.emit('note off', msg);
  });
  socket.on('update user info', function(msg) {
    users[socket.id] = {
      color:validator.escape(msg.color),
      username:validator.escape(msg.username)
    };
    sendUsers();
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function sendUsers() {
  io.emit('update users', users);
}
/*
{
	userID: "bob",
	noteNumber: 82,
	instrument: "Piano",
	velocity: 1.0
}*/
