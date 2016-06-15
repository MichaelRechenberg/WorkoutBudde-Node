/**
  Contains code to geocode address given by user
  */
function geocodeAddress(){
    console.log("called");
    var street = document.getElementById('street').value;
    var city = document.getElementById('city').value;
    var state = document.getElementById('state').value;
    var zip_code = document.getElementById('zip_code').value;
    var address = encodeURIComponent(street + ' ' + city + ' ' + state + ' ' + zip_code);
    console.log(address);
    $.ajax("https://maps.googleapis.com/maps/api/geocode/json?address=" + address + "&key=AIzaSyBjjCyHjLvU5dv3cDR-NsNOeQsGryzOxmQ", {
      success: function(data){
        console.log("successful call");
        if(data.status == "OK"){
          //Remove any error messages
          var geocodeWrapper = document.getElementById("geocodePrompt");
          while(geocodeWrapper.firstChild){
            geocodeWrapper.removeChild(geocodeWrapper.firstChild);
          }
          //show user their address was valid
          var msg = document.createElement('div');
          msg.innerHTML = "Valid Address";
          msg.setAttribute('class', 'alert alert-success');
          geocodeWrapper.appendChild(msg);
          var lat = data.results[0].geometry.location.lat;
          var lng = data.results[0].geometry.location.lng;
          console.log("Lat: " + lat);
          console.log("Lon: " + lng);
          document.getElementById("latitude").value = lat;
          document.getElementById("longitude").value = lng;
          VALID_LOCATION = true;
        }
        else{
          var geocodeWrapper = document.getElementById("geocodePrompt");
          //remove any old prompts
          while(geocodeWrapper.firstChild){
              geocodeWrapper.removeChild(geocodeWrapper.firstChild);
          }
          var error = genError("Google could not understand address information: Check your spelling");
          geocodeWrapper.appendChild(error);
          VALID_LOCATION = false;
          console.log("Could not geocode given address");
        }
      },
      error: function(xhr, err){
        console.log("err");
        console.log(err);
        VALID_LOCATION = false;
        alert("Error in making API call, contact site administrator");
      }
    });
}
 
