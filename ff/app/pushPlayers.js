const http = require('http');
const Rx = require('rx');
var playerHelpers = require('./player/helpers');

// configuration level
const hostname = '0.0.0.0';
const port = 8888;

var dt = new Date(2012, 1, 1);

// function playerChange(e) {
//     //playerHelpers.getPlayerData(function() { console.log('loaded data')});
    
//     playerHelpers.getMostRecentUpdates(function() { console.log('player update done'); }, dt);
// }

// const playerChanges = Rx.Observable
//     .interval(5000)
//     .timeInterval()
//     .take(1)
//     .subscribe(playerChange);
    
playerHelpers.getMostRecentUpdates(function(docs) { 
    console.log('player push (update+select) done: ', docs); 
}, dt);