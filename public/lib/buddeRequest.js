/**
  Takes any forms relating to Buddes (Create BuddeRequest, Delete
    a BuddeRequest, Delete a Budde), and makes the form via AJAX call
  */

"use strict"
$(document).ready(function(){  
  var buddeRequestForms = document.querySelectorAll(".budde-request-form");
  var deleteBuddeRequestForm = document.querySelectorAll(".delete-budde-request-form");
  var deleteBuddeForm = document.querySelectorAll(".delete-budde-form");
  makeFormAjax(buddeRequestForms, "Budde Request Made");
  makeFormAjax(deleteBuddeRequestForm, "Deleted Budde Request");
  makeFormAjax(deleteBuddeForm, "Removed Budde");
});

/**
  Takes a NodeList as a parameter and makes an ajax request
  to the "action" attribute of the form rather than the
  default behavior

  --forms The NodeList of form elements
  --successMessage A string containing what you want to display 
    after the request has been made ("Request Made", or "Deleted Request"...)

  The CSRF Token must be the first input and the Submit input
  mas be the last input element of the form
  */
function makeFormAjax(forms, successMessage){

  for(var i = 0; i < forms.length; i++){
    forms[i].addEventListener('click', function(evt){
        evt.preventDefault();
        evt.stopPropagation();
        var form = evt.currentTarget;
        var inputs = form.getElementsByTagName("input");
        var csrfToken = inputs[0].value;
        //the -1 is to ensure we don't encode 
        // the submit button :P
        var data = {};
        for(var j = 0; j < inputs.length-1; j++){
          data[inputs[j].name] = inputs[j].value;
        }
        var http = new XMLHttpRequest();
        http.open("POST", form.getAttribute("action"), true);
        http.setRequestHeader("Content-Type", "application/json");
        http.setRequestHeader("x-csrf-token", csrfToken);
        http.onreadystatechange = function(){
          if(http.readyState == 4 && http.status==200){
            console.log(evt.target);
            evt.target.value = successMessage; 
            evt.target.disabled = true;
            
          }
        }
        http.send(JSON.stringify(data));
    });
  }
}
