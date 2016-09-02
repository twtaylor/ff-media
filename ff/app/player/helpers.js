// helpers for players 
var GoogleSpreadsheet = require('google-spreadsheet');
var Player = require('../models/player');
var Array = require('array');
var async = require('async');
const mongoose = require('mongoose');

// get our mongo db up
mongoose.connect('mongodb://localhost/ffmedia');

// consts - these are wear our data 
var doc = new GoogleSpreadsheet('1yUeMhafkVw1L87SY3a1NvGCCfOx8U6I173dfv7ctO6A');

// load our data up
var Helpers = {
    // dataSheet component we load
    dataSheet: null, 
    // retrieves player data for our entire DB - pretty much to reset the DB
    getPlayerData: function ( final ) {
        if (!this.dataSheet) {
            this.loadDataSheet(this.loadPlayerData, final);
        }
        else {
            this.loadPlayerData(final);
        }  
    },
    loadPlayerData: function ( next ) {
        // google provides some query options 
        var saved = 0;
        var date = new Date();
        var that = this;
        
        Player.remove({}, function(err) {
            that.dataSheet.getRows({ 
                offset: 1,
                limit: 320
            }, function( err, rows ) {
                if (!err) {
                    // create our players array
                    var players = [];
                    for (var i = 0; rows.length > i; i++) {
                        var row = rows[i];
                        // Store our row
                        var player = { player: row.player, 
                            rank: row.rank,
                            chosenBy: row.assigninitialsbelow, 
                            media: row.media, 
                            created: date, 
                            seen: false };
                            
                        players.push(player);
                    }
                    
                    // now bulk save
                    Player.collection.insert(players, {}, function ( err, docs ) {
                        if (!err) {
                            console.log('- players saved in mongo: ', docs.insertedCount);
                        }
                        else {
                            console.log('error storing players', err);
                        }
                        
                        next();
                    });  
                }   
            });
        });
    },
    loadDataSheet: function (next, final, args) {
        var that = this;
        
        async.series([
            function setAuth(step) {
                // see notes below for authentication instructions! 
                var creds = require('../../FantasyFootball2016-39e6046f5a47.json');
                // OR, if you cannot save the file locally (like on heroku) 
                var creds_json = {
                    client_email: 'fantasyfootball2016-764f5@appspot.gserviceaccount.com',
                    private_key: '39e6046f5a47e19ab299daf1264760f517349d79'
                }
            
                doc.useServiceAccountAuth(creds, step);
            },
            function getInfoAndWorksheets(step) {
                doc.getInfo(function(err, info) {
                console.log('- loaded Google Doc: ' + info.title + ' by ' + info.author.email);
                
                // retrieve the sheet we'll be working with 
                for (var i = 0; info.worksheets.length > i; i++) {
                    sheet = info.worksheets[i];
                    if (sheet.title == 'Player Selection') {
                        console.log('- loaded DATA SHEET ' + (i + 1) + ': ' + sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
                        that.dataSheet = sheet;
                    }
                }
                
                step();
                });
            }], 
            function (error, results) {
                if (error) {
                    console.log(error);    
                }
                
                // call our fn but in this scope
                if (args && args.length > 0) {
                    // add final to our args
                    args.unshift(final);
                    next.apply(that, args);
                }
                else {
                    next.call(that, final);    
                }
                
        });
    },
    getPlayerSelectedUpdates: function (  final ) {
        if (!this.dataSheet) {
            this.loadDataSheet(this.playerSelectedUpdates, final);
        }
        else {
            this.playerSelectedUpdates(final);
        }  
    },
    playerSelectedUpdates: function ( next ) {
        // get everyone of the persons
        this.dataSheet.getCells({
            'min-row': 1,
            'max-row': 320,
            'min-col': 1,
            'max-col': 3, 
            'return-empty': true
        }, function(err, cells) {
            if (!err) {
                // temporary storage 
                var chosenBy, key;
                //var updatedPersons = [];
                
                // our updated date
                var updated = new Date();
                
                // initialize our mongoose bulk update 
                var bulk = Player.collection.initializeOrderedBulkOp();
                
                // aggregate our updates               
                for (var i = 0; cells.length > i; i++) {
                    var cell = cells[i];
                    // col 1 - our selection
                    if (cell.col == 1) {
                        // start a new row
                        chosenBy = cell.value;
                    }
                    
                    // col 3 - our selected key
                    if (cell.col == 3) {
                        key = cell.value;
                        
                        // update our item if it has changed
                        bulk.find({ 'rank': key, 'seen': false, 'chosenBy': { $ne: chosenBy }})
                            .update({$set: { updated: updated, chosenBy: chosenBy }});
                    }
                }
                
                bulk.execute(function (error) {
                    next();                   
                });
            }
        });
    },
    getMostRecentUpdates: function ( final, fromDate ) {
        var that = this;
        
       // find our most recent updates made to the player
        Player.find().where('updated').gt(fromDate)
            .where('seen').equals(false)
            .sort('-updated')            
            .exec(function(err, docs){ 
                if (docs.length > 0) {
                    // record these docs, update them and then send them down to the final
                    var bulk = Player.collection.initializeOrderedBulkOp();
                    
                    for (var i = 0; docs.length > i; i++) {
                    bulk.find({ '_id': docs[i]._id }).update({$set: { seen: true }});
                    }
                    
                    bulk.execute(function (error) {
                        if (!error) {
                            final.call(that, docs);    
                        }
                        else {
                            console.log('error after a bulk execute: ', error);
                        }
                    });
                }
            }); 
    }      
}

module.exports = Helpers;