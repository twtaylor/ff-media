// definitions
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
const Rx = require('rx');
var playerHelpers = require('./player/helpers');

// config
const port = 8888;
const pushInterval = 3000;

// set the initial variables for our app
var startedAt = new Date();

// set up our observable to emit updates
const pushPlayerChanges = Rx.Observable
    .interval(pushInterval)
    .timeInterval()
    .subscribe(playerChange);
    
// const getPlayerChanges = 

// serve our html
app.get('/', function(req, res){
    var serverPath = path.resolve(__dirname + '/../http/server.html');
    res.sendFile(serverPath);
});

io.on('connection', function(socket){
  // sending data
});

function pushPlayerChange() {
    // get our time, this is what we'll use for any previous entries
    var dt = new Date();
    
    //playerHelpers
    
    io.emit('chat message', msg);
}

// start our server
http.listen(port, function() {
  console.log('listening on *:8888');
});


