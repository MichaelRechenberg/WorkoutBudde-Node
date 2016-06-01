/**
  Contains helper methods for WorkoutBudde App
  */
var validator = require('validator');
module.exports = {
  /**
    Escapes All Strings using ValidatorJS
    Call unescapeAllStrings to invert this function
   */
  
  escapeAllStrings: function(body){
    for(a in body){
      var input = body[a];
      if(typeof input === 'string')
        body[a] = validator.escape(input);
    }
  },
  unescapeAllStrings: function(body){
    for(a in body){
      var input = body[a];
      if(typeof input === 'string')
        body[a] = validator.unescape(input);
    }
  }

};

