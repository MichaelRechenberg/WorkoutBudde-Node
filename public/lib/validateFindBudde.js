var VALID_LOCATION = false;

function validateForm(){
    var firstname = document.getElementById("firstname");
    var lastname = document.getElementById("lastname");
    var street = document.getElementById("street");
    var city = document.getElementById("city");
    var zip_code = document.getElementById("zip_code");
    var validationError = document.getElementById("validationError");
    //reference to the DOM Node of the last error generated
    //clear away any validation messages
    while(validationError.firstChild){
        validationError.removeChild(validationError.firstChild);
    }
    //Place user's selection for range into hidden range input element
    var range = document.getElementById('select_range');
    document.getElementById('input_range').value = range.options[range.selectedIndex].value;

    //VALID_LOCATION is set by geocode.js
    if(VALID_LOCATION){
        return true;
    }
    else{
        validationError.appendChild(genError('Invalid Address'));
        location.hash = '#validationError';
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

