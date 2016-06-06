/**
  Contains helper methods for WorkoutBudde App
  */
var validator = require('validator');
var crypto = require('crypto');
//how long the salt should be
var SALT_LENGTH = 20;
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
  },
  //Hash function tutorial found on http://code.ciphertrick.com/2016/01/18/salt-hash-passwords-using-nodejs-crypto/
  /**
    Generates salt for hashing
    Uses hex encoding
    */
  generateSalt: function(){
    return crypto.randomBytes(Math.ceil(SALT_LENGTH/2))
        .toString('hex')
        .slice(0, SALT_LENGTH);
  },
  /**
    Hashes password using SHA-512
    Uses hex encoding

    Params:
      --salt
         Random string to add cryptographic salt
         Will have to be stored in the table to verify user
      --userPassword 
        The password the user provides

    */
    hashPassword: function(salt, userPassword){
      hashFunc = crypto.createHmac('sha512', salt);
      //add data to the hash function
      hashFunc.update(userPassword); 
      //return hashed data
      return hashFunc.digest('hex');
    }

};

