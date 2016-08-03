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
    },
    haveUserLoginAndReturn(req, res){
      var context = {};
      context.csrfToken = res.locals.csrftoken
      context.redirect = req.url;
      res.render('login.pug', context);
    }

};
/**
   Converts data from profile form to an array suitable for insertion 
 */
module.exports.convertReqToValuesObj= function(req){
        var values={};
        values.username = req.body.username;
        //only work with password if password was in form
        if(req.body.password){
          var salt = module.exports.generateSalt();
          values.salt = salt;
          req.body.password = module.exports.hashPassword(salt, req.body.password);
          values.password = req.body.password;
        }
        values.firstname = req.body.firstname;
        values.lastname = req.body.lastname;
        values.street = req.body.street;
        values.city = req.body.city;
        values.state = req.body.state;
        values.zip_code = req.body.zip_code;
        values.lat = req.body.latitude;
        values.lng = req.body.longitude;
        values.earth_coord = 'll_to_earth(' + req.body.latitude + ','  + req.body.longitude + ')'
        values.swimming = false;
        values.cycling = false;
        values.lifting = false;
        values.running = false;
        values.yoga = false;
        values.outdoor_sports = false;
        values.indoor_sports = false;
        //ensure req.body.exercises is an array
        if(typeof req.body.exercises == 'string'){
            var temp = req.body.exercises;
            req.body.exercises = [];
            req.body.exercises.push(temp);
        }
        req.body.exercises.forEach((val)=>{
          switch(val){
            case 'Swimming':
              values.swimming=true;
              break;
            case 'Cycling':
              values.cycling=true;
              break;
            case 'Running':
              values.running=true;
              break;
            case 'Lifting':
              values.lifting=true;
              break;
            case 'Yoga':
              values.yoga=true;
              break;
            case 'Outdoor Sports':
              values.outdoor_sports=true;
              break;
            case 'Indoor Sports':
              values.indoor_sports=true;
              break;
            default:
              break;
          }
        });
        values.sun = false;
        values.sun_start_time = '00:00';
        values.sun_end_time = '23:59';
        values.mon = false;
        values.mon_start_time = '00:00';
        values.mon_end_time = '23:59';
        values.tues = false;
        values.tues_start_time = '00:00';
        values.tues_end_time = '23:59';
        values.wed = false;
        values.wed_start_time = '00:00';
        values.wed_end_time = '23:59';
        values.thurs = false;
        values.thurs_start_time = '00:00';
        values.thurs_end_time = '23:59';
        values.fri = false;
        values.fri_start_time = '00:00';
        values.fri_end_time = '23:59';
        values.sat = false;
        values.sat_start_time = '00:00';
        values.sat_end_time = '23:59';
        values.intensity = req.body.intensity;
        //make sure exercise-time is an array before iterating
        if(typeof req.body["exercise-time"] == 'string'){
          var temp = req.body["exercise-time"];
          req.body["exercise-time"] = [];
          req.body["exercise-time"].push(temp);
        }
        req.body["exercise-time"].forEach((val)=>{
          var start = 2*val;
          var end = 2*val + 1;
          if(val == 0){
            values.sun = true;
            values.sun_start_time = req.body.time[start];
            values.sun_end_time = req.body.time[end];
          }
          else if(val == 1){
            values.mon = true;
            values.mon_start_time = req.body.time[start];
            values.mon_end_time = req.body.time[end];
          }
          else if(val == 2){
            values.tues = true;
            values.tues_start_time = req.body.time[start];
            values.tues_end_time = req.body.time[end];
          }
          else if(val == 3){
            values.wed = true;
            values.wed_start_time = req.body.time[start];
            values.wed_end_time = req.body.time[end];
          }
          else if(val == 4){
            values.thurs = true;
            values.thurs_start_time = req.body.time[start];
            values.thurs_end_time = req.body.time[end];
          }
          else if(val == 5){
            values.fri = true;
            values.fri_start_time = req.body.time[start];
            values.fri_end_time = req.body.time[end];
          }
          else if(val == 6){
            values.sat = true;
            values.sat_start_time = req.body.time[start];
            values.sat_end_time = req.body.time[end];
          }
        });
        return values;
};


