const express = require('express');
const app = express();

// for parsing application/json formdata
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();


// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 

function rollGame(req, resp) {
   console.log(req.body)
}

app.post('/roll',rollGame)

// for parsing multipart/form-data
app.use(upload.array()); 
app.use(express.static('public'));

app.listen(3000);