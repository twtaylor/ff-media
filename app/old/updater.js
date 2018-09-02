var Rx = require('rx');
var RxNode = require('rx-node');
var async = require('async');
var mongoose = require('mongoose');
var Player = require('./mongoose/player');

// get our mongo db up
mongoose.connect('mongodb://localhost/ffmedia');

var source = Rx.Observable.range(0, 5);

var subscription = RxNode.writeToStream(source, process.stdout, 'utf8');

var delay = 5000;

// start our forever loop - this will retrieve our last 10 fresh persons from the collection and push them down
async.forever(
    function(next) {
        Person.find({}, { limit: 10, sort: { created: -1 } }, function(err, persons) { next(); });
    },
    function(err) {
        console.error(err);
    }
);