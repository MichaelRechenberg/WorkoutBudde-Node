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
  if(req.session.auth){
    context.loggedIn = true;
    context.user_id = req.session.user_id;
  }
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
  //represents what page the user is on, used
  //  in OFFSET clause in SQL query
  values.page = 1;
  var queryStr = querystring.stringify(values);
  res.redirect('/findBudde/submit/results?' + queryStr);
});

//Display Results to User
router.get('/findBudde/submit/results', function(req, res){
  var lat = req.query.lat;
  var lng = req.query.lng;
  var range = req.query.range;
  var page = req.query.page;
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
    values.push(lat);
    values.push(lng);
    values.push(range*1000);
    //OFFSET amount
    var RESULTS_PER_PAGE = 10;
    values.push(RESULTS_PER_PAGE);
    values.push((page-1)*RESULTS_PER_PAGE);
    var lowerLat = lat -1;
    var upperLat = lat + 1;
    var lowerLng = lng -1;
    var upperLng = lng + 1;
    values.push(lowerLat);
    values.push(upperLat);
    values.push(lowerLng);
    values.push(upperLng);
    var queryObj = {
      //Narrow search by creating temporary table near 
      //If you need any fields, include it in both SELECT statements
      text: "SELECT user_id, firstname, lastname, distance FROM (SELECT user_id, firstname, lastname, earth_coord FROM users WHERE (users.lat BETWEEN $6 AND $7)AND (users.lng BETWEEN $8 AND $9)) near, earth_distance(ll_to_earth($1, $2), near.earth_coord) AS distance WHERE distance < $3 ORDER BY distance LIMIT $4 OFFSET $5", values: values
    }
    //data is an array containing rows of objects where the object properties
    //  are the columns designated in the query
    //If no rows are returned, then data is an empty array
    db.any(queryObj).then((data)=>{
        data.forEach(function(val, index, data){
          //Convert all distances from meters to kilometers
          data[index].distance = Math.floor(data[index].distance/1000);
          
        });
        //results contains an array of users returned by the database
        //query contains the query parameters given (used for constructing querystring for pagination)
        res.render('findbudderesults.pug', {results: data, query: req.query});
      })
      .catch((reason)=>{
        console.log("Error in findbudde/submit/results");
        console.log(reason);
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
      context.redirect = '/';
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
    text: "SELECT user_id, salt, password FROM users WHERE username=$1",
    values: [username]
  };
  db.one(queryObj).then(function(data){
      var salt = data.salt;
      var hashedProvidedPass = helpers.hashPassword(salt, providedPass);
      //The user logged in successfully, set any session variables
      //user_id is set here
      //Also any session variables should be set in /newuser route

      if(hashedProvidedPass == data.password){
        req.session.user_id = data.user_id
        req.session.auth = true;
        res.redirect(req.body.redirect);
      }
      else{
        var error=encodeURIComponent("Invalid Username Or Password");
        res.redirect('/login/?error=' + error);
      }
      }).catch(function(reason){
        console.log(reason);
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
        var values = helpers.convertReqToValuesObj(req);
        var insertObj = {
          text: "INSERT INTO users (username, salt, password, firstname, lastname, street, city, state, zip_code, lat, lng, earth_coord, exer_swimming, exer_running, exer_lifting, exer_yoga, exer_cycling, exer_indoor_sports, exer_outdoor_sports, sun, sun_start_time, sun_end_time, mon, mon_start_time, mon_end_time, tues, tues_start_time, tues_end_time, wed, wed_start_time, wed_end_time, thurs, thurs_start_time, thurs_end_time, fri, fri_start_time, fri_end_time, sat, sat_start_time, sat_end_time, intensity) VALUES ($<username>, $<salt>, $<password>, $<firstname>, $<lastname>, $<street>, $<city>, $<state>, $<zip_code>, $<lat>, $<lng>, $<earth_coord^>, $<swimming>, $<running>, $<lifting>, $<yoga>, $<cycling>, $<indoor_sports>, $<outdoor_sports>, $<sun>, $<sun_start_time>, $<sun_end_time>, $<mon>, $<mon_start_time>, $<mon_end_time>, $<tues>, $<tues_start_time>, $<tues_end_time>, $<wed>, $<wed_start_time>, $<wed_end_time>, $<thurs>, $<thurs_start_time>, $<thurs_end_time>, $<fri>, $<fri_start_time>, $<fri_end_time>, $<sat>, $<sat_start_time>, $<sat_end_time>, $<intensity>) RETURNING user_id",
          values: values 
        };
        var a = "";
        a = pgp.as.format(insertObj.text, insertObj.values);
        console.log(a);
        db.one(a).then(function(data){
            //log the person in and set any session variables
            req.session.auth = true;
            req.session.user_id = data.user_id;
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

/**
  Page for User to edit the information on their profile
  Requires them to be logged in
  */
router.get('/profile/editProfile', function(req, res){
  
  if(req.session.auth){
    var user_id = req.session.user_id;
    var queryObj = {
      text: "SELECT username, firstname, lastname, street, city, state, zip_code, exer_swimming, exer_running, exer_lifting, exer_yoga, exer_cycling, exer_indoor_sports, exer_outdoor_sports, sun, sun_start_time, sun_end_time, mon, mon_start_time, mon_end_time, tues, tues_start_time, tues_end_time, wed, wed_start_time, wed_end_time, thurs, thurs_start_time, thurs_end_time, fri, fri_start_time, fri_end_time, sat, sat_start_time, sat_end_time, intensity FROM users WHERE user_id=$1",
      values:[user_id] 
    }
    db.one(queryObj)
      .then(function(data){
        console.log(data);
        var context = {};
        context.csrfToken = res.locals.csrftoken;
        context.user = data;
        res.render('editprofile.pug', context);
      }).catch(function(reason){
        console.log("Error in profile/editProfile");
        console.log(reason);
        res.status(500).send("Server Error");
      });
    
    
  }
  //The user is not logged, render the login page
  //The login page will redirect back to the editProfile page
  //  once the user has logged in
  else{
    context = {};
    context.csrfToken = res.locals.csrftoken;
    context.redirect = req.url; 
    res.render('login.pug', context);
  }
  
});

/**
  Process update request from the user
  */
router.post('/profile/editProfile', function(req, res){
    console.log("derp");
    if(req.session.auth){
      var user_id = req.session.user_id;
      var values = helpers.convertReqToValuesObj(req); 
      values.user_id = user_id;
      var queryObj = {
          text: "UPDATE users SET firstname=$<firstname>, lastname=$<lastname>, street=$<street>, city=$<city>, state=$<state>, zip_code=$<zip_code>, lat=$<lat>, lng=$<lng>, earth_coord=$<earth_coord^>, exer_swimming=$<swimming>, exer_running=$<running>, exer_lifting=$<lifting>, exer_yoga=$<yoga>, exer_cycling=$<cycling>, exer_indoor_sports=$<indoor_sports>, exer_outdoor_sports=$<outdoor_sports>, sun=$<sun>, sun_start_time=$<sun_start_time>, sun_end_time=$<sun_end_time>, mon=$<mon>, mon_start_time=$<mon_start_time>, mon_end_time=$<mon_end_time>, tues=$<tues>, tues_start_time=$<tues_start_time>, tues_end_time=$<tues_end_time>, wed=$<wed>, wed_start_time=$<wed_start_time>, wed_end_time=$<wed_end_time>, thurs=$<thurs>, thurs_start_time=$<thurs_start_time>, thurs_end_time=$<thurs_end_time>, fri=$<fri>, fri_start_time=$<fri_start_time>, fri_end_time=$<fri_end_time>, sat=$<sat>, sat_start_time=$<sat_start_time>, sat_end_time=$<sat_end_time>, intensity=$<intensity> WHERE user_id=$<user_id>",
          values: values 
      }
      var a = ""
      a = pgp.as.format(queryObj.text, queryObj.values);
      db.none(a)
        .then(function(data){
          res.send("Successfully Updated Information!<br> <a href='/profile'>Click here to go back to profile</a>");
          })
        .catch(function(reason){
          console.log(reason);
          res.status(500).send("Server Error");
      });
      
    }
    //User was not logged in when the post was made, bad request
    else{
      res.status(400).send("Bad Request");
    }
});


router.get('/profile/', function(req,res){
  if(req.session.auth){
    res.redirect('/profile/view/' + req.session.user_id);
  }
  else{
    helpers.haveUserLoginAndReturn(req, res);
  }
});

router.get('/profile/deleteProfile', function(req, res){
    if(req.session.auth){
      var context = {};
      context.csrfToken = res.locals.csrftoken;
      res.render('deleteprofile.pug', context);
    }
    else{
      helpers.haveUserLoginAndReturn(req, res);
    }
});
/**
  Perform actual deletion of user's profile
  */
router.post('/profile/deleteProfile', function(req, res){
    var queryObj = {
      text: "DELETE FROM users WHERE user_id=$1",
      values: [req.session.user_id]
    };
    db.none(queryObj)
      .then(function(data){
        console.log("RIP that person");
        res.redirect('/logout');
        })
      .catch(function(reason){
        console.log(reason);
        res.status(500).send("Server Error");
    });
});
router.get('/profile/view/:user_id', function(req, res){
    var user_id = req.params.user_id;

    queryObj = {
      text: "SELECT firstname, lastname, exer_swimming, exer_cycling, exer_lifting, exer_running, exer_yoga, exer_outdoor_sports, exer_indoor_sports, mon, tues, wed, thurs, fri, sat, sun, mon_start_time, tues_start_time, wed_start_time, thurs_start_time, fri_start_time, sat_start_time, sun_start_time, mon_end_time, tues_end_time, wed_end_time, thurs_end_time, fri_end_time, sat_end_time, sun_end_time, intensity FROM users WHERE user_id=$1",
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
        var context = {};
        context.user = data;
        //denotes if the user is already logged in based on 
        //  session storing user_id from inital login
        context.loggedIn = req.session.user_id == user_id;
        res.render('profile.pug', context);
      })
   .catch(function(reason){
     console.log(reason);
     res.status(500).send("Server Error");
    }); 
});

//Catch-all route to display a 404
router.all('*', function(req, res){
    res.status(404).render('404.pug');
});


app.use(router);

//------------Starting Server----------//

console.log("SERVER ONLINE");
//listen to the Nginx proxy server
app.listen(PORTNUMBER, appPrivIP);
