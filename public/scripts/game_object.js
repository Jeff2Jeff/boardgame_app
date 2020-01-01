const MISSING_COVER_IMAGE = './images/game_box_missing.jpg';
const MISSING_COVER_THUMBNAIL = './images/game_box_missing.jpg';

// Structure of a game, to make sure that all documents in 
// and out of the database have a similar structure
// TODO: use function
function GameDoc(struct_in) {

    this.bgg_id = !!struct_in.bgg_id ? struct_in.bgg_id : -1;
    this.bgg_version = !!struct_in.bgg_version ? struct_in.bgg_version : "";
    this.bgg_altname = !!struct_in.bgg_altname ? struct_in.bgg_altname : "";

    this.title = !!struct_in.title ? struct_in.title : "Not specified";
    this.cover_image_url = !!struct_in.cover_image_url && struct_in.cover_image_url != MISSING_COVER_IMAGE 
                                ? struct_in.cover_image_url : "";
    this.cover_thumbnail_url = !!struct_in.cover_thumbnail_url && struct_in.cover_thumbnail_url != MISSING_COVER_THUMBNAIL 
                                ? struct_in.cover_thumbnail_url : "";

    this.players_min = !!struct_in.players_min ? parseInt(struct_in.players_min) : 0;
    this.players_max = !!struct_in.players_max ? Math.max(parseInt(struct_in.players_max),this.players_min) : this.players_min;
    this.players_age = !!struct_in.players_age ? parseInt(struct_in.players_age) : 0;

    this.duration_min = !!struct_in.duration_min ? parseInt(struct_in.duration_min) : 0;
    this.duration_max = !!struct_in.duration_max ? Math.max(parseInt(struct_in.duration_max),this.duration_min) : this.duration_min;
}

/**
 * Return image url of a game
 *
 * @param {*} game_doc start url
 * @returns either the start url, or the default url
 */
function get_image_url(game_doc, use_thumbnail) {

    var local_img_default = use_thumbnail ? MISSING_COVER_THUMBNAIL : MISSING_COVER_IMAGE;

    if (!!game_doc) {
        var local_img_url = use_thumbnail ? game_doc.cover_thumbnail_url : game_doc.cover_image_url;
    
        return (local_img_url != null && local_img_url !== undefined && local_img_url.length > 0) ?
            local_img_url : local_img_default;
    } else {
        return local_img_default
    }
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
        result_element.find('.game_cover').attr('src',get_image_url(game_doc,true));
        result_element.find('.game_record_title').html(game_doc.title);
        result_element.find('.game_record_duration_min').html(game_doc.duration_min);
        result_element.find('.game_record_duration_max').html(game_doc.duration_max);
        result_element.find('.game_record_players_min').html(game_doc.players_min);
        result_element.find('.game_record_players_max').html(game_doc.players_max);
        result_element.find('.game_record_players_age').html(game_doc.players_age);

        // set up delete and edit links
        result_element.find('a.game_edit').on('click',data={'game':game_doc},open_game_edit);
        result_element.find('a.game_delete').on('click',data={'game':game_doc},open_game_delete);
    }
    else {
        console.log('HTML element not found: ' + html_template_id)
    }

    return result_element;
}

// TODO: docstring
// fill in fields of the add/edit game screen, based on provided document
function fill_game_edit_screen(game_doc) {

    result_element = $('#add_game_form');

    result_element.find('#newgame_image').attr('src',get_image_url(game_doc,false));
    result_element.find('#newgame_title').val(!!game_doc ? game_doc['title'] : '');
    result_element.find('#newgame_duration_min').val(!!game_doc ? game_doc['duration_min'] : '');
    result_element.find('#newgame_duration_max').val(!!game_doc ? game_doc['duration_max'] : '');
    result_element.find('#newgame_players_min').val(!!game_doc ? game_doc['players_min'] : '');
    result_element.find('#newgame_players_max').val(!!game_doc ? game_doc['players_max'] : '');
    result_element.find('#newgame_players_age').val(!!game_doc ? game_doc['players_age'] : '');

    $('#newgame_submit').off();
    $('#newgame_submit').on('click',data={'game_doc':game_doc},add_game_to_lib);

}

