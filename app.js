/**
  Main server code for WorkoutBudde
  Author: Michael Rechenberg
  */

//Init Express app and Router
var PORTNUMBER = 3000;
var express = require('express');
var app = express();
var router = express.Router();

//Init middleware
var bodyParser = require('body-parser');
//all forms will be put in req.body.[input tag's name attribute]
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//Pug Template Engine
var pug = require('pug');
app.set('views', './views');

//Serve static files
app.use(express.static('public'));

//Cookies and CSRF
var cookieParser = require('cookie-parser');
app.use(cookieParser('7$sJ9M#kR[Z9%hX31LW^Rswu(!w'));

var csrf = require('csurf');
app.use(csrf({cookie: true}));

//Add CSRF Token to the response on every request
app.use(function(req, res, next){
		res.locals.csrftoken = req.csrfToken();
		next();
});



//-----------ROUTING----------------//



router.get('/', function(req, res){
    console.log('Front page reached');
		res.render('frontpage.pug');
});

router.get('/findBudde/$', function(req, res){
		res.render('findbudde.pug', { csrfToken: res.locals.csrftoken, foo : "Hello World"});
});

router.post('/findBudde/submit/$', function(req, res){
		console.log(req.body);
		res.send("Thank you for your submission!");
});


app.use(router);

//------------Starting Server----------//

console.log("Listening on port " + PORTNUMBER);
app.listen(PORTNUMBER);
