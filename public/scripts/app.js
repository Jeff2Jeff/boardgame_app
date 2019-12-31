'use strict';

var will_respond_to_shaking = false;
var shake_from_main = true;
// TODO: setup generic logging (dev vs production?)
// TODO: add error handling

// TODO: loading screen on BGG search
// TODO: BGG search: no result feedback
// TODO: prevent games with the same name in DB

// global variable of game shortlist that's adjusted based on user input

//var game_pick_list = [];

//var active_page_id = '';


//var bgg_details_game = {};


/**
 * Start up a new game roll 'session'
 */
function init_roll_for_game() {
    
    // check the form with search parameters (browser handles feedback)
    // TODO: test on multiple modern browsers
    var roll_form_element = $("#roll_form")[0];
    roll_form_element.reportValidity();

    // if valid values are entered, continue with processing
    if (roll_form_element.checkValidity()) {

        // find the value field in the forms
        var player_num = parseInt($('#roll_player_num').val());
        var player_age_min = parseInt($('#roll_player_age_min').val());
        var duration_max = parseInt($('#roll_duration_max').val());
        
        // look for the games in the local db, store then in the global list
        // and continue with rolling
        find_games(player_num, duration_max, player_age_min)
        .then(function(game_search_result) {

            // copy to local list of games
            var game_pick_list = game_search_result.slice();

            roll_for_game(game_pick_list);

        }).catch(function(error){
            console.log('DB lookup error', error);
        });
    }
}

/**
 * App interactions for selecting a game: will transition between 
 * screens and update the 'shortlist' of games based on user actions.
 */
function roll_for_game(game_pick_list) {

    // don't respond to shaking while rolling,
    // flag will be updated by roll result code
    will_respond_to_shaking = false;

    // first show the selection loading panel
    navigate_overlay('#roll_animation_panel');
    
    // show results with some delay
    setTimeout(function() {
        
        // if any results were found, continue to pick one
        if(game_pick_list.length > 0) {
            
            // respond to shaking (reroll) only if there are games left on the picklist
            if(game_pick_list.length > 1) {
                shake_from_main = false;
                will_respond_to_shaking = true;
            } else {
                shake_from_main = true;
                will_respond_to_shaking = false;
            }
            
            // take a random game from the list as the picked game
            var gamelist_length_initial = game_pick_list.length;
            var selected_index = randomIntFromInterval(0, gamelist_length_initial - 1);
            var selected_game = game_pick_list.splice(selected_index, 1)[0]
            
            // show the result on screen
            // TODO: move to some sort of 'fill' function?
            $('#roll_result_title').html(selected_game['title']);
            $('#roll_result_img').attr('src', get_image_url(selected_game,false));
            $('#roll_result_length').html(gamelist_length_initial);

            
            //$('#button_reroll').attr("disabled", gamelist_length_initial == 1);
            
            // disable the reroll button if there's only one game left
            // TODO: styling of button in this situation
            $('#button_reroll').off()
            if(game_pick_list.length > 0) {
                // rebind the reroll button to pass the shortened list of games on
                $('#button_reroll').off().on('click',function(){roll_for_game(game_pick_list)});
            }

            // show the page
            navigate_overlay('#roll_result_panel');

        } else {
            navigate_overlay('#roll_nogame_panel');
        }
    }, 2000);
}

/**
 * Close all result panels again, and give user access to the main selection form again
 */
function close_results() {

    //navigate_mainscreen('#game_selection');
    $('#app_menu_roll').trigger('click');
    
    // testing device motion things
    will_respond_to_shaking = true;
    shake_from_main = true;
}

/**
 * Navigate the app to the new main screen
 *
 * @param {*} new_screen_id html id (#) of the new page
 */
function navigate_mainscreen(event) {

    var newpage_id = event.data['page_id'];

    // always hide the overlay when navigating main screen
    $('#screen_overlay').hide();

    // set only the newly navigate pages to 'active'
    $('#app_menu a').attr('class','');
    $(event.target).attr('class','active_tab');

    // only respond to shaking when on the roll page
    will_respond_to_shaking = (newpage_id == '#game_selection');

    // TODO: some animation?

    // Show only the active page
    $('#screen_main').children('.mainscreen').hide();
    $('#screen_main').children('.mainscreen' + newpage_id).show();
}

