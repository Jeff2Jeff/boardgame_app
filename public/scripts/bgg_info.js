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
            
            // TODO: move 'item' parsing stuff info separate function and make recursive?
            
            // parse response xml
            var response_xml = $($.parseXML(response_text));
            
            // info the from the main game
            var main_game_xml = response_xml.find('items>item')

            // general game info in a gamedoc struct
            var response_game = new GameDoc({
                bgg_id: parseInt(main_game_xml.attr('id')),
                players_min: parseInt(main_game_xml.find('minplayers').first().attr('value')),
                players_max: parseInt(main_game_xml.find('maxplayers').first().attr('value')),
                players_age: parseInt(main_game_xml.find('minage').first().attr('value')),
                duration_min: parseInt(main_game_xml.find('minplaytime').first().attr('value')),
                duration_max: parseInt(main_game_xml.find('maxplaytime').first().attr('value')),

                title: main_game_xml.find('name[type=primary]').first().attr('value'),
                cover_image_url: main_game_xml.find('image').first().text(),
                cover_thumbnail_url: main_game_xml.find('thumbnail').first().text(),
            });

            // title data
            response_game['bgg_altnames'] = [];
            main_game_xml.find('name[type|=alternate]')
                .each(function(index) {
                    response_game['bgg_altnames'].push($(this).attr('value'))
            });

            // version data
            response_game['bgg_versions'] = [];
            main_game_xml.find('versions>item')
                .each(function(index) {

                    // treat each version as a game
                    var version_game = new GameDoc(
                        {
                            title: $(this).find('name[type=primary]').first().attr('value'),
                            cover_image_url: $(this).find('image').first().text(),
                            cover_thumbnail_url: $(this).find('thumbnail').first().text()
                        }
                    );

                    // some additional info (not really used yet?)
                    version_game['year'] = $(this).find('yearpublished').first().attr('value');
                    version_game['language'] = $(this).find('link[type=language]').first().attr('value');

                    response_game['bgg_versions'].push(version_game);
            });
            
            // return the game_object with all info that could be found
            resolve(response_game);
            
        }).catch(function(error) {
            console.log("got error");
            console.log(error);
        });
    });
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



