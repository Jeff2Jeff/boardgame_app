// this is a global variable that's adjusted based on user input
var game_pick_list = [];

function get_game_list(e) {
    
    // prevent default form (redirectish) behavior
    if (e.preventDefault) e.preventDefault();

    // find the value field in the forms
    tmp_form_inputs = e.target.getElementsByTagName('input');
    player_num = parseInt(tmp_form_inputs['player_num'].value);
    player_age_min = parseInt(tmp_form_inputs['player_age_min'].value);
    duration_max = parseInt(tmp_form_inputs['duration_max'].value);
    
    // TODO: check values integrity? (Note: should also already be done by form...)

    // look for the games in the local db, store then in the global list
    // and continue with rolling
    find_games(player_num,duration_max, player_age_min).then(
        function(game_search_result) {

            // copy to local list of games
            game_pick_list = game_search_result.slice();

            roll_for_game();

    }).catch(function(error){
        console.log('DB lookup error', error);
    });

    // return false to prevent the default form behavior
    return false;
}


function roll_for_game() {

    // TODO: CSS update to make this code block the form

    // show generic overlay that disables the form
    $('#roll_overlay').show();
    // show game_roll spinner and hide every of the other outcomes
    $('#roll_animation_panel').show();
    $('#roll_result_panel').hide();
    $('#roll_nogame_panel').hide()
    
    setTimeout( function() {
        
        // always hide the animation
        $('#roll_animation_panel').hide()

        // if any results were found, continue to pick one
        if(game_pick_list.length > 0) {
            
            gamelist_length = game_pick_list.length;
            selected_index = randomIntFromInterval(0, gamelist_length - 1);
            //selected_game = game_pick_list[selected_index];
            
            // update list of selected games so that the currently roled on isn't in it anymore
            selected_game = game_pick_list.splice(selected_index, 1)[0]
            
            // some logging
            console.log(gamelist_length, selected_index, selected_game['title'])
            
            // show the result on screen
            $('#roll_result_title').html('"' + selected_game['title'] + '"')
            $('#roll_result_length').html(gamelist_length)
            $('#roll_result_panel').show()
            
        } else {

            console.log("No games were found")

            // update panels: show the general 'no game found' screen
            $('#roll_nogame_panel').show()
            
        }
    }, 1000);
}

/**
 * Close all result panels again, and give user access to the main selection form again
 */
function close_results() {
    $('#roll_overlay').hide();
    $('#roll_animation_panel').hide();
    $('#roll_result_panel').hide();
    $('#roll_nogame_panel').hide()
}

$(document).ready(function(){

    // form submitted to roll for a game
     $("#roll_form").submit(get_game_list);

    // reroll without updating filters
    $('#button_reroll').on('click',roll_for_game);
    // close all results and get access to the form again
    $('#button_updatefilters').on('click',close_results);
    $('#button_closenogame').on('click',close_results);
    
    // accept suggestion and play the game
    // TODO: track recently played games to exclude from reroll
    $('#button_play').on('click',close_results);
    
});

/**
 * Get random integer in inteval(incuding?)
 *
 * @param {*} min lower bound (inclusive) of interval
 * @param {*} max upper bound (inclusive) of interval
 * @returns random integer
 */
// TODO: check if end of interval is as likely as the rest...
// TODO: move function to support js file
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}