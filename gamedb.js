const express = require('express');
const router = express.Router();

router.post('/rollgame', function(req, res){
    console.log(req.body)

    //res.end()
    //res.sendStatus(200)
});

//export this router to use in our server.js
module.exports = router;