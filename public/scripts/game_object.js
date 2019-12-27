const MISSING_COVER_IMAGE = '/images/game_box_missing.jpg';


/**
 * Return image url of a game
 *
 * @param {*} game_doc start url
 * @returns either the start url, or the default url
 */
function get_image_url(game_doc) {
    var image_url = game_doc['remote_image_url'];
    return (image_url !== undefined & image_url.length > 0) ?
                        image_url : MISSING_COVER_IMAGE;
}

/**
 * Generate card for use in game management screen
 *
 * @param {*} game_doc PouchDB document representing a game
 * @returns HTML element based on '#game_record_template'
 */
function generate_game_card(game_doc) {
    
    template_element = $('#game_record_template');
    var result_element = $('<div>Missing template</div>');

    if (template_element.length) {

        // copy template html into new element
        result_element = $(template_element.html());

        // set contents of the card
        result_element.find('.game_cover').attr('src',get_image_url(game_doc));
        result_element.find('.game_record_title').html(game_doc.title)
        result_element.find('.game_record_duration_min').html(game_doc.duration_min)
        result_element.find('.game_record_duration_max').html(game_doc.duration_max)
        result_element.find('.game_record_players_min').html(game_doc.players_min)
        result_element.find('.game_record_players_max').html(game_doc.players_max)
        result_element.find('.game_record_players_age').html(game_doc.players_age)

        // set up delete and edit links
        result_element.find('a.game_edit').on('click',data={'game':game_doc},open_game_edit);
        result_element.find('a.game_delete').on('click',data={'game':game_doc},open_game_delete);
    }
    else {
        console.log('HTML element not found: ' + html_template_id)
    }

    return result_element;
}

function fill_game_edit_screen(game_doc) {

    result_element = $('#add_game_form');

    result_element.find('#newgame_image').attr('src',get_image_url(game_doc));
    result_element.find('#newgame_title').val(game_doc['title'])
    result_element.find('#newgame_duration_min').val(game_doc['duration_min'])
    result_element.find('#newgame_duration_max').val(game_doc['duration_max'])
    result_element.find('#newgame_players_min').val(game_doc['players_min'])
    result_element.find('#newgame_players_max').val(game_doc['players_max'])
    result_element.find('#newgame_players_age').val(game_doc['players_age'])

}