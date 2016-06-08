"use strict";

exercises = [
  "Swimming",
  "Running",
  "Weight Lifting",
  "Yoga",
  "Cycling (Outdoor)",
  "Sports",
];
var loadFunction = function(){
  //load all the exercises
  var exerciseCheckboxes = document.getElementById("exercises"); 
  exercises.forEach(function(exercise){
      //create a checkbox option for each exercise
      var label = document.createElement("label");
      var exerciseOption = document.createElement("input");
      exerciseOption.setAttribute("class", "form-control");
      exerciseOption.setAttribute("name", "exercises");
      exerciseOption.setAttribute("type", "checkbox");
      exerciseOption.setAttribute("value", exercise);
      label.innerHTML = exercise;
      exerciseCheckboxes.appendChild(label);
      label.appendChild(exerciseOption);
  });
  console.log("Done!");
};
window.onload = loadFunction;
window.onbeforeunload = function() {
  console.log("Why did you hit the back button?");
  alert("asdf");
};
