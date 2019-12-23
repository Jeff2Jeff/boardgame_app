'use strict';

const local_game_db = new PouchDB('gamedb_local');


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
function add_game(
            in_bgg_id, in_title
            , in_players_min, in_players_max, in_players_age
            , in_time_min, in_time_max
            , in_imageblob = null
            )
{

    var newgame = {
        //_id: new Date().toISOString(),
        id_bgg: in_bgg_id
        , title: in_title
        , players_min: in_players_min
        , players_max: in_players_max
        , players_age: in_players_age
        , duration_min: in_time_min
        , duration_max: in_time_max
        , cover_image_blob: in_imageblob
    };

    
    // var catImage = document.getElementById('cat');
    // convertImgToBlob(catImage, function (blob) {
    //   db.putAttachment('meowth', 'meowth.png', blob, 'image/png').then(function () {
    //     return db.get('meowth', {attachments: true});
    //   }).then(function (doc) {
    //     console.log(doc);
    //   });
    // });

    // insert data into local game database
    // TODO: put vs post? should I generate _id myself?
    // TODO: use promises? Am I here?
    // local_game_db.post(newgame, function callback(err, result) {
    //     if (!err) {
    //         //console.log('Succesfully added game: ' + in_title);
    //     } else {
    //         console.log(err)
    //     }
    // });

    local_game_db.post(newgame).then(function(response) {
        
        console.log(response);

    }).catch(function(error){
        console.log(error);
    })    
}

/**
 * returns all games in the game_db (local) that meet the filter requirements
 * 
 * @param {*} in_numplayers Number of players to look for
 * @param {*} in_duration maximum duration that the game can take
 * @param {*} in_minage minimum age requirement for game
 * @return {Array} game_list 
 */
function find_games(in_numplayers, in_duration, in_minage) {
    
    // db columns
    //'players_min','players_max','players_age','duration_min','duration_max'


    // find games that match the limits set in parameters
    return new Promise( function(resolve,reject){
        local_game_db.find({
            selector: {
                players_min: {$lte: in_numplayers}
                ,players_max: {$gte: in_numplayers}
                ,players_age: {$lte: in_minage}
                ,duration_max: {$lte: in_duration}
            }
        }).then(function (result) {
            
            var tmp_results = [];

            Promise.all(result.docs.map(function(doc) {
                tmp_results.push(doc);
            })).then(function(eh){
                resolve(tmp_results);
            });
            
        }).catch(function(){
            //console.log.bind(console)
            console.log('db lookup error');
            reject("Gamedb lookup error?");
        });
    });
}


function get_all_games() {

    // find games that match the limits set in parameters
    return new Promise( function(resolve,reject){

        local_game_db.createIndex({
            index: {fields: ['title']}
        }).then(function(){

            return local_game_db.find({
                selector: {
                    title: {$exists: true}
                },
                sort: ['title']
            })
        }).then(function (result) {
            
            var tmp_results = []

            Promise.all(result.docs.map(function(doc) {
                tmp_results.push(doc);
            })).then(function(eh){
                resolve(tmp_results)
            });
            
        }).catch(function(error){
            //console.log.bind(console)
            console.log('db lookup error',error)
            reject("Gamedb lookup error?")
        });
    });
}


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
          return local_game_db.remove(row.id);
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
    
        local_game_db.createIndex({
            index: {fields: ['players_min','players_max','players_age'
            ,'duration_max','title']}
            //,'duration_min'
        });

    }).catch(function (err) {
    // error!
    });

    console.log("Done init db")
}

init_localdb_dev()
