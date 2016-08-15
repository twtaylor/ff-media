// requires
var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
var mongoose = require('mongoose');
var Player = require('./mongoose/player');
var Array = require('array');
 
// spreadsheet key is the long id in the sheets URL 
var doc = new GoogleSpreadsheet('1yUeMhafkVw1L87SY3a1NvGCCfOx8U6I173dfv7ctO6A');
var dataSheet;

// get our mongo db up
mongoose.connect('mongodb://localhost/ffmedia');

// session key
var sessionKey = Date.parse("2016-08-14T23:46:08.001Z");

var getPlayerData = function (dataSheet, step) {
    // google provides some query options 
    var saved = 0;
    var date = new Date();
    dataSheet.getRows({ 
        offset: 1,
        limit: 320
    }, function( err, rows ){
        console.log('Read ' + rows.length + ' rows');

        for (var i = 0; rows.length > i; i++) {
            var row = rows[i];
            // Store our row
            var player = new Player({ player: row.player, rank: row.rank, chosenBy: row.assigninitialsbelow, youtube: row.youtube, created: date });
            player.save(function(err) { 
                if (!err) {
                    saved++;
                }
            });
        }
        
        console.log('Player rows ' + saved + ' out of ' + rows.length);
        step();
    });
}
 
async.series([
  function setAuth(step) {
    // see notes below for authentication instructions! 
    var creds = require('../FantasyFootball2016-39e6046f5a47.json');
    // OR, if you cannot save the file locally (like on heroku) 
    var creds_json = {
      client_email: 'fantasyfootball2016-764f5@appspot.gserviceaccount.com',
      private_key: '39e6046f5a47e19ab299daf1264760f517349d79'
    }
 
    doc.useServiceAccountAuth(creds, step);
  },
  function getInfoAndWorksheets(step) {
    doc.getInfo(function(err, info) {
      console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
      for (var i = 0; info.worksheets.length > i; i++) {
          sheet = info.worksheets[i];
          console.log('sheet ' + (i + 1) + ': ' + sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
          
          if (sheet.title == 'Player Selection') {
              console.log('This will be used as our datasheet.');
              dataSheet = sheet;
          }
      }
      
      step();
    });
  },
  function getPlayerVideos(step) {
    // TODO: temporary session key
    var sessionReset = false;
      
    if (sessionReset) {
        getPlayerData(dataSheet, step);
    }
    else {
        step();
    }
 },
  function getPlayerSelectedUpdates(step) {
    // get all of the persons
    Player.find({ created: sessionKey }, function (error, persons) { 
        var allPersons = new Array(persons);
        dataSheet.getCells({
          'min-row': 1,
          'max-row': 10,
          'min-col': 1,
          'max-col': 3, 
          'return-empty': true
        }, function(err, cells) {
          if (!err) {
              var chosenBy, key;
              // our updated date
              var updated = new Date();
              
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
                    
                    // find it there's any differences we need to update
                    var foundPerson = allPersons.find(function(p) { return p.rank == key; });
                    if (foundPerson && foundPerson.chosenBy != chosenBy) {
                        // write out our update to the mongo database 
                        Player.findOneAndUpdate({ rank: key, created: sessionKey }, {$set:{ chosenBy: chosenBy, updated: updated }},function(err, doc){
                            if (err) { 
                                console.log("Something wrong when updating data for " + key);
                            }
                        });
                    }
                }
            }
          }
          else {
              console.log(err);
          }
          
          step();
        });
    });
  },
//   function managingSheets(step) {
//     doc.addWorksheet({
//       title: 'my new sheet'
//     }, function(err, sheet) {
 
//       // change a sheet's title 
//       sheet.setTitle('new title'); //async 
 
//       //resize a sheet 
//       sheet.resize({rowCount: 50, colCount: 20}); //async 
 
//       sheet.setHeaderRow(['name', 'age', 'phone']); //async 
 
//       // removing a worksheet 
//       sheet.del(); //async 
 
//       step();
//     });
//   }
]);