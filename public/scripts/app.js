'use strict';

const MISSING_COVER_IMAGE = '/images/game_box_missing.jpg';

// TODO: setup generic logging (dev vs production?)
// TODO: add error handling

// global variable of game shortlist that's adjusted based on user input
var game_pick_list = [];

var active_page_id = '';


var bgg_details_game = {};


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

    // TODO: move to appropriate place
    generate_all_cards();

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
    //console.log(game_doc);

    // get a copy of the template, clone it and update the id
    var tmp = $('#game_record_template').clone()
    tmp.attr('id','card_' + game_doc['id'])

    // get remote image url, or show missing cover image
    var image_url = game_doc['remote_image_url'];
    image_url = (image_url !== undefined & image_url.length > 0) ?
                        image_url : MISSING_COVER_IMAGE;

    tmp.find('#game_cover').attr('src',image_url);
    
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


function open_game_popup(event) {

    // show the overlay and screen
    $('#add_game_overlay').show();
    $('#add_game_screen').show();
    
    // clear the form when the page first opens
    // TODO: why doesn't reset work?
    //$("#add_game_form")[0].reset();
    $('#newgame_title').val('');
    $('#newgame_image').attr('src',MISSING_COVER_IMAGE);
    $('#newgame_players_min').val('');
    $('#newgame_players_max').val('');
    $('#newgame_duration_min').val('');
    $('#newgame_duration_max').val('');
    $('#newgame_players_age').val('');
}

function close_game_popup(event) {

    $('#add_game_overlay').hide()
}

function add_game_to_lib(e) {

    // prevent default form (redirectish) behavior
    if (e.preventDefault) e.preventDefault();

    // check if URL is defined, otherwise make it empy
    var image_url = $('#newgame_image').attr('src');
    if (image_url == MISSING_COVER_IMAGE) {
        image_url = "";
    }
    
    add_game(
        -1,
        $('#newgame_title').val(),
        $('#newgame_players_min').val(),
        $('#newgame_players_max').val(),
        $('#newgame_players_age').val(),
        $('#newgame_duration_min').val(),
        $('#newgame_duration_max').val(),
        image_url
    );

    generate_all_cards();
    close_game_popup();

    return false;
}

function open_search_bgg() {

    $('#add_game_screen').hide()

    // reset search form;
    $('#search_term').val('');

    $('#screen_search_bgg').show()
}

function close_search_bgg() {

    $('#add_game_screen').show()
    $('#screen_search_bgg').hide()
}

function close_details_bgg() {
    $('#screen_bgg_details').hide();
    $('#screen_search_bgg').show()
}

function form_search_bgg(e) {

    // prevent default form (redirectish) behavior
    if (e.preventDefault) e.preventDefault();

    // TODO: show search spinner

    //var tmp_form_inputs = e.target.getElementsByTagName('input');
    var search_term = $('#search_term').val();
    
    search_bgg(search_term).then(function(search_result_list) {

        $('#search_game_results').html('');
        search_result_list.forEach(function(search_result) {
            
            var tmp_html = $('<a>[title] ([year])</a>'
                .replace('[title]',search_result['title'])
                .replace('[year]',search_result['year'])
            );

            $('#search_game_results').append($('<div></div>').append(tmp_html));

            tmp_html.on('click',{bgg_id:search_result['bgg_id']},expand_search_result);

        });
        
    }).catch(function(error){
        console.log(error);
    });

    return false;
}

function expand_search_result(event) {
    
    var bgg_id_lookup = event.data['bgg_id'];

    // lookup the id on BoardGameGeeks, then update show the details screen
    get_bgg_data(bgg_id_lookup).then(function(resolve, reject){
        
        $('#screen_search_bgg').hide();

        bgg_details_game = resolve;

        $('#bgg_details_title').html(bgg_details_game['title']);
        
        $('#bgg_details_cover').attr('src',bgg_details_game['image_url']);
        $('#bgg_details_players_min').html(bgg_details_game['players_min']);
        $('#bgg_details_players_max').html(bgg_details_game['players_max']);
        $('#bgg_details_age_min').html(bgg_details_game['players_age']);
        $('#bgg_details_time_min').html(bgg_details_game['duration_min']);
        $('#bgg_details_time_max').html(bgg_details_game['duration_max']);
        
        // add main game as first alt name
        $('#bgg_details_altnames').html('');
        var tmp_html = gethtml_bgg_altname(bgg_details_game['title']);
        tmp_html.trigger('click');
        $('#bgg_details_altnames').append(tmp_html);

        // add any other alt names
        bgg_details_game['title_alts'].forEach(function(title_alt) {
            $('#bgg_details_altnames').append(gethtml_bgg_altname(title_alt));
        });

        // add main version as first version
        $('#bgg_details_versions').html('');
        var tmp_html = gethtml_bgg_version({
            title:bgg_details_game['title'],
            image_url:bgg_details_game['image_url']
        });
        tmp_html.trigger('click');
        $('#bgg_details_versions').append(tmp_html);

        // add any other versions as well
        bgg_details_game['versions'].forEach(function(version) {
            $('#bgg_details_versions').append(gethtml_bgg_version(version));
        });

        $('#screen_bgg_details').show();

    }).catch(function(reject) {
        console.log(reject);
    });
}

