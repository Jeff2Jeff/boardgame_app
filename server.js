const express = require('express');
// for parsing application/json formdata
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
// redirection to https
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;

// links to files
const gamedb = require('./gamedb.js')

function startServer() {
   const app = express();
 
   // Redirect HTTP to HTTPS,
   app.use(redirectToHTTPS([/localhost:(\d{4})/], [], 301));
   // for parsing application/json
   app.use(bodyParser.json()); 
   // for parsing application/xwww-
   app.use(bodyParser.urlencoded({ extended: true })); 

   // Logging for each request
   app.use((req, resp, next) => {
     const now = new Date();
     const time = `${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`;
     const path = `"${req.method} ${req.path}"`;
     const m = `${req.ip} - ${time} - ${path}`;
     // eslint-disable-next-line no-console
     console.log(m);
     next();
   });
   
   // router for gamedb interactions
   app.use('/gamedb',gamedb)
 
   // for parsing multipart/form-data
   app.use(upload.array()); 
   app.use(express.static('public'));
 
   // Start the server
   return app.listen('8000', () => {
     // eslint-disable-next-line no-console
     console.log('Local DevServer Started on port 8000...');
   });
 }
 
 startServer();

//  app.get('/',function(req,res){
//    res.sendfile("index.html");
//  });
 