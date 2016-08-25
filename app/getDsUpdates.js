const http = require('http');
const Rx = require('rx');
var playerHelpers = require('./player/helpers');

// configuration level
// const hostname = '0.0.0.0';
// const port = 8888;

// function playerChange(e) {
//     playerHelpers.getPlayerSelectedUpdates(function() { console.log('player update done'); });
// }

// const playerChanges = Rx.Observable
//     .interval(5000)
//     .timeInterval()
//     .take(1)
//     .subscribe(playerChange);
    
playerHelpers.getPlayerSelectedUpdates(function() { console.log('player sync done'); });