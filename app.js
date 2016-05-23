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

var pug = require('pug');
app.set('views', './views');


//-----------ROUTING----------------//


//all forms will be put in req.body.[input tag's name attribute]
app.use(bodyParser.json());

router.get('/', function(req, res){
    console.log('Front page reached');
		res.render('frontpage.pug', {foo: 'Michael Rechenberg'});
});

app.use(router);
console.log("Listening on port " + PORTNUMBER);
app.listen(PORTNUMBER);
