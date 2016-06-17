/**
  Main server code for WorkoutBudde
  Author: Michael Rechenberg
  */


var helpers = require('./helpers.js');
var querystring = require('querystring');


//Init Express app and Router
var PORTNUMBER = 8080;
var appPrivIP = '10.136.7.139'; 
var express = require('express');
var app = express();
var router = express.Router();

//---------------PostGres set up------------------//

//TODO: Decide if I want to use BlueBird for Promise Library
// for the finally clause
var pgp = require('pg-promise')({
    capSQL: true,

});
var cn = {
  host: '127.0.0.1', //TODO: make this a new server
  port: 5432,
  database: 'workoutbudde',
  user: 'app',
  password: 'C6ym1tin'
};

//Global database object: run queries off of 'db' object
var db = pgp(cn);



//-----------------MIDDLEWARE---------------------//

var bodyParser = require('body-parser');
//all forms will be put in req.body.[input tag's name attribute]
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//Pug Template Engine
var pug = require('pug');
app.set('views', './views');

//Serve static files from public directory, located in root directory
app.use(express.static(__dirname + '/public'));

//Session Middleware
//req.session
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
app.use(session({
  secret: 'VblaEgIcr3C2B4qJER3a9iJOSaugMHEjDquvmA4',
  store: new RedisStore({
    host: 'localhost',
    port: 6379,
    ttl: 250
  }),
  resave: true,
  saveUninitialized: true,
  httpOnly: true,
  proxy: true,
  cookie: {secure: false},
}));

//Passport for Authentication
var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());


//String Validator and Sanitization
var validator = require('validator');

//CSRF
//Uses session middleware rather than cookie-parser
var csrf = require('csurf');
app.use(csrf({}));

//Add CSRF Token to the response on every request
app.use(function(req, res, next){
    res.locals.csrftoken = req.csrfToken();
    return next();
});


//---------------Middleware for Parmameters-----------------//


//Middleware to ensure that user_id is an integer
router.param('user_id', function(req, res, next, user_id){
    user_id = Number(user_id);
    if(Number.isInteger(user_id)){
      next();
    }
    else{
      res.status(404).render("404.pug");
    }
});

//-----------ROUTING----------------//


router.get('/', function(req, res){
  var context = {};
  //the user is logged in already
  if(req.session.auth)
    context.loggedIn = true;
  res.render('frontpage.pug', context);
});


router.get('/findBudde$', function(req, res){
    res.render('findbudde.pug', { 
        'csrfToken': res.locals.csrftoken,
    });
});

router.post('/findBudde/submit$', function(req, res){
  var values = {};
  values.lat = req.body.latitude;
  values.lng = req.body.longitude;
  values.range = req.body.range;
  var queryStr = querystring.stringify(values);
  res.redirect('/findBudde/submit/results?' + queryStr);
});

//Display Results to User
router.get('/findBudde/submit/results', function(req, res){
  var lat = req.query.lat;
  var lng = req.query.lng;
  var range = req.query.range;
  //error check the query parameters
  //If any of these conditions are true then some user tried to modify 
  //  the query string (using lat/lng from [0-180] rather than [-90 to 
  //  90] or manually setting range higher than 10000 kilometers to 
  //  try and extract user data
  if(lat < -90 || lat > 90 || lng < -90 || lat > 90 || range < 0 || range > 100000){
    res.status(400).send("Bad Query");
  }
  else{
    var values = [];
    values.push(req.query.lat);
    values.push(req.query.lng);
    values.push(req.query.range*1000);
    var queryObj = {
      text: "SELECT firstname, lastname, username FROM users, earth_distance(ll_to_earth($1, $2), earth_coord) AS distance WHERE distance < $3",
      values: values
    }
    //data is an array containing rows of objects where the object properties
    //  are the columns designated in the query
    //If no rows are returned, then data is an empty array
    db.any(queryObj).then((data)=>{
        data.forEach((val)=>{
           console.log(val.username);
        }); 
        res.render('findbudderesults.pug', {results: data});
      })
      .catch((reason)=>{
        console.log("Error in findbudde/submit/results");
        res.status(500).send("Error In Query");
    });
  }

});

