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
    disableTTL: true,
  }),
  resave: true,
  saveUninitialized: true,
  httpOnly: true,
  proxy: true,
  //be logged in for a day
  maxAge: 1000*60*60*24,
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

//Accept form and create query string for /findBudde/submit/results
router.post('/findBudde/submit$', function(req, res){
  var values = {};
  values.lat = req.body.latitude;
  values.lng = req.body.longitude;
  values.range = req.body.range;
  //represents what page the user is on, used
  //  in OFFSET clause in SQL query
  values.page = 1;
  //add exercses to the query only if the user provided any
  if(req.body.exercises){
    values.exercises = req.body.exercises;
  }
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
  if(lat < -90 || lat > 90 || lng < -180 || lng > 180 || range < 0 || range > 100){
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
      text: "SELECT user_id, firstname, lastname, exer_swimming, exer_running, exer_lifting, exer_yoga, exer_cycling, exer_indoor_sports, exer_outdoor_sports, distance FROM (SELECT user_id, firstname, lastname, exer_swimming, exer_running, exer_lifting, exer_yoga, exer_cycling, exer_indoor_sports, exer_outdoor_sports, earth_coord FROM users WHERE (users.lat BETWEEN $6 AND $7)AND (users.lng BETWEEN $8 AND $9)) near, earth_distance(ll_to_earth($1, $2), near.earth_coord) AS distance WHERE distance < $3", 
      values: values
    };
    //Add exercises to query, if the user requested it 
    if(req.query.exercises){
      //ensure req.query.exercises is an array
      if(typeof req.query.exercises == 'string'){
        req.query.exercises = [req.query.exercises];
      }
      var exercises = req.query.exercises;
      var queryText = queryObj.text;
      //Used to convert string of exercise
      //To the corresponding column in the DB
      var addExerCol = function(value){
        switch(value){
          case 'Swimming':
            return 'exer_swimming=True';
            break;
          case 'Running':
            return 'exer_running=True';
            break;
          case 'Lifting':
            return 'exer_lifting=True';
            break;
          case 'Yoga':
            return 'exer_yoga=True';
            break;
          case 'Cycling':
            return 'exer_cycling=True';
            break;
          case 'Indoor Sports':
            return 'exer_indoor_sports=True';
            break;
          case 'Outdoor Sports':
            return 'exer_outdoor_sports=True';
            break;
          default:
            throw "Invalid Exercise"
            break;
        }
      };
      queryText += ' AND ('
      //For all but the last exercise, add the
      // exercise column and the 'OR' keyword
      for(var i = 0; i < exercises.length -1; i++){
        queryText += (addExerCol(exercises[i]) + " OR ");
      }
      //For the last exercise, close off the ')'
      queryText += (addExerCol(exercises[exercises.length-1]) + ")");

    queryObj.text = queryText;

    }

    queryObj.text += ' ORDER BY distance LIMIT $4 OFFSET $5'
    console.log(queryObj.text);
    //data is an array containing rows of objects where the object properties
    //  are the columns designated in the query
    //If no rows are returned, then data is an empty array
    db.any(queryObj).then((data)=>{
        data.forEach(function(val, index, data){
          //Convert all distances from meters to kilometers
          data[index].distance = Math.floor(data[index].distance/1000);
          
        });

        //Generate links for next/prev page
        links = {}
        req.query.page = Number(req.query.page);
        //make req.query.page a Number for use with +-
        if(req.query.page > 1){
          req.query.page -= 1;
          links.prevPage = querystring.stringify(req.query);
          req.query.page += 1;
        }

          req.query.page += 1;
          links.nextPage = querystring.stringify(req.query);
          req.query.page -= 1;

        //results contains an array of users returned by the database
        //query contains the query parameters given (used for constructing querystring for pagination)
        res.render('findbudderesults.pug', {
          results: data, 
          links: links
        });
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
    text: "SELECT user_id, salt, firstname, lastname, password FROM users WHERE username=$1",
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
        req.session.firstname = data.firstname;
        req.session.lastname= data.lastname;
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
      req.session.destroy();
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
  var queryObj = {
    text: "SELECT user_id FROM users WHERE username=$1",
    values: [req.body.username]
  };
  //make sure there are no users with that username 
  //if the username has not been used before, insert into DB
  //In exercise-times, 0-Sun, 1-Mon,...6-Sat
  var user_id = null;
  db.none(queryObj)
    //insert main info
    .then(function(data){
        var values = helpers.convertReqToValuesObj(req);
        var insertObj = {
          text: "INSERT INTO users (username, salt, password, firstname, lastname, street, city, state, zip_code, lat, lng, earth_coord, exer_swimming, exer_running, exer_lifting, exer_yoga, exer_cycling, exer_indoor_sports, exer_outdoor_sports, sun, sun_start_time, sun_end_time, mon, mon_start_time, mon_end_time, tues, tues_start_time, tues_end_time, wed, wed_start_time, wed_end_time, thurs, thurs_start_time, thurs_end_time, fri, fri_start_time, fri_end_time, sat, sat_start_time, sat_end_time, intensity) VALUES ($<username>, $<salt>, $<password>, $<firstname>, $<lastname>, $<street>, $<city>, $<state>, $<zip_code>, $<lat>, $<lng>, $<earth_coord^>, $<swimming>, $<running>, $<lifting>, $<yoga>, $<cycling>, $<indoor_sports>, $<outdoor_sports>, $<sun>, $<sun_start_time>, $<sun_end_time>, $<mon>, $<mon_start_time>, $<mon_end_time>, $<tues>, $<tues_start_time>, $<tues_end_time>, $<wed>, $<wed_start_time>, $<wed_end_time>, $<thurs>, $<thurs_start_time>, $<thurs_end_time>, $<fri>, $<fri_start_time>, $<fri_end_time>, $<sat>, $<sat_start_time>, $<sat_end_time>, $<intensity>) RETURNING user_id",
          values: values 
        };
        var a = "";
        a = pgp.as.format(insertObj.text, insertObj.values);
        console.log(a);
        return db.one(a);
    })
    .then(function(data){
        user_id = data.user_id;
        var queryObj = {
          text: "INSERT INTO ContactInfo (user_id, email, phone_num) VALUES ($1, $2, $3)",
          values: [data.user_id, req.body.email, req.body.phone_num]
        };
        return db.none(queryObj);
      }) 
    .then(function(){
            //log the person in and set any session variables
            //TODO: FirstName and Lastname?
            req.session.auth = true;
            req.session.user_id = user_id;
            res.redirect('/');

        })
    .catch(function(reason){
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
    var mainInfo = db.one(queryObj);
    var contactInfo = db.one("SELECT email, phone_num FROM ContactInfo WHERE user_id=$1", [user_id]);
    Promise.all([mainInfo, contactInfo])
      .then(function(data){
        var context = {};
        context.csrfToken = res.locals.csrftoken;
        context.user = data[0];
        context.contactInfo = data[1];
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
        .then(function(){
          var query = "UPDATE ContactInfo SET email=$2, phone_num=$3 WHERE user_id=$1";
          return db.none(query, [req.session.user_id, req.body.email, req.body.phone_num]); 
        })
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
    //Used to pass in data to Pug Template
    var context = {};
    context.csrftoken = res.locals.csrftoken;
    //indicates if the user viewing the profile is logged in
    context.loggedIn = req.session.auth;
    //holds user_id of the page being viewed
    context.user_id = user_id;
    //denotes if the user is already logged in based on 
    //  session storing user_id from inital login
    context.ownProfile = req.session.user_id == user_id;
    



    //Used to store all our promises
    var promiseArr = []; 


    queryObj = {
      text: "SELECT firstname, lastname, exer_swimming, exer_cycling, exer_lifting, exer_running, exer_yoga, exer_outdoor_sports, exer_indoor_sports, mon, tues, wed, thurs, fri, sat, sun, mon_start_time, tues_start_time, wed_start_time, thurs_start_time, fri_start_time, sat_start_time, sun_start_time, mon_end_time, tues_end_time, wed_end_time, thurs_end_time, fri_end_time, sat_end_time, sun_end_time, intensity FROM users WHERE user_id=$1",
     values: [user_id] 
    }
    //Get the main info (personal info, exercises, availability)
    var mainInfo = db.one(queryObj).then(function(data){
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
        context.user = data;
      })
   .catch(function(reason){
     console.log(reason);
     res.status(500).send("Server Error");
    }); 
  promiseArr.push(mainInfo);

  //Only get notifications if the user is on their own profile
  if(context.ownProfile){
    //Get any notifications
    var BRQueryObj = {
      text: "SELECT notif_id, message, other_user_id FROM BuddeRequests WHERE owner_user_id=$1 ORDER BY time_created LIMIT 5",
      values: [req.session.user_id]
    }
    var buddeRequests = db.any(BRQueryObj);
    buddeRequests.then(function(data){
        context.buddeRequests = data;
    });
    buddeRequests.catch(function(reason){
        console.log(reason);
        res.status(500).send("Server Error");
    });
    promiseArr.push(buddeRequests);
  } 

  //If the user is logged in and they are viewing
  //  a profile other than their own, see if the
  // logged in user is friends with this user's profile
  if(req.session.auth && (req.session.user_id != user_id)){
      //Done to adhere to Budde table standard that the smaller user_id
      //  is stored in user_1 and the larger user_id
      //  is stored in user_2
      var smaller = Math.min(req.session.user_id, user_id);
      var larger = Math.max(req.session.user_id, user_id);
      var friendQueryObj = {
        text: "SELECT COUNT(*) AS row_count FROM Buddes WHERE user_1=$1 AND user_2=$2", 
        values: [smaller, larger]
      }
      var friend = db.oneOrNone(friendQueryObj)
        .then(function(data){
          //They are friends
          if(data.row_count == 1){
            context.isFriend = true;
          }
          else{
            context.isFriend = false;
          }
      });
      
      promiseArr.push(friend);
  }


  Promise.all(promiseArr)
    //If the user is a friend to the logged in user
    //  then retrieve the contact Info of the profile being visited and then render the page
    //Else, see if a friend request is pending
    .then(function(){
        if(context.isFriend){
          let contactInfoQueryObj = {
            text: "SELECT email, phone_num FROM ContactInfo WHERE user_id=$1",
            values: [user_id] 
          };
          return db.oneOrNone(contactInfoQueryObj)
            .then(function(data){
              context.contactInfo = data;
          });
        }
        else{
          //The user is visiting their own profile,
          // so there is no reason to view pending
          // BuddeRequests
          if(context.ownProfile){
            return Promise.resolve();
          }
          //See if the friend request is pending
          // if the user is loggedIn
          else if (context.loggedIn){
            let buddeRequestPendingQO = {
              text: "SELECT COUNT(*) AS rowcount FROM BuddeRequests WHERE (owner_user_id=$1 AND other_user_id=$2) OR (other_user_id=$1 AND owner_user_id=$2)",
              values: [user_id, req.session.user_id]
            };

            return db.one(buddeRequestPendingQO)
              .then(function(data){
                if(data.rowcount == 0){
                  context.requestPending = false;
                }
                else{
                  context.requestPending = true;
                }
            });
          }
        }
    })
    .then(function(){
        console.log(context);
        res.render('profile.pug', context);
    })
    .catch(function(reason){
        console.log(reason);
        res.status(500).send("Server Error");
    });


});


//Get all of the user's friends, in alphabetical order
router.get('/profile/viewFriends', (req, res)=>{
    if(req.session.auth){
      let user_id = req.session.user_id;
      let queryObj = {

        text: "SELECT user_id, firstname, lastname FROM users INNER JOIN Buddes ON users.user_id=Buddes.user_2 WHERE user_1=$1 ORDER BY firstname",
        values: [user_id]

      };

      let retrieveAllFriends = db.any(queryObj)
        .then((data)=>{
          let context = {};
          context.user = {};
          context.user.firstname = req.session.firstname;

          context.results = data;
          res.render('viewfriends.pug', context);

        })
        .catch((reason)=>{
          console.log(reason);
          res.status(400).send("Bad Query");
        });
    }
    else{
      helpers.haveUserLoginAndReturn(req, res);
    }
 });

//Process a BuddeRequest, creating a BuddeRequest// from the logged in user to another user
//Done by making an entry in the BuddeRequest Table 
router.post('/buddeRequest/makeRequest/', function(req, res){
    //Only process the request if the user is logged in
    if(req.session.auth){
      console.log(req.body);
      let message = req.session.firstname + ' ' + req.session.lastname + ' would like to be your Budde!';
      let queryObj = {
        text: "INSERT INTO BuddeRequests (owner_user_id, message, sender_name, other_user_id) VALUES ($1, $2, $3, $4)",
        values: [req.body.recievingUserId, message, req.session.firstname + ' ' + req.session.lastname, req.session.user_id]
      };
      db.none(queryObj)
        .then(function(){
          console.log("Friend Request Made Successfully");
          res.end();
       })
        .catch(function(reason){
          console.log(reason);
          res.status(500).send("Server Error");
       });
    }
    else{
      res.status(400).send("Bad Request");
    }
});

//TODO: Change req.body.recievingUserId to req.session.user_id for security reasons 

//Process a BuddeRequest, making the two users Buddes
router.post('/buddeRequest/makeBuddes', function(req, res){
  if(req.session.auth){
    //The user_id of the user that is logged in
    var loggedInUserId = req.body.recievingUserId;
    //The user_id of the user that is asking to be a Budde
    var askingUserId = req.body.askingUserId;

    //Transaction
    //Make two entries to show symmetrical relationship
    db.tx(function(t){
      
      var insertNewBudde1 = this.none("INSERT INTO Buddes VALUES ($1, $2)", [loggedInUserId, askingUserId]);
      var insertNewBudde2 = this.none("INSERT INTO Buddes VALUES ($2, $1)", [loggedInUserId, askingUserId]);
      var deleteNotification = this.none("DELETE FROM BuddeRequests WHERE notif_id=$1", [req.body.notif_id]);
      this.batch([insertNewBudde1, insertNewBudde2, deleteNotification]);
      })
      .catch(function(reason){
        //TODO: send bad http status?
        console.log(reason);
    });
    
  }
  res.end();
});

//Process a Budde Request, deleting the pending request
router.post('/buddeRequest/deleteRequest', function(req, res){
    if(req.session.auth){
      //The user_id of the user that is logged in
      var loggedInUserId = req.session.user_id;
      //The user_id of the user that was being asked to be a Budde
      var requestedUserId = req.body.requestedUserId;
      
      var queryObj = {
        text: "DELETE FROM BuddeRequests WHERE owner_user_id=$1 AND other_user_id=$2",
        values: [requestedUserId, loggedInUserId]
      };

      db.none(queryObj)
        .catch((reason)=>{
          console.log(reason);
      });
     
    }
    res.end();
});

//Process a Budde Request, making the logged in user and the
//  previous user no longer Buddes
router.post('/buddeRequest/deleteBudde', function(req, res){
    if(req.session.auth){
      //The user_id of the user that is logged in
      var loggedInUserId = req.session.user_id;
      //The user_id of the user that was being asked to be a Budde
      var requestedUserId = req.body.requestedUserId;
     
      //Delete both rows within the Buddes table that store friendship 
      db.tx(function(t){
        
        var deleteBuddeRow1 = this.none("DELETE FROM Buddes WHERE user_1=$1 AND user_2=$2", [loggedInUserId, requestedUserId]);
        var deleteBuddeRow2 = this.none("DELETE FROM Buddes WHERE user_1=$1 AND user_2=$2", [requestedUserId, loggedInUserId]);
        this.batch([deleteBuddeRow1, deleteBuddeRow2]);
        })
        .catch(function(reason){
          console.log(reason);
      });
       
    }
    res.end();
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