/**
 * Returns HTML element representing an alternative game name from BGG
 *
 * @param {*} in_title_alt 
 * @returns HTML element with click handler
 */
function  gethtml_bgg_altname(in_title_alt) {

    var tmp_html = $('<a></a>');
    tmp_html.html(in_title_alt);
    tmp_html.attr('class','details_screen_notselected');
    tmp_html.on('click',{selected_alt: in_title_alt},select_bgg_altname);

    return tmp_html;
}

/**
 * Handler for selecting an altname in the BGG details screen
 *
 * @param {*} event click event
 */
function select_bgg_altname(event) {
    
    // update reference to selected alt
    bgg_details_game.selected_altname = event.data['selected_alt'];

    // unselect previous selection
    $('#bgg_details_altnames>.details_screen_selected').attr('class','details_screen_notselected')

    // only select target of event
    $(event.target).attr('class','details_screen_selected')
}

/**
 * Get HTML element for BGG version screen
 *
 * @param {*} in_version
 * @returns
 */
function  gethtml_bgg_version(in_version) {

    // check if URL is defined, use default if it isn't
    var image_url = in_version['image_url'];
    image_url = (image_url !== undefined & image_url.length > 0) ?
                        image_url : '/images/game_box_missing.jpg'

    var tmp_html = $('<a></a>');
    tmp_html.append('<img src="' + image_url + '">')
    tmp_html.append('<span>' + in_version['title'] + '</span>')
    tmp_html.attr('class','details_screen_notselected');
    tmp_html.on('click',{selected_version: in_version},select_bgg_version);

    return tmp_html;
}

function select_bgg_version(event) {
    
    // update reference to selected alt
    bgg_details_game.selected_version = event.data['selected_version'];

    // unselect previous selection
    $('#bgg_details_versions>.details_screen_selected').attr('class','details_screen_notselected');

    // only select target of event
    $(event.target).attr('class','details_screen_selected');
}

/** 
 * Accept the data from the BGG details screen, and use it to fill the bgg add screen
 */
function select_details_bgg(event) {

    console.log(bgg_details_game);

    $('#screen_bgg_details').hide();
    
    // check if URL is defined, use default if it isn't
    var image_url = bgg_details_game['selected_version']['image_url'];
    image_url = (image_url !== undefined & image_url.length > 0) ?
                        image_url : '/images/game_box_missing.jpg'

    // fill the details into the 'add game' screen
    $('#newgame_title').val(bgg_details_game['selected_altname']);
    $('#newgame_image').attr('src',image_url);
    $('#newgame_players_min').val(bgg_details_game['players_min']);
    $('#newgame_players_max').val(bgg_details_game['players_max']);
    $('#newgame_players_age').val(bgg_details_game['players_age']);
    $('#newgame_duration_min').val(bgg_details_game['duration_min']);
    $('#newgame_duration_max').val(bgg_details_game['duration_max']);
    
    // TODO: track bgg_id

    // show the updated add game screen
    $('#add_game_screen').show()
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
    $('#game_record_template').hide();
    $('#add_game').on('click',open_game_popup);
    $('#add_game_close').on('click',close_game_popup);

    $('#add_game_form').submit(add_game_to_lib);
    $('#add_game_searchbgg').on('click',open_search_bgg);

    $("#search_game_form").submit(form_search_bgg);
    $('#search_game_close').on('click',close_search_bgg);
    
    $('#bgg_details_select').on('click',select_details_bgg);
    $('#bgg_details_close').on('click',close_details_bgg);

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