router.get('/login/', function(req, res){
    if(req.session.auth){
      res.send("You're already logged in");
    }
    else{
      var context = {};
      context.csrfToken = res.locals.csrftoken;
      var error = req.query.error;
      if(error)
        context.error = error;
      res.render('login.pug', context);
    }
});

router.post('/login$', function(req, res){
  var username = req.body.username;
  var providedPass = req.body.password;
  var queryObj = {
    text: "SELECT salt, password FROM users WHERE username=$1",
    values: [username]
  };
  db.one(queryObj).then(function(data){
      var salt = data.salt;
      var hashedProvidedPass = helpers.hashPassword(salt, providedPass);
      if(hashedProvidedPass == data.password){
        req.session.auth = true;
        res.redirect('/');
      }
      else{
        var error=encodeURIComponent("Invalid Username Or Password");
        res.redirect('/login/?error=' + error);
      }
      }).catch(function(reason){
        var error=encodeURIComponent("Invalid Username Or Password");
        res.redirect('/login/?error=' + error);
  });


});

router.get('/logout/', function(req, res){
   if(req.session.auth){
    req.session.auth=false;
   }
   res.redirect('/');
});

//Routes for a New User
//Page for client to add new user
router.get('/newuser/', function(req, res){
  var context = {};
  context.csrfToken = res.locals.csrftoken;
  var error = req.query.error;
  if(error)
    context.error = decodeURIComponent(req.query.error);
  res.render('newuser.pug', context); 
});

