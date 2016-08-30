const mongoose = require('mongoose');

// get our mongo db up
// mongoose.connect('mongodb://localhost/ffmedia');

// Create a new schema for our tweet data
var schema = new mongoose.Schema({
    rank        : { type: String, index: true}
  , player      : String
  , chosenBy     : String
  , media     : String
  , created     : Date
  , updated     : Date 
  , seen    :   Boolean
});

// Return a Tweet model based upon the defined schema
module.exports = Player = mongoose.model('Player', schema);