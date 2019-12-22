'use strict';

const BGGAPI_BASEURL_THING = 
'https://api.geekdo.com/xmlapi2/thing/?id=[bgg_id]&versions=1';
const BGGAPI_ENDPOINT_SEARCH = 'https://api.geekdo.com/xmlapi2/search';

// api_params = {'id':13}
// def search_api(search_term, exact=1):
//     api_params = {'query':search_term,'type':'boardgame','exact':exact}


function get_bgg_data(bgg_id) {
    
    // parse XML into custom struct
    var response_struct = {};

    // call boardgamegeek API with id's
    fetch(BGGAPI_BASEURL_THING.replace('[bgg_id]',bgg_id))
    .then(function(response) {
        
        // if a reponse was received, pass the text on
        return response.text();
        
    }).then(function(respone_text) {
        
        // parse response xml
        var response_xml = $($.parseXML(respone_text));
        
        
        // info the from the main game
        var main_game_xml = response_xml.find('items>item')


        response_struct['id_bgg'] = parseInt(main_game_xml.attr('id'));
        response_struct['title'] = ''//parseInt(main_game_xml.attr('id'));
        response_struct['image_url'] = main_game_xml.find('image').first().text();
        response_struct['image_blob'] = convertImgToBlob(response_struct['image_url']);
        
        convertImgToBlob(response_struct['image_url']).then(function(blob) {
            
            // store blob in struct
            response_struct['image_blob'] = blob;

        }, function(err) {
            console.log(err)
        });
        
        response_struct['players_min'] = parseInt(main_game_xml.find('minplayers').first().attr('value'));
        response_struct['players_max'] = parseInt(main_game_xml.find('maxplayers').first().attr('value'));
        response_struct['players_age'] = parseInt(main_game_xml.find('minage').first().attr('value'));
        response_struct['duration_min'] = parseInt(main_game_xml.find('minplaytime').first().attr('value'));
        response_struct['duration_max'] = parseInt(main_game_xml.find('maxplaytime').first().attr('value'));
        
        console.log(response_struct);

    }).catch(function(error) {
        console.log("got error");
        console.log(error);
    });

    return response_struct;
}


function convertImgToBlob(img_url, callback) {

    var img = document.createElement('img');
    img.src = img_url;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);

    // Warning: toBlob() isn't supported by every browser.
    // You may want to use blob-util.
    canvas.toBlob(function(blob){return blob;}, 'image/png');

    return new Promise(function(resolve, reject) {
        canvas.toBlob(function(blob) {
            resolve(blob)
        })
    })
}

get_bgg_data(13);