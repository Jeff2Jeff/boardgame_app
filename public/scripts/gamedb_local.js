'use strict';

const local_game_db = new PouchDB('gamedb_local');

// TODO: thumbnail url and image url for different screens

// TODO: update doc
/**
 * Add a game to the local_game_db
 *
 * @param {*} in_bgg_id boardgamegeek id of the game
 * @param {*} in_title title of the game
 * @param {*} in_players_min minimum number of players (recommended)
 * @param {*} in_players_max maximum number of player (recommended)
 * @param {*} in_players_age minimum player age (recommended)
 * @param {*} in_time_min minimum playtime in minutes (recommended)
 * @param {*} in_time_max maximum playtime in minutes (recommended)
 */
function game_db_add (newgame) {

    local_game_db.post(newgame).then(function(response) {
        
        //resolve(response);
        // nothing?

    }).catch(function(error){
        console.log(error);
    })    
}

// TODO: docstring
function game_db_edit(updated_game) {

    local_game_db.put(updated_game).then(function(response) {
        //console.log(response);

    }).catch(function(error){
        console.log('de edit',error);
    })    
}

function game_db_delete(game) {
    local_game_db.remove(game)
    .then(function(resolve) {
        // TODO: anything?
    }).catch(function(error){
        console.log('db delete', error)
    })
}

/**
 * returns all games in the game_db (local) that meet the filter requirements
 * 
 * @param {*} in_numplayers Number of players to look for
 * @param {*} in_duration maximum duration that the game can take
 * @param {*} in_minage minimum age requirement for game
 * @return {Array} list of Game objects
 */
function find_games(in_numplayers, in_duration, in_minage) {

    return get_games_from_db({
        players_min: {$lte: in_numplayers}
        ,players_max: {$gte: in_numplayers}
        ,players_age: {$lte: in_minage}
        ,duration_max: {$lte: in_duration}
        ,title: {$exists: true}
    });
}

/** 
 * Return full list of games in local db
 */
function get_all_games() {
    
    return get_games_from_db({
        title: {$exists: true}
    });
}

/**
 * Return list of games from the databased, based on selector
 *
 * @param {*} selector_in any pouchdb selector
 * @returns list of documents from local pouchdb instance
 */
// TODO: sorting
function get_games_from_db(selector_in) {
    
    var tmp_keys = [];

    for (var key in selector_in) {
        tmp_keys.push(key);
     }
    
    return local_game_db.createIndex({
        index: {
            fields: tmp_keys
        }
    }).then(function(result) {
        
        return local_game_db.find({
            selector: selector_in,
            sort: tmp_keys
        }).then(function (result) {
        
            var tmp_results = [];

            // loop over all results and create Game objects for them
            // TODO: is push with separate array needed?
            result.docs.map(function(doc) {
                //return doc;
                var tmp_gamedoc = new GameDoc(doc);
                tmp_gamedoc['_id'] = doc['_id'];
                tmp_gamedoc['_rev'] = doc['_rev'];

                tmp_results.push(tmp_gamedoc);
            })

            return tmp_results;

        }).catch(function(error){
            // if something goes wrong, just print the error for now and return an empty list
            console.error("Something bad happened", error);
            return [];
        })
    });
}

/** 
 * Export local game database to json file
 */
function game_list_export() {

    var result_json = {
        name: 'boardgameapp_export'
        , version: '0.1'
        , time_stamp: new Date().toLocaleString()
        , game_list: []
    };

    get_all_games().then(function(result) {

        // add all games to the list
        result.forEach(function(game_doc) {
            
            // remove id and revision tags
            delete game_doc['_id'];
            delete game_doc['_rev'];

            result_json.game_list.push(game_doc);
        });

        // create link element and click it to offer download
        var tmp_anchor = $('<a></a>');
        tmp_anchor.attr('download', 'gameapp_export.json');
        tmp_anchor.attr('href', 'data:text/json,' +
            encodeURIComponent(JSON.stringify(result_json)));
        $('#add_game_overlay').append(tmp_anchor);
        tmp_anchor[0].click();
        tmp_anchor.remove();
        

    }).catch(function(error){
        console.log(error);
    });

}

function delete_all_games() {
    // TODO: confirmation

    // delete all games
    return get_all_games().then(function(result) {
        result.forEach(function(game_doc) {
            game_db_delete(game_doc);
        });
    }).catch(function(error) {
        console.log(error);
    });
}

function game_list_import() {

    // TODO: test contents of json

    // create link element and click it to offer download

    var tmp_input = $('<input></input>');
    tmp_input.attr('type','file');
    tmp_input.attr('accept','.json')
    tmp_input.hide();
    $('#add_game_overlay').append(tmp_input);
    tmp_input.on('change',function(event){
        var file = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (function(tmpFile){
            return function(e) {
                process_import_file(e.target.result);
            }
        })(file);
        reader.readAsText(file);
    })
    tmp_input[0].click();
   
}

// process json contents imported file
function process_import_file(filelist_json) {
    
    var list_json = JSON.parse(filelist_json);

    delete_all_games().then(function(result){
        
        list_json.game_list.forEach(function(newgame) {
            
            local_game_db.post(newgame).then(function(response) {
        
                //resolve(response);
        
            }).catch(function(error){
                console.log(error);
            })   

        });

    }).catch(function(error) {
        console.log(error);
    });
};


/**
 * Function to populate dev database locally
 *
 */
function init_localdb_dev() {
    console.log('Initializing debug database')

    // clear all local games from DB
    local_game_db.allDocs().then(function (result) {
        // Promise isn't supported by all browsers; you may want to use bluebird
        return Promise.all(result.rows.map(function (row) {
            
            console.log(row.id);
            local_game_db.remove(row.id);
            
        }));
        
    }).then(function () {
        // done!
        add_game(25213,"30 Seconds ",3,24,12,30,30)
        add_game(213304,"4Seasons",3,4,10,30,30)
        add_game(980,"Al Caboon",1,2,12,60,60)
        add_game(24224,"Anasazi",2,4,10,30,30)
        add_game(2322,"Barricade",2,6,8,60,60)
        add_game(24509,"Bedriegers bedrogen",2,6,8,30,30)
        add_game(30485,"Big Brain bordspel",2,6,8,30,45)
        add_game(9446,"Blue Moon",2,2,12,30,30)
        add_game(11,"Boonanza (hak ik heb je)",2,7,13,45,45)
        add_game(822,"Carcassonne",2,5,7,30,45)
        add_game(30662,"Carcassonne Reiseditie",2,5,8,30,45)
        add_game(2993,"Carcassonne uitbreiding 1 ",2,6,8,60,60)
        add_game(5405,"Carcassonne uitbreiding 2",2,6,13,60,60)
        add_game(58798,"Cardcassonne",2,5,8,30,45)
        add_game(13,"Catan bordspel",3,4,10,60,120)
        add_game(27710,"Catan het dobbelspel ",1,4,7,15,15)
        add_game(278,"Catan het snelle kaartspel",2,2,10,60,120)
        add_game(2915,"Catan kaartspel uitbereiding",2,2,10,90,90)
        add_game(2338,"Catan Ruimteschepen",2,2,12,60,60)
        add_game(198773,"Codenames Pictures",2,8,10,15,15)
        add_game(8946,"Da vinci code",2,4,8,15,15)
        add_game(41114,"De Mol",5,10,13,30,30)
        add_game(3321,"De Piramides van de Jaguar",2,2,10,45,45)
        add_game(1219,"Doolhof",2,4,8,20,20)
        add_game(10,"Elfenland",2,6,10,60,60)
        add_game(83197,"Fifty Fifty",3,5,8,30,30)
        add_game(340,"Frank's Zoo",3,7,10,60,60)
        add_game(15180,"Go West",2,4,12,45,45)
        add_game(2944,"Halli Galli",2,6,6,10,10)
        add_game(17520,"Het verboden spel",2,12,9,10,10)
        add_game(69205,"High Five",2,4,8,30,30)
        add_game(1502,"Hotel",2,4,8,60,60)
        add_game(1117,"Koehandel",3,5,10,45,45)
        add_game(56786,"Koehandel Master",2,6,10,60,60)
        add_game(533,"Labyrinthe het kaartspel",2,6,7,30,30)
        add_game(943,"Ligretto Rood en Blauw",2,4,8,10,10)
        add_game(478,"Machiavelli",2,8,10,20,60)
        add_game(13291,"Machiavelli De donkere landen",2,8,10,60,60)
        add_game(9214,"Manga Manga",2,6,8,30,30)
        add_game(32125,"Minoes de kat in de zak",3,5,8,20,20)
        add_game(1406,"Monopoly",2,8,8,60,180)
        add_game(145842,"Monopoly Empire",2,4,8,10,25)
        add_game(118953,"Olympicards",2,7,6,20,20)
        add_game(1258,"Phase 10",2,6,8,45,45)
        add_game(123885,"Pick-a-Pig",1,5,8,15,15)
        add_game(131260,"Qwixx dobbel",2,5,8,15,15)
        add_game(15818,"Regenwormen",2,7,8,20,20)
        add_game(8243,"Rolit",2,4,7,30,30)
        add_game(27789,"Rotterdam",2,4,8,60,60)
        add_game(9220,"Saboteur",3,10,8,30,30)
        add_game(-1,"Show the Money",2,6,6,25,25)
        add_game(9217,"Sint Petersburg",2,4,10,45,60)
        add_game(2407,"Sorry",2,4,6,30,30)
        add_game(148228,"Splendor",2,4,10,30,30)
        add_game(9201,"Spy",2,4,10,30,30)
        add_game(1917,"Stratego ",2,2,8,45,45)
        add_game(133473,"Sushi GO!",2,5,8,15,15)
        add_game(238883,"The Great Tour",3,6,8,30,30)
        add_game(14996,"Ticket to ride Europe",2,5,8,30,60)
        add_game(161181,"Totem",2,6,7,15,15)
        add_game(2223,"UNO",2,10,6,30,30)
        add_game(41002,"Vasco da Gama",2,4,12,60,120)
        add_game(2596,"Villa Paletti",2,4,8,30,30)
        add_game(25821,"Weerwolven",8,18,10,30,30)
        add_game(28037,"Wollie Bollie",2,6,10,30,30)
        add_game(39192,"Zwart kater",2,9,4,10,10)
        add_game(-1,"XCOM",1,4,16,240,360)
    
        // local_game_db.createIndex({
        //     index: {fields: ['players_min','players_max','players_age'
        //     ,'duration_max','title']}
        //     //,'duration_min'
        // });

    }).catch(function (err) {
    // error!
        console.log(err);
    });

    console.log("Done init db")
}

//init_localdb_dev()
