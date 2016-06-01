/**
  Main server code for WorkoutBudde
  Author: Michael Rechenberg
  */

//Init Express app and Router
//TODO: Set PORTNUMBER to 443 in production
var PORTNUMBER = 3000;
var express = require('express');
var app = express();
var router = express.Router();
var fs = require('fs');
var https = require('https');
var http = require('http');

//Have server run on https
https.createServer({
  key: fs.readFileSync('private.key'),
  cert: fs.readFileSync('certificate.pem'),
}, app).listen(PORTNUMBER);


//redirect all http requests to their https equivalent
//TODO: Change port from 1337 to 80 in production
var httpApp = express();
http.createServer(httpApp).listen(1337);
httpApp.all('*', function(req, res){
  console.log('http is a no-no');
  
  res.redirect(301, 'https://' + req.hostname + ':' + PORTNUMBER+ req.url);
}); 

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
//TODO: change store to redis for production
//TODO: Reinstall cookie-parser if I scrap the sessions
//req.session
var session = require('express-session');
app.use(session({
  secret: 'VblaEgIcr3C2B4qJER3a9iJOSaugMHEjDquvmA4',
  resave: true,
  saveUninitialized: true,
  httpOnly: true,
  cookie: {secure: true},
}));

//Passport for Authentication
var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

//CSRF
//Uses session middleware rather than cookie-parser
var csrf = require('csurf');
app.use(csrf({}));

//Add CSRF Token to the response on every request
app.use(function(req, res, next){
    res.locals.csrftoken = req.csrfToken();
    next();
});


//-------------------------------------------------------//



//-----------ROUTING----------------//



router.get('/', function(req, res){
    console.log('Front page reached');
    res.render('frontpage.pug');
});

router.get('/findBudde$', function(req, res){
    res.render('findbudde.pug', { "csrfToken": res.locals.csrftoken});
});

router.post('/findBudde/submit$', function(req, res){
  console.log(req.body);
  res.redirect("/findbudde/submit/success");
});

router.get('/findBudde/submit/success$', function(req, res){
    res.render('success.pug');
    res.end();
});


app.use(router);

//------------Starting Server----------//

console.log("Listening on port " + PORTNUMBER);
//app.listen(PORTNUMBER);
