"use strict"
$(document).ready(function(){  
  var forms = document.querySelectorAll(".budde-request-form");
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
            evt.target.value = "Request Accepted!"
            evt.target.disabled = true;
            
          }
        }
        http.send(JSON.stringify(data));
    });
  }
});