/** Navigate main app to another screen */
//function navigate_overlay(event) {
function navigate_overlay(newpage_id) {
    
    //var newpage_id = event.data['page_id'];
    
    // always show the overlay when navigating main screen
    $('#screen_overlay').show();

    // Show only the active page
    $('#screen_overlay').find('.overlay_screen').hide();
    $('#screen_overlay').find('.overlay_screen' + newpage_id).show();
}

/**
 * Generate list of cards for all games in the local database
 */
function generate_all_cards() {

    // TODO: show loading screen
    
    get_all_games().then(function(game_list_full) {

        $('#games_list_empty').hide();
        $('#games_list_full').hide();
        $('#game_card_list').html('');

        if(game_list_full.length > 0) {

            game_list_full.forEach(game_doc => {
                var new_card = generate_game_card(game_doc);
                new_card.show();
                $('#game_card_list').append(new_card);
            });

            $('#games_list_full').show();
        } else {
            $('#games_list_empty').show();
        }

    }).catch(function(error){
        console.log('DB lookup error', error);
    });
}

// TODO: use generic function
function open_game_popup(event) {
    
    fill_game_edit_screen(null);
    
    $('#add_game_header').html('New game');
    $('#newgame_submit').html('Add game');
    $('#add_game_searchbgg').show();

    navigate_overlay('#add_game_screen');
}

function close_game_popup(event) {

    $('#app_menu_games').trigger('click');
}

// TODO: replace 'e' with localgame?
function add_game_to_lib(e) {

    // check the form with search parameters (browser handles feedback)
    // TODO: test on multiple modern browsers    
    var addgame_form_element = $("#add_game_form")[0];
    addgame_form_element.reportValidity();

    // if valid values are entered, continue with processing
    if (addgame_form_element.checkValidity()) {

        // any potential game that's passed when opening the form
        var local_game = e.data['game_doc'];
        
        var tmp_new_game = new GameDoc({
            bgg_id: !!local_game ? local_game.bgg_id : undefined,
            bgg_version: !!local_game ? local_game.bgg_version : undefined,
            bgg_altname: !!local_game ? local_game.bgg_altname : undefined,
            title: $('#newgame_title').val(),
            cover_image_url: !!local_game ? local_game.cover_image_url : undefined,
            cover_thumbnail_url: !!local_game ? local_game.cover_thumbnail_url : undefined,
            players_min: $('#newgame_players_min').val(),
            players_max: $('#newgame_players_max').val(),
            players_age: $('#newgame_players_age').val(),
            duration_min: $('#newgame_duration_min').val(),
            duration_max: $('#newgame_duration_max').val()
        });

        // if this is an edit, we'll have passed a local game with _id and _rev db info
        tmp_new_game._id = !!local_game ? local_game._id : undefined;
        tmp_new_game._rev = !!local_game ? local_game._rev : undefined;

        // if a game was provided, treat this as an edit, else as an add
        // TODO: maybe move this to db code section?
        if(!!tmp_new_game._id && !!tmp_new_game._id) {
            game_db_edit(tmp_new_game);
        } else {
            game_db_add(tmp_new_game);
        }

        $('#app_menu_games').trigger('click');
    }
}

function open_search_bgg() {

    // reset search form;
    $('#search_term').val('');
    $('#search_game_results').html('');

    navigate_overlay('#screen_search_bgg');
}

function close_search_bgg() {

    $('#add_game_screen').show()
    $('#screen_search_bgg').hide()
}

function close_details_bgg() {
    $('#screen_bgg_details').hide();
    $('#screen_search_bgg').show()
}

// TODO: docstring
// TODO: remove event from this?
function form_search_bgg(e) {

    // check the form with search parameters (browser handles feedback)
    // TODO: test on multiple modern browsers    
    var search_form_element = $("#search_game_form")[0];
    search_form_element.reportValidity();

    // if valid values are entered, continue with processing
    if (search_form_element.checkValidity()) {

        // TODO: show search spinner

        //var tmp_form_inputs = e.target.getElementsByTagName('input');
        var search_term = $('#search_term').val();
        
        search_bgg(search_term).then(function(search_result_list) {

            $('#search_game_results').html('');
            search_result_list.forEach(function(search_result) {
                
                // TODO: use template
                var tmp_html = $('<a class="search_result">[id]: [title] ([year])</a>'
                    .replace('[id]',search_result['bgg_id'])    
                    .replace('[title]',search_result['title'])
                    .replace('[year]',search_result['year'])
                );

                $('#search_game_results').append($('<div></div>').append(tmp_html));

                tmp_html.on('click',{bgg_id:search_result['bgg_id']},expand_search_result);

            });
            
        }).catch(function(error){
            console.log(error);
        });
    }
}

