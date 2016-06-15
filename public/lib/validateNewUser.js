var VALID_LOCATION = false;

function validateForm(){
    var firstname = document.getElementById("firstname");
    var lastname = document.getElementById("lastname");
    var username = document.getElementById("username");
    var password = document.getElementById("password");
    var passwordCheck = document.getElementById("passwordCheck");
    var street = document.getElementById("street");
    var city = document.getElementById("city");
    var zip_code = document.getElementById("zip_code");
    var times = document.getElementById("exercise-times");
    var validationError = document.getElementById("validationError");
    //reference to the DOM Node of the last error generated
    //clear away any validation messages
    while(validationError.firstChild){
        validationError.removeChild(validationError.firstChild);
    }
    //Boolean stating wheether or no the form was valid
    var valid = true;

    //Test to see if passwords match, display error
    if(password!='' && password.value != passwordCheck.value){
        var error = genError('Passwords do not match');
        validationError.appendChild(error);
        valid = false;
    }
    
    //boolean flag seeing if at least one day was selected
    var daySelected = false; 
    //Check to ensure the user selected at least one day
    //Uncheck any fullDay boxes if the day itself was not checked
    //If the user checked a day, ensure that the time was filled in
    var days = document.querySelectorAll(".chooseDay");
    var fullDays = document.querySelectorAll(".fullDay");
    var timeInputs = document.querySelectorAll(".time_input");
    for(var i = 0; i < days.length; i++){
        var start = timeInputs[2*i];
        var end = timeInputs[2*i+1];
        if (days[i].checked) {
          //update daySelected to say at least one day was selected
          if(!daySelected){
            daySelected = true;
          }
          //If the day was marked as a full day, set each value manually
          //This change should be irrelevant b/c the server will change any times to this format if fullDay was checked
          if(fullDays[i].checked){
            start.value = '00:00'; 
            end.value = '23:59';
          }
          //Notify the user they left a time empty
          else if(start.value == '' || end.value==''){
              var error = genError("A time is empty for day " + ++i);
              validationError.appendChild(error);
              valid = false;
          }
          //Both of the times are filled in, check to make sure the start time is before the end time
          else{
              console.log("derp");
              if(end.value.localeCompare(start.value) <= 0){
                  var error = genError('The start time is after or equato the end time for day ' + ++i);
                  validationError.appendChild(error);
                  valid = false;
              }
          }
        }
        else{
          fullDays[i].checked = false;
        }
    }
    //display error and mark form as invalid
    ((asdf)=>{
      if(!asdf){
        var error = genError('You must choose at least one day');
        validationError.appendChild(error);
        valid = false;
      }
    })(daySelected);

    location.hash = '#validationError';
    if(VALID_LOCATION){
        return valid;
    }
    else{
        validationError.appendChild(genError('Invalid Address'));
        return false;
    }
}



/**
  Helper function to generate Error div
  */
function genError(msg){
   var error = document.createElement('div');
   error.setAttribute('class', 'alert alert-info');
   error.innerHTML = msg;
   return error;
}

