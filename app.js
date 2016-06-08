/**
  Main server code for WorkoutBudde
  Author: Michael Rechenberg
  */


var helpers = require('./helpers.js');



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
app.use(express.static('public'));

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


//-------------------------------------------------------//



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
  //HTML escape all entities
  //req.body is modified by this function
  helpers.escapeAllStrings(req.body);
  res.redirect("/findbudde/submit/success");
});

router.get('/findBudde/submit/success$', function(req, res){
    res.render('success.pug', {});
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
  console.log(username);
  var queryObj = {
    text: "SELECT salt, password FROM users WHERE username=$1",
    values: [username]
  };
  db.one(queryObj).then(function(data){
      console.log("Valid username");
      var salt = data.salt;
      var hashedProvidedPass = helpers.hashPassword(salt, providedPass);
      if(hashedProvidedPass == data.password){
        console.log("Correct login credentials!");
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
  //TODO: Use named parameters for readability
  db.none(queryObj).then(function(data){
        var salt = helpers.generateSalt();
        req.body.password = helpers.hashPassword(salt, req.body.password);
        var insertObj = {
          text: "INSERT INTO users (username, salt, password, firstname, lastname, street, city, zip_code, coord, exer_swimming, exer_cycling, exer_lifting, exer_running, exer_yoga, exer_outdoor_sports, exer_indoor_sports, mon, tues, wed, thurs, fri, sat, sun, mon_start_time, tues_start_time, wed_start_time, thurs_start_time, fri_start_time, sat_start_time, sun_start_time, mon_end_time, tues_end_time, wed_end_time, thurs_end_time, fri_end_time, sat_end_time, sun_end_time, intensity) VALUES ($1, $2, $3, $11, $12, $4, $5, $6, $7^, $8, $8, $8, $8, $8, $8, $8, $8, $8, $8, $8, $8, $8, $8, $9^, $9^,$9^,$9^,$9^,$9^,$9^,$9^,$9^,$9^,$9^,$9^,$9^,$9^, $10)",
          values: [
            req.body.username,
            salt,
            req.body.password,
            req.body.street,
            req.body.city,
            req.body.zip_code,
            'POINT(45.31221423,-90.54352)',
            true,
            "'08:00:00'::time",
            'C',
            req.body.firstname,
            req.body.lastname,
          ]

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



app.use(router);

//------------Starting Server----------//

console.log("SERVER ONLINE");
//listen to the Nginx proxy server
app.listen(PORTNUMBER, appPrivIP);