function expand_search_result(event) {
    
    var bgg_id_lookup = event.data['bgg_id'];

    // lookup the id on BoardGameGeeks, then update show the details screen
    get_bgg_data(bgg_id_lookup).then(function(result){
        
        //$('#screen_search_bgg').hide();

        var bgg_details_game = result;

        // generate a game card (but remove the delete/edit buttons
        var tmp_html = generate_game_card(bgg_details_game);
        tmp_html.find('.game_record_title_spacer').remove();
        $('#bgg_details_game').html('').append(tmp_html);

        // $('#bgg_details_title').html(bgg_details_game['title']);
        
        // $('#bgg_details_cover').attr('src',bgg_details_game['cover_thumbnail_url']);
        // $('#bgg_details_players_min').html(bgg_details_game['players_min']);
        // $('#bgg_details_players_max').html(bgg_details_game['players_max']);
        // $('#bgg_details_age_min').html(bgg_details_game['players_age']);
        // $('#bgg_details_time_min').html(bgg_details_game['duration_min']);
        // $('#bgg_details_time_max').html(bgg_details_game['duration_max']);
        
        // add main game as first alt name
        $('#bgg_details_altnames').html('');
        var tmp_html = gethtml_bgg_altname(bgg_details_game['title'],bgg_details_game);
        tmp_html.trigger('click');
        $('#bgg_details_altnames').append(tmp_html);

        // add any other alt names
        bgg_details_game['bgg_altnames'].forEach(function(title_alt) {
            $('#bgg_details_altnames').append(gethtml_bgg_altname(title_alt,bgg_details_game));
        });

        // add main version as first version
        $('#bgg_details_versions').html('');
        var tmp_html = gethtml_bgg_version(bgg_details_game,bgg_details_game);

        tmp_html.trigger('click');
        $('#bgg_details_versions').append(tmp_html);

        // add any other versions as well
        bgg_details_game['bgg_versions'].forEach(function(version) {
            $('#bgg_details_versions').append(gethtml_bgg_version(version,bgg_details_game));
        });

        // update the eventhandler so that the 'select' game 
        // fills out the 'addgame' form with selected bgg details
        $('#bgg_details_select').off();
        $('#bgg_details_select').on('click',function(event){

            // the selected altname and version are used to fill the game
            bgg_details_game.title = bgg_details_game.bgg_altname;
            bgg_details_game.cover_image_url = bgg_details_game.bgg_version.cover_image_url;
            bgg_details_game.cover_thumbnail_url = bgg_details_game.bgg_version.cover_thumbnail_url;
            
            // translate version to just store version name
            // TODO: use separate structure for this?
            bgg_details_game.bgg_version = bgg_details_game.bgg_version['title'];

            fill_game_edit_screen(bgg_details_game);

            // show the updated add game screen
            navigate_overlay('#add_game_screen');
        });

        navigate_overlay('#screen_bgg_details');

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
function  gethtml_bgg_altname(in_title_alt,in_game_doc) {

    var tmp_html = $('<a></a>');
    tmp_html.html(in_title_alt);
    tmp_html.attr('class','details_screen_notselected');
    tmp_html.on('click',{selected_alt: in_title_alt, base_gamedoc: in_game_doc},select_bgg_altname);

    return tmp_html;
}

/**
 * Handler for selecting an altname in the BGG details screen
 *
 * @param {*} event click event
 */
function select_bgg_altname(event) {
    
    // update reference to selected alt
    // update reference to selected version
    var selected_altname = event.data['selected_alt'];
    var base_gamedoc = event.data['base_gamedoc'];
    base_gamedoc.bgg_altname = selected_altname;

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
function gethtml_bgg_version(in_version, in_game_doc) {

    // check if URL is defined, use default if it isn't

    var tmp_anchor = $('<a></a>');
    //var tmp_html = $('<div></div>');

    tmp_anchor.append('<img style="display:inline;width:25%;" class="game_version_cover" src="' + get_image_url(in_version, true) + '">')
    tmp_anchor.append('<span>' + in_version['title'] + '</span>')
    //tmp_anchor.append(tmp_html);

    tmp_anchor.attr('class','details_screen_notselected');
    tmp_anchor.on('click',{selected_version: in_version, base_gamedoc: in_game_doc},select_bgg_version);

    return tmp_anchor;
}

function select_bgg_version(event) {
    
    // update reference to selected version
    var selected_version = event.data['selected_version'];
    var base_gamedoc = event.data['base_gamedoc'];
    base_gamedoc.bgg_version = selected_version;

    // unselect previous selection
    $('#bgg_details_versions .details_screen_selected').attr('class','details_screen_notselected');

    // only select target of event
    $(event.target).attr('class','details_screen_selected');
}

function open_game_edit(event) {
    // TODO: merge with add game UI path

    var local_game = event.data['game'];

    fill_game_edit_screen(local_game);

    
    // update the add game button to be for editing
    $('#add_game_header').html(local_game['title']);
    $('#newgame_submit').html('Save changes');
    // hide the search BGG button
    $('#add_game_searchbgg').hide();
    
    navigate_overlay('#add_game_screen');

}

/** 
 * Open delete confirmgame_db_deletetion screen 
 */
function open_game_delete(event) {

    var local_game = event.data['game'];

    // show the game that is to be deleted
    var tmp_card = generate_game_card(local_game);
    tmp_card.find('.game_record_title_spacer').remove();
    $('#delete_game_text').html('').append(tmp_card);


    // on confirming delete, send it to the database
    $('#delete_game_confirm').off().on('click',function() {
        
        game_db_delete(local_game);
        $('#app_menu_games').trigger('click');
    })

    // TODO: only needs to be bound once?
    $('#delete_game_cancel').off().on('click',function() {
        $('#app_menu_games').trigger('click');
    })

    navigate_overlay('#delete_game_screen');    
}

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

/** 
 * All things that happen after document loads go here.
 */
$(document).ready(function() {

    /** menu stuff */

    // menu navigation functions
    $('#app_menu_roll').on('click',{page_id: '#game_selection'},navigate_mainscreen);
    $('#app_menu_games').on('click',{page_id: '#game_management'},navigate_mainscreen);

    /** gameroll stuff  */

    // close all results and get access to the form again
    $('#button_updatefilters').on('click',close_results);
    $('#button_closenogame').on('click',close_results);

    // accept suggestion and play the game
    // TODO: track recently played games to exclude from reroll
    $('#button_play').on('click',close_results);

    /** game management stuff */
    $('#add_game').on('click',open_game_popup);
    $('#add_game_close').on('click',close_game_popup);

    $('#add_game_searchbgg').on('click',open_search_bgg);

    // $("#search_game_form").submit(form_search_bgg);
    $('#submit_search_bgg').on('click',form_search_bgg);
    $('#search_game_close').on('click',close_search_bgg);
    
    //$('#bgg_details_select').on('click',select_details_bgg);
    $('#bgg_details_close').on('click',close_details_bgg);

    $('#game_list_export').on('click',game_list_export);
    $('#game_list_import').on('click',game_list_import);

    // clicking the roll button
    $('#roll_submit').on('click',init_roll_for_game);

    //$('#newgame_submit').on('click',);
    

    // respond to device motion when rolling for games
    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', repond_to_shaking);
        will_respond_to_shaking = true;
    }

    // populate game list
    generate_all_cards();

    // start listening to db and refresh list on changes
    local_game_db.changes({ 
        live: true,
        since: 'now',
        include_docs: true
    }).on('change', function (change) {
        console.log('changes!',change);
        generate_all_cards();
    });

    // show the main screen after loading and
    // navigate to initial page of the app
    $('#screen_main').show();    
    $('#app_menu_roll').trigger('click');
});


/**
 * event handler for responding to device shaking events
 *
 * @param {DeviceMotionEvent} event motion event
 */
function repond_to_shaking(event) {

    // compute total acceleration vector size
    var tmp_x = event.acceleration.x;
    var tmp_y = event.acceleration.x;
    var tmp_z = event.acceleration.x;
    var tmp_total = Math.sqrt(tmp_x*tmp_x + tmp_y * tmp_y + tmp_z * tmp_z);
    
    // trigger response to shaking
    if(will_respond_to_shaking && tmp_total > 20) {
        
        if(shake_from_main) {
            $('#roll_submit').click();
        }
        else
        {
            $('#button_reroll').click();
        }
        
        // after responding, the rest of the app will determine when to respond again
        will_respond_to_shaking = false;
    }
}