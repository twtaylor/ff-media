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
const getPlayerChanges = Rx.Observable
    .interval(getInterval)
    .timeInterval();
    
// serve our html
app.get('/', function(req, res){
    var serverPath = path.resolve(__dirname + '/../http/server.html');
    res.sendFile(serverPath);
});

function pushPlayerChange() {
    var start = new Date();
    // get our time, this is what we'll use for any previous entries
    playerHelpers.getMostRecentUpdates(function(docs) {
        var end = new Date();
        
        console.log('get most recent updates started:', start, ' and ended at: ', end);
        
        // construct our message
        // var msg = '';
        // for (var i = 0; docs.length > i; i++) {
        //     msg += '<p>player: ' + docs[i].player + ' youtube: ' + docs[i].youtube + '</p>';
        // }
         
        console.log('2) push player changes at: ', new Date());
        io.emit('chat message', JSON.stringify(docs));
    }, startedAt);
}

function getPlayerChange () {
    // gets all of our updates for a given change
    var start = new Date();
    playerHelpers.getPlayerSelectedUpdates(function() { 
        var end = new Date();
        console.log('1) player sync started: ', start, ' and done at: ', end);
        
        // now push our updates to the client
        pushPlayerChange(); 
    });
}

io.on('connection', function(socket) {
    console.log('connection established at: ', new Date());
    
    // clear our datasheets, start our listener
    playerHelpers.getPlayerData(function() { 
        console.log('refreshed all of our players')
        getPlayerChanges.subscribe(getPlayerChange);
    });
});

// start our server
http.listen(port, function() {
  console.log('listening on *:8888');
});


