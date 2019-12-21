
function roll_game(e) {
    
    // prevent default form (redirectish) behavior
    if (e.preventDefault) e.preventDefault();

    // find the value field in the forms
    tmp_form_inputs = e.target.getElementsByTagName('input');
    player_num = parseInt(tmp_form_inputs['player_num'].value);
    player_age_min = parseInt(tmp_form_inputs['player_age_min'].value);
    duration_max = parseInt(tmp_form_inputs['duration_max'].value);
    
    // TODO: check values integrity? (Note: should also already be done by form...)



    find_games(player_num,duration_max, player_age_min).then(
        function(game_search_result) {

            // if any results were found, continue to pick one
            if(game_search_result.length > 0) {
                random_index = randomIntFromInterval(0, game_search_result.length - 1)
                
                console.log(game_search_result.length, random_index, game_search_result[random_index]['title'])
            } else {
                console.log("No games were found")
            }
    }).catch(function(error){
        console.log('welp also');
    });

    // return false to prevent the default form behavior
    return false;
}

// attach listener to the form submitted to roll for a game
var form = document.getElementById('roll_form');
if (form.attachEvent) {
    form.attachEvent("submit", roll_game);
} else {
    form.addEventListener("submit", roll_game);
}



// TODO: move function to support js file
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}