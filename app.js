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

var pug = require('pug');
app.set('views', './views');


//-----------ROUTING----------------//



router.get('/', function(req, res){
    console.log('Front page reached');
		res.render('frontpage.pug', {foo: 'Michael Rechenberg'});
});

router.post('/budde/', function(req, res){
		console.log(req.body);
		res.send("Thank you for your submission!");
});

app.use(router);

//------------Starting Server----------//

console.log("Listening on port " + PORTNUMBER);
app.listen(PORTNUMBER);
