function fillField(field, value) {
  if (field) {
    field.value = value;
  }
}

function fillforms1(data) {
	var fullname = document.querySelector('input[name="fullname"]');
    fillField(fullname, data);

    var email = document.querySelector('input[name="email"]');
    fillField(email, data);

	var city = document.querySelector('input[name="city"]');
    fillField(city, data);
}


function injectorMain(value) {
	fillforms1(value);
}

// Call the function specified in the variable
if (typeof window[functionToCall] === 'function') {
	console.log(value);
    window[functionToCall](value);
}
