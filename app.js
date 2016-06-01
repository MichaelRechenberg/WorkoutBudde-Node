/**
  Main server code for WorkoutBudde
  Author: Michael Rechenberg
  */


var helpers = require('./helpers.js');



//Init Express app and Router
//TODO: Set PORTNUMBER to 443 in production
var PORTNUMBER = 8080;
var appPrivIP = '10.136.7.139'; 
var express = require('express');
var app = express();
var router = express.Router();


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
    var sess = req.session;
    if(sess.views){
      sess.views++;
      res.render('frontpage.pug', {'views': sess.views});
    }
    else{
      sess.views=1;
      res.send("This is the first time you've visited this page!");
    }
    res.end();
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

router.get('/login$', function(req, res){
    if(req.session.auth){
      res.send("You're already logged in");
    }
    else{
      res.render('login.pug', {'csrfToken': res.locals.csrftoken});
    }
});



app.use(router);

//------------Starting Server----------//

console.log("SERVER ONLINE");
//listen to the Nginx proxy server
app.listen(PORTNUMBER, appPrivIP);
