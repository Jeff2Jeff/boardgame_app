const request = require('request')

function processForm(e) {
    if (e.preventDefault) e.preventDefault();

    //<!-- action="/gamedb/rollgame" method="POST" -->
    
    console.log("processing form!")

    request.post(
        '/gamedb/rollgame',
        { json: { key: 'value' } },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("welp")
                console.log(body);
            }
        }
    );


    // You must return false to prevent the default form behavior
    return false;
}

// attach listener to the submit event
var form = document.getElementById('roll_form');
if (form.attachEvent) {
    form.attachEvent("submit", processForm);
} else {
    form.addEventListener("submit", processForm);
}
