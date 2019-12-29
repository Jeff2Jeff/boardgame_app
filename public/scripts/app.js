'use strict';

var will_respond_to_shaking = false;
var shake_from_main = true;
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

    will_respond_to_shaking = false;

    // prevent default form (redirectish) behavior
    if (e.preventDefault) e.preventDefault();

    // find the value field in the forms
    var player_num = parseInt($('#roll_player_num').val());
    var player_age_min = parseInt($('#roll_player_age_min').val());
    var duration_max = parseInt($('#roll_duration_max').val());
    
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

    will_respond_to_shaking = false;

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
            
            if(game_pick_list.length > 1) {
                shake_from_main = false;
                will_respond_to_shaking = true;
            } else {
                shake_from_main = true;
                will_respond_to_shaking = false;
            }
            
            //$('#roll_overlay').prepend($('<div>' + shake_from_main + '</div>'))

            var gamelist_length_initial = game_pick_list.length;
            var selected_index = randomIntFromInterval(0, gamelist_length_initial - 1);
            //selected_game = game_pick_list[selected_index];
            
            // update list of selected games so that the currently roled on isn't in it anymore
            var selected_game = game_pick_list.splice(selected_index, 1)[0]
            
            // some logging
            //console.log(game_pick_list)
            //console.log(selected_game)
            //console.log(gamelist_length_initial, selected_index, selected_game['title'])

            var image_url = get_image_url(selected_game);

            // show the result on screen
            $('#roll_result_title').html('"' + selected_game['title'] + '"');
            $('#roll_result_img').attr('src',image_url);
            $('#roll_result_length').html(gamelist_length_initial);
            $('#roll_result_panel').show();

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

    // testing device motion things
    will_respond_to_shaking = true;
    shake_from_main = true;
}

/**
 * Navigate to different page in the app
 */
