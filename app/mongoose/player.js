var mongoose = require('mongoose');

// Create a new schema for our tweet data
var schema = new mongoose.Schema({
    rank        : { type: String, index: true}
  , player      : String
  , chosenBy     : String
  , youtube     : String
  , created     : Date
  , updated     : Date 
});

// Return a Tweet model based upon the defined schema
module.exports = Player = mongoose.model('Player', schema);