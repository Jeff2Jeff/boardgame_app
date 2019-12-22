'use strict';

// TODO: setup generic logging (dev vs production?)
// TODO: add error handling

// this is a global variable that's adjusted based on user input
var game_pick_list = [];
var active_page_id = '';

/**
 * Start up a new game roll 'session'
 * Local DB interaction goes here
 */
function get_game_list(e) {
    
    // prevent default form (redirectish) behavior
    if (e.preventDefault) e.preventDefault();

    // find the value field in the forms
    var tmp_form_inputs = e.target.getElementsByTagName('input');
    var player_num = parseInt(tmp_form_inputs['player_num'].value);
    var player_age_min = parseInt(tmp_form_inputs['player_age_min'].value);
    var duration_max = parseInt(tmp_form_inputs['duration_max'].value);
    
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

/**
 * App interactions for selecting a game: will transition between 
 * screens and update the 'shortlist' of games based on user actions.
 */
function roll_for_game() {

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
            
            var gamelist_length_initial = game_pick_list.length;
            var selected_index = randomIntFromInterval(0, gamelist_length_initial - 1);
            //selected_game = game_pick_list[selected_index];
            
            // update list of selected games so that the currently roled on isn't in it anymore
            var selected_game = game_pick_list.splice(selected_index, 1)[0]
            
            // some logging
            console.log(game_pick_list)
            console.log(selected_game)
            console.log(gamelist_length_initial, selected_index, selected_game['title'])

            // show the result on screen
            $('#roll_result_title').html('"' + selected_game['title'] + '"')
            $('#roll_result_length').html(gamelist_length_initial)
            $('#roll_result_panel').show()

            // disable the reroll button if there's only one game left
            $('#button_reroll').attr("disabled", gamelist_length_initial == 1);

        } else {

            console.log("No games were found")

            // update panels: show the general 'no game found' screen
            $('#roll_nogame_panel').show()
            
        }
    }, 2000);
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

/**
 * Navigate to different page in the app
 */
function navigate_to(event) {

    var newpage_id = event.data['page_id'];

    // TODO: some animation

    // Hide currently active page
    if($(active_page_id)) {
        $(active_page_id).hide();
    }

    // show new page and store reference
    if($(newpage_id)) {
        $(newpage_id).show();
        active_page_id = newpage_id;
    }
}

/**
 * Generate a new html element representing the game, 
 * based on a provide document (PouchDB)
 *
 * HTML element will be provided based on the template
 * 
 * @param {*} game_doc
 */
function generate_game_card(game_doc)
{
    // get a copy of the template, clone it and update the id
    var tmp = $('#game_record_template').clone()
    tmp.attr('id','card_' + game_doc['_id'])
    
    // set contents of the card
    tmp.find('#game_title').html(game_doc['title'])
    tmp.find('#game_time_min').html(game_doc['duration_min'])
    tmp.find('#game_time_max').html(game_doc['duration_max'])
    tmp.find('#game_players_min').html(game_doc['players_min'])
    tmp.find('#game_players_max').html(game_doc['players_max'])
    tmp.find('#game_age_min').html(game_doc['players_age'])

    return tmp;
}


/**
 * Generate list of cards for all games in the local database
 */
function generate_all_cards() {

    // TODO: show loading screen

    $('#game_card_list').html('');

    get_all_games().then(
        function(game_list_full) {

            game_list_full.forEach(game_doc => {
                var new_card = generate_game_card(game_doc);
                new_card.show();
                $('#game_card_list').append(new_card);
            });

    }).catch(function(error){
        console.log('DB lookup error', error);
    });
}




/** 
 * All things that happen after document loads go here.
 */
$(document).ready(function() {

    /** menu stuff */

    // menu navigation functions
    $('#app_menu_roll').on('click',{page_id: '#game_selection'},navigate_to);
    $('#app_menu_games').on('click',{page_id: '#game_management'},navigate_to);

    /** gameroll stuff  */

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

    /** game management stuff */
    $('#game_record_template').hide()

    // initial page of the app
    $('#app_menu_games').trigger('click');

    generate_all_cards();
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