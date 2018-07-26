/*
----------------------------------------------------------------------------------------------------------- 
-- App to simulate the request and response related to Login Endpoint
-----------------------------------------------------------------------------------------------------------
*/
require("dotenv").config();
const request = require("request");
const http = require("http");
const https = require("https");
const querystring = require("querystring");
const express = require("express");
const path = require("path");
const config = require("config");
const loki = require("lokijs");
const moment = require("moment");
const fs = require("fs");
const logger = require('morgan');
const bodyParser = require('body-parser');
moment.locale("pt-br");

const service = require('./service/roboService');
const roboController = require('./controller/roboController');

// Define app
const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use('/scripts', express.static(__dirname + "/node_modules/"));
app.use('/images', express.static(__dirname + "/images/"));

//-----------------------------------------------------------------------------------------------------------
// set the view engine to ejs - https://scotch.io/tutorials/use-ejs-to-template-your-node-application
//-----------------------------------------------------------------------------------------------------------
app.set("view engine", "ejs");

// // Enable Cross Origin resource sharing.
// app.all('/*', (req, res, next) => {
//     // Set custom headers for CORS
//     res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-type,Accept,Authorization');

//     if (req.method == 'OPTIONS') {
//         res.status(200).end();
//     } else {
//         next();
//     }
// });

//-----------------------------------------------------------------------------------------------------------
// index page 
//-----------------------------------------------------------------------------------------------------------
app.get('/', (req, res) => {
    var currentDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    res.render('pages/index', {
        currentDate: currentDate
    });
});

// Only the requests that start with /api/v1/* will be checked for the token.
// Any URL's that do not follow the below pattern should be avoided unless you 
// are sure that authentication is not needed
//app.all('/api/v1/*', [require('./controller')]);

// The list of routes for the application. 
app.use('/api/robo/', require('./controller'));

// // If no route is matched by now, it must be a 404
// app.use((req, res, next) => {
//     let err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

var intervalToAuthenticate = parseInt(config.get("intervalToAuthenticate"));
service.fakeRequestLoop(intervalToAuthenticate);

//-----------------------------------------------------------------------------------------------------------
// about page 
//-----------------------------------------------------------------------------------------------------------
// app.get('/about', (req, res) => {
//     res.render('pages/about');
// });

//-----------------------------------------------------------------------------------------------------------
// Find by startDate and endDate and status
//-----------------------------------------------------------------------------------------------------------
// app.get('/find/:startDate/:endDate/:status', (req, res) => {
//     roboController.getRecords(req, res);
// });

//-----------------------------------------------------------------------------------------------------------
// endpoint
//-----------------------------------------------------------------------------------------------------------
// app.get("/api/test", (req, res) => {

//     console.error("URL: %s", wtrConfig.url);

//     // form data
//     var postData = querystring.stringify({
//         userId: wtrConfig.body.userId,
//         companyId: wtrConfig.body.companyId,
//         password: wtrConfig.body.password
//     });

//     var optionsHttps = {
//         hostname: "tablet-qa.worldtracer.aero",
//         port: 443,
//         path: "/",
//         method: "POST",
//         rejectUnauthorized: false,
//         headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//             "Content-Length": postData.length
//         } //,
//         //cert: fs.readFileSync(__dirname + "/worldtracer-qa.dlh.de.pem")
//     };
//     // request object
//     var req = https.request(optionsHttps, function(res) {
//         var result = '';

//         res.on('data', function(chunk) {
//             result += chunk;
//         });
//         res.on('end', function() {
//             console.log(result);
//         });
//         res.on('error', function(err) {
//             console.log(err);
//         });
//     });

//     // req error
//     req.on('error', function(err) {
//         console.log(err);
//     });

//     //send request witht the postData form
//     req.write(postData);
//     req.end();
//     //worldtracer-qa.dlh.de
// });


//-----------------------------------------------------------------------------------------------------------
// Mount the self-host to listen port :7000
//-----------------------------------------------------------------------------------------------------------
// Start the server
app.set('port', process.env.PORT || 7000);
let server = app.listen(app.get('port'), () => {
    let host = server.address().address;
    host = (host === '::' ? 'localhost' : host);
    let port = server.address().port;

    console.log("listening at http://%s:%s", host, port);
    console.log("Date: %s", new Date());
    console.log("The magic it\'s happening");
});