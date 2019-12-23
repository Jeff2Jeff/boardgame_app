'use strict';

const BGGAPI_BASEURL_THING = 
'https://api.geekdo.com/xmlapi2/thing/?id=[bgg_id]&versions=1';
const BGGAPI_BASEURL_SEARCH = 
'https://api.geekdo.com/xmlapi2/search/?query=[search_term]&type=boardgame,boardgameexpansion';


// api_params = {'id':13}
// def search_api(search_term, exact=1):
//     api_params = {'query':search_term,'type':'boardgame','exact':exact}


function get_bgg_data(bgg_id) {
    
    // find games that match the limits set in parameters
    return new Promise( function(resolve,reject){

        // call boardgamegeek API with id's
        fetch(BGGAPI_BASEURL_THING.replace('[bgg_id]',bgg_id))
        .then(function(response) {
            
            // if a reponse was received, pass the text on
            return response.text();
            
        }).then(function(response_text) {
            
            // TODO: move 'item' parsing stuff info separate function and make recursive
            
            // parse XML into custom struct
            var response_struct = {};

            // parse response xml
            var response_xml = $($.parseXML(response_text));
            
            // info the from the main game
            var main_game_xml = response_xml.find('items>item')

            // general game info
            response_struct['id_bgg'] = parseInt(main_game_xml.attr('id'));
            response_struct['players_min'] = parseInt(main_game_xml.find('minplayers').first().attr('value'));
            response_struct['players_max'] = parseInt(main_game_xml.find('maxplayers').first().attr('value'));
            response_struct['players_age'] = parseInt(main_game_xml.find('minage').first().attr('value'));
            response_struct['duration_min'] = parseInt(main_game_xml.find('minplaytime').first().attr('value'));
            response_struct['duration_max'] = parseInt(main_game_xml.find('maxplaytime').first().attr('value'));

            // title data
            response_struct['title'] = main_game_xml.find('name[type=primary]').first().attr('value');
            response_struct['title_alts'] = [];
            
            main_game_xml.find('name[type|=alternate]')
                .each(function(index) {
                    response_struct['title_alts'].push($(this).attr('value'))
            });

            // version data
            response_struct['versions'] = [];
            main_game_xml.find('versions>item')
                .each(function(index) {

                    var version_struct = {};

                    version_struct['image_url'] = $(this).find('thumbnail').first().text();
                    version_struct['title'] = $(this).find('name[type=primary]').first().attr('value');
                    version_struct['year'] = $(this).find('yearpublished').first().attr('value');
                    version_struct['language'] = $(this).find('link[type=language]').first().attr('value');

                    response_struct['versions'].push(version_struct);
            });
            
            // image stuff
            response_struct['image_url'] = main_game_xml.find('thumbnail').first().text();
            response_struct['image_blob'] = convertImgToBlob(response_struct['image_url']);
            
            convertImgToBlob(response_struct['image_url']).then(function(blob) {
                
                // store blob in struct
                response_struct['image_blob'] = blob;

            }, function(err) {
                console.log(err)
            });
            
            resolve(response_struct);
            
            //console.log(response_struct);

        }).catch(function(error) {
            console.log("got error");
            console.log(error);
        });
    });
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

function search_bgg(search_term) {

    return new Promise( function(resolve,reject){
        fetch(BGGAPI_BASEURL_SEARCH.replace('[search_term]',search_term))
        .then(function(response) {

            // if a reponse was received, pass the text on
            return response.text();

        }).then(function(response_text){

            var search_results = [];

            // parse response xml
            var response_xml = $($.parseXML(response_text));

            // all results are contained in an 'item' xml tag
            response_xml.find('items>item').each(function(index) {
                
                // parse xml into search result structure
                search_results.push(
                    {
                        bgg_id: parseInt($(this).attr('id')),
                        type: $(this).attr('type'),
                        title: $(this).find('name').attr('value'),
                        year: $(this).find('yearpublished').attr('value')
                    }
                )
            });

            resolve(search_results);

        }).catch(function(error) {
            console.log("search error");
            console.log(error);
            reject("search error");
        });
    });

}