//Process form information from New User Page
//TODO: Make sure untrusted info is sanitized
router.post('/newuser/', function(req, res){
  console.log(req.body);
  var queryObj = {
    text: "SELECT user_id FROM users WHERE username=$1",
    values: [req.body.username]
  };
  //make sure there are no users with that username 
  //if the username has not been used before, insert into DB
  //In exercise-times, 0-Sun, 1-Mon,...6-Sat
  db.none(queryObj).then(function(data){
        var values={};
        values.username = req.body.username;
        var salt = helpers.generateSalt();
        values.salt = salt;
        req.body.password = helpers.hashPassword(salt, req.body.password);
        values.password = req.body.password;
        values.firstname = req.body.firstname;
        values.lastname = req.body.lastname;
        values.street = req.body.street;
        values.city = req.body.city;
        values.state = req.body.state;
        values.zip_code = req.body.zip_code;
        values.coord = 'POINT(' + req.body.latitude + ',' + req.body.longitude + ')';
        values.earth_coord = 'll_to_earth(' + req.body.latitude + ','  + req.body.longitude + ')'
        values.swimming = false;
        values.cycling = false;
        values.lifting = false;
        values.running = false;
        values.yoga = false;
        values.outdoor_sports = false;
        values.indoor_sports = false;
        //ensure req.body.exercise is an array
        if(typeof req.body.exercise == 'string'){
            var temp = req.body.exercise;
            req.body.exercise = [];
            req.body.exercise.push(temp);
        }
        req.body.exercise.forEach((val)=>{
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
        values.sun_start_time = '00:00:00';
        values.sun_end_time = '23:59:59';
        values.mon = false;
        values.mon_start_time = '00:00:00';
        values.mon_end_time = '23:59:59';
        values.tues = false;
        values.tues_start_time = '00:00:00';
        values.tues_end_time = '23:59:59';
        values.wed = false;
        values.wed_start_time = '00:00:00';
        values.wed_end_time = '23:59:59';
        values.thurs = false;
        values.thurs_start_time = '00:00:00';
        values.thurs_end_time = '23:59:59';
        values.fri = false;
        values.fri_start_time = '00:00:00';
        values.fri_end_time = '23:59:59';
        values.sat = false;
        values.sat_start_time = '00:00:00';
        values.sat_end_time = '23:59:59';
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

        var insertObj = {
          text: "INSERT INTO users (username, salt, password, firstname, lastname, street, city, state, zip_code, coord, earth_coord, exer_swimming, exer_running, exer_lifting, exer_yoga, exer_cycling, exer_indoor_sports, exer_outdoor_sports, sun, sun_start_time, sun_end_time, mon, mon_start_time, mon_end_time, tues, tues_start_time, tues_end_time, wed, wed_start_time, wed_end_time, thurs, thurs_start_time, thurs_end_time, fri, fri_start_time, fri_end_time, sat, sat_start_time, sat_end_time, intensity) VALUES ($<username>, $<salt>, $<password>, $<firstname>, $<lastname>, $<street>, $<city>, $<state>, $<zip_code>, $<coord^>, $<earth_coord^>, $<swimming>, $<running>, $<lifting>, $<yoga>, $<cycling>, $<indoor_sports>, $<outdoor_sports>, $<sun>, $<sun_start_time>, $<sun_end_time>, $<mon>, $<mon_start_time>, $<mon_end_time>, $<tues>, $<tues_start_time>, $<tues_end_time>, $<wed>, $<wed_start_time>, $<wed_end_time>, $<thurs>, $<thurs_start_time>, $<thurs_end_time>, $<fri>, $<fri_start_time>, $<fri_end_time>, $<sat>, $<sat_start_time>, $<sat_end_time>, $<intensity>)",
          values: values 
        };
        var a = "";
        a = pgp.as.format(insertObj.text, insertObj.values);
        console.log(a);
        db.none(a).then(function(){
            //log the person in
            console.log("sucess?");
            req.session.auth = true;
            res.redirect('/');
          }).catch(function(reason){
             //TODO: Add this to logger like Winston or Morgan
             console.log(reason);
             var error = encodeURIComponent("Error in insertion");
             res.redirect('/newuser/?error=' + error);
        });
    }).catch(function(reason){
      console.log(reason);
      var error = encodeURIComponent("Username already taken");
      res.redirect('/newuser/?error=' + error);  
  });

});


router.get('/profile/:user_id', function(req, res){
    var user_id = req.params.user_id;

    queryObj = {
      text: "SELECT firstname, lastname, username, exer_swimming, exer_cycling, exer_lifting, exer_running, exer_yoga, exer_outdoor_sports, exer_indoor_sports, mon, tues, wed, thurs, fri, sat, sun, mon_start_time, tues_start_time, wed_start_time, thurs_start_time, fri_start_time, sat_start_time, sun_start_time, mon_end_time, tues_end_time, wed_end_time, thurs_end_time, fri_end_time, sat_end_time, sun_end_time, intensity FROM users WHERE user_id=$1",
     values: [user_id] 
    }
    db.one(queryObj).then(function(data){
        data.exercises = [];
        if(data.exer_swimming)
          data.exercises.push("Swimming");
        if(data.exer_yoga)
          data.exercises.push("Yoga");
        if(data.exer_cycling)
          data.exercises.push("Cycling");
        if(data.exer_running)
          data.exercises.push("Running");
        if(data.exer_lifting)
          data.exercises.push("Lifting");
        if(data.exer_indoor_sports)
          data.exercises.push("Indoor Sports");
        if(data.exer_outdoor_sports)
          data.exercises.push("Outdoor Sports");
        res.render('profile.pug', {user: data});
      })
   .catch(function(reason){
     console.log(reason);
     res.status(500).send("Server Error");
    }); 
});

app.use(router);

//------------Starting Server----------//

console.log("SERVER ONLINE");
//listen to the Nginx proxy server
app.listen(PORTNUMBER, appPrivIP);
