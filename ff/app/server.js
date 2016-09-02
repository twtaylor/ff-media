// definitions
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
const Rx = require('rx');
var playerHelpers = require('./player/helpers');

// config
const port = 8888;
const getInterval = 10000;

// set the initial variables for our app
var startedAt = new Date();

// set up our observable to emit updates
var getPlayerChanges;
   
const emptyObservable = Rx.Observable.empty();
    
// serve our html
app.get('/', function(req, res){
    var serverPath = path.resolve(__dirname + '/../http/server.html');
    res.sendFile(serverPath);
});

function getSmallTime (date) {
    return date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + 
":" + date.getMilliseconds();
}

function pushPlayerChange() {
    var start = new Date();
    // get our time, this is what we'll use for any previous entries
    playerHelpers.getMostRecentUpdates(function(docs) {
        var end = new Date();
        
        console.log('- get most recent updates started:', getSmallTime(start), ' and ended at: ', getSmallTime(end));
        
        io.emit('chat message', JSON.stringify(docs));
    }, startedAt);
}

function getPlayerChange () {
    // gets all of our updates for a given change
    var start = new Date();
    playerHelpers.getPlayerSelectedUpdates(function() { 
        var end = new Date();
        var startDebug = 
        
        console.log('- player sync started: ', getSmallTime(start), ' and done at: ', getSmallTime(end));
        
        // now push our updates to the client
        pushPlayerChange(); 
    });
}

function loadObservable () {
    playerHelpers.getPlayerData(function() { 
        console.log('- refreshed all of our players')
        getPlayerChanges = Rx.Observable
            .interval(getInterval)
            .timeInterval()
            .subscribe(getPlayerChange);
        });
}

io.on('connection', function(socket) {
    console.log('CONNECTION established at: ', getSmallTime(new Date()));
    
    // clear our datasheets, start our listener
    loadObservable();
        
    // reset everything if we get a message to
    socket.on('chat message', function(msg) {
        if (msg == 'reset') {
            console.log('RESET fired');
            loadObservable();
        }
    });
    
    socket.on('disconnect', function() {
        console.log('DISCONNECT fired');
        getPlayerChanges.dispose();
    });
});

// start our server
http.listen(port, function() {
  console.log('listening on *:8888');
});