function navigate_to(event) {

    
    var newpage_id = event.data['page_id'];

    // set only the newly navigate pages to 'active'
    $('#app_menu a').attr('class','');
    $(event.target).attr('class','active_tab');

    // only respond to shaking when on the roll page
    will_respond_to_shaking = (newpage_id == '#game_selection');
    

    // TODO: some animation?

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


function open_game_popup(event) {

    // fill fields for adding
    $('#newgame_submit').html('Add game');
    $('#add_game_form').off();
    $('#add_game_form').on('submit',{'game_doc':null},add_game_to_lib);


    $('#add_game_searchbgg').show();
    

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

    $('#add_game_overlay').hide();
    $('#add_game_screen').hide();
    $('#screen_search_bgg').hide();
    $('#screen_bgg_details').hide();
    $('#delete_game_screen').hide();
}

function add_game_to_lib(e) {

    // prevent default form (redirectish) behavior
    if (e.preventDefault) e.preventDefault();
    
    // any potential game that's passed when opening the form
    var local_game = e.data['game_doc'];
    
    var tmp_new_game = new GameDoc({
        bgg_id: local_game ? local_game.bgg_id : undefined,
        bgg_version: local_game ? local_game.bgg_version : undefined,
        bgg_altname: local_game ? local_game.bgg_altname : undefined,
        title: $('#newgame_title').val(),
        cover_image_url: local_game ? local_game.cover_image_url : undefined,
        cover_thumbnail_url: local_game ? local_game.cover_thumbnail_url : undefined,
        players_min: $('#newgame_players_min').val(),
        players_max: $('#newgame_players_max').val(),
        players_age: $('#newgame_players_age').val(),
        duration_min: $('#newgame_duration_min').val(),
        duration_max: $('#newgame_duration_max').val()
    });

    // id this is an edit, we'll have passed a local game with _id and _rev db info
    tmp_new_game._id = local_game ? local_game._id : undefined;
    tmp_new_game._rev = local_game ? local_game._rev : undefined;
    
    // if a game was provided, treat this as an edit, else as an add
    // TODO: maybe move this to db code section?
    if(!!tmp_new_game._id && !!tmp_new_game._id) {
        game_db_edit(tmp_new_game);
    } else {
        game_db_add(tmp_new_game);
    }
    
    close_game_popup();

    return false;
}

function open_search_bgg() {

    $('#add_game_screen').hide()

    // reset search form;
    $('#search_term').val('');
    $('#search_game_results').html('');

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
            
            // TODO: use template
            var tmp_html = $('<a class="search_result">[title] ([year])</a>'
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
    get_bgg_data(bgg_id_lookup).then(function(result){
        
        $('#screen_search_bgg').hide();

        bgg_details_game = result;

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
        bgg_details_game['bgg_altnames'].forEach(function(title_alt) {
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
        bgg_details_game['bgg_versions'].forEach(function(version) {
            $('#bgg_details_versions').append(gethtml_bgg_version(version));
        });

        // update the eventhandler so that the 'select' game 
        // reads out the form with selected bgg details
        $('#bgg_details_select').off();
        $('#bgg_details_select').on('click',function(event){

            $('#screen_bgg_details').hide();
            
            // TODO :read version etc.
            // TODO: version image and thumbnail tracking...

            fill_game_edit_screen(bgg_details_game);

            // show the updated add game screen
            $('#add_game_screen').show()

            
                // // check if URL is defined, use default if it isn't
                // var image_url = bgg_details_game['selected_version']['image_url'];
                // image_url = (image_url !== undefined & image_url.length > 0) ?
                //                     image_url : '/images/game_box_missing.jpg'
            
                // // fill the details into the 'add game' screen
                // $('#newgame_title').val(bgg_details_game['selected_altname']);
                // $('#newgame_image').attr('src',image_url);
                // $('#newgame_players_min').val(bgg_details_game['players_min']);
                // $('#newgame_players_max').val(bgg_details_game['players_max']);
                // $('#newgame_players_age').val(bgg_details_game['players_age']);
                // $('#newgame_duration_min').val(bgg_details_game['duration_min']);
                // $('#newgame_duration_max').val(bgg_details_game['duration_max']);
                
                // TODO: track bgg_id
            
                // show the updated add game screen
                $('#add_game_screen').show()
            }
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
    
    var image_url = !!in_version['image_url'] ? in_version['image_url']:"";
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
// function select_details_bgg(event) {

//     console.log(bgg_details_game);

 
//     var local_game = event.data.game_doc;

//     $('#screen_bgg_details').hide();
    
//     fill_game_edit_screen(local_game);

//     // // check if URL is defined, use default if it isn't
//     // var image_url = bgg_details_game['selected_version']['image_url'];
//     // image_url = (image_url !== undefined & image_url.length > 0) ?
//     //                     image_url : '/images/game_box_missing.jpg'

//     // // fill the details into the 'add game' screen
//     // $('#newgame_title').val(bgg_details_game['selected_altname']);
//     // $('#newgame_image').attr('src',image_url);
//     // $('#newgame_players_min').val(bgg_details_game['players_min']);
//     // $('#newgame_players_max').val(bgg_details_game['players_max']);
//     // $('#newgame_players_age').val(bgg_details_game['players_age']);
//     // $('#newgame_duration_min').val(bgg_details_game['duration_min']);
//     // $('#newgame_duration_max').val(bgg_details_game['duration_max']);
    
//     // TODO: track bgg_id

//     // show the updated add game screen
//     $('#add_game_screen').show()
// }


function open_game_edit(event) {
    // TODO: merge with add game UI path

    var local_game = event.data['game'];

    fill_game_edit_screen(local_game);

    // update the add game button to be for editing
    $('#newgame_submit').html('Save changes');
    
    // hide the search BGG button
    // TODO: maybe the search bgg is still fine for editing...
    $('#add_game_searchbgg').hide();
    
    // show the overlay and screen
    $('#add_game_overlay').show();
    $('#add_game_screen').show();
}

/** 
 * Open delete confirmgame_db_deletetion screen 
 */
function open_game_delete(event) {


    var local_game = event.data['game'];

    $('#add_game_overlay').show();
    $('#delete_game_screen .delete_game_text').html(local_game['title'])
    

    // on confirming delete, send it to the database
    $('#delete_game_screen .delete_game_confirm').on('click',function() {
        
        game_db_delete(local_game);
        close_game_delete();
    })

    // TODO: only needs to be bound once?
    $('#delete_game_screen .delete_game_cancel').on('click',function() {
        close_game_delete();
    })

    $('#delete_game_screen').show();

    
}

function close_game_delete() {

    // clear the binds on the links
    $('#delete_game_screen .delete_game_confirm').off();
    $('#delete_game_screen .delete_game_cancel').off();

    $('#add_game_overlay').hide();
    $('#delete_game_screen').hide();
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
    $('#app_menu_roll').on('click',{page_id: '#game_selection'},navigate_to);
    $('#app_menu_games').on('click',{page_id: '#game_management'},navigate_to);

    /** gameroll stuff  */

    // form submitted to roll for a game
    //$("#roll_form").submit(get_game_list);

    // reroll without updating filters
    $('#button_reroll').on('click',roll_for_game);
    // close all results and get access to the form again
    $('#button_updatefilters').on('click',close_results);
    $('#button_closenogame').on('click',close_results);

    // accept suggestion and play the game
    // TODO: track recently played games to exclude from reroll
    $('#button_play').on('click',close_results);

    /** game management stuff */
    //$('#game_record_template').hide();
    $('#add_game').on('click',open_game_popup);
    $('#add_game_close').on('click',close_game_popup);

    $('#add_game_searchbgg').on('click',open_search_bgg);

    $("#search_game_form").submit(form_search_bgg);
    $('#search_game_close').on('click',close_search_bgg);
    
    //$('#bgg_details_select').on('click',select_details_bgg);
    $('#bgg_details_close').on('click',close_details_bgg);

    $('#game_list_export').on('click',game_list_export);
    $('#game_list_import').on('click',game_list_import);

    $('#roll_submit').on('click',function(event){
        
        var roll_form_element = $("#roll_form")[0];
        roll_form_element.reportValidity();

        if (roll_form_element.checkValidity()) {
            //roll_form_element.submit();
            get_game_list(event);
        }
    });

    // test rolling stuff
    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', repond_to_shaking);
        will_respond_to_shaking = true;
    }
      

    // initial page of the app
    $('#app_menu_games').trigger('click');
    //$('#app_menu_roll').trigger('click');

    generate_all_cards();
});



function repond_to_shaking(evt) {

    var tmp_x = evt.acceleration.x;
    var tmp_y = evt.acceleration.x;
    var tmp_z = evt.acceleration.x;
    var tmp_total = Math.sqrt(tmp_x*tmp_x + tmp_y * tmp_y + tmp_z * tmp_z);
    
    //TODO: tweak shaking repsoniveness
    if(will_respond_to_shaking && tmp_total > 20) {
        // do the shaking things
        //alert('shake!');

        if(shake_from_main) {
            $('#roll_submit').click();
        }
        else
        {
            $('#button_reroll').click();
        }
        
        //$('#roll_submit').click();

        will_respond_to_shaking = false;
        //e.target.removeEventListener('devicemotion');
        //setTimeout(function(){will_respond_to_shaking = true},2000);
    }
}