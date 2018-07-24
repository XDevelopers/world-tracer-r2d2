/*
----------------------------------------------------------------------------------------------------------- 
-- App to simulate the request and response related to Login Endpoint
-----------------------------------------------------------------------------------------------------------
*/
require("dotenv").config();
var request = require("request");
var http = require("http");
var https = require("https");
var querystring = require("querystring");
var express = require("express");
var path = require("path");
var config = require("config");
var loki = require("lokijs");
var moment = require("moment");
var fs = require("fs");
moment.locale("pt-br");
// Define app
var app = express();
app.use('/scripts', express.static(__dirname + "/node_modules/"));
app.use('/images', express.static(__dirname + "/images/"));


//-----------------------------------------------------------------------------------------------------------
// set the view engine to ejs - https://scotch.io/tutorials/use-ejs-to-template-your-node-application
//-----------------------------------------------------------------------------------------------------------
app.set("view engine", "ejs");


//-----------------------------------------------------------------------------------------------------------
// Create the database - http://lokijs.org/
var db = new loki(__dirname + "\\db\\worldTracer.json", {
    env: "NODEJS",
    autoload: true,
    //autoloadCallback: databaseInitialize,
    autosave: true,
    persistenceMethod: "fs",
    serializationMethod: "pretty",
    autosaveInterval: 5000 // save every five seconds for our example
});

// Create a collection
//var authentications = () =>{ return loadCollection("authentications"); };

// Implement the autoloadback referenced in loki constructor
var databaseInitialize = function() {
    // on the first load of (non-existent database), we will have no collections so we can 
    //   detect the absence of our collections and add (and configure) them now.
    var authentications = db.getCollection("authentications");
    if (authentications === null) {
        authentications = db.addCollection("authentications");
    }
    db.saveDatabase();
};

var loadCollection = function(collectionName, callback) {

    db.loadDatabase({}, function() {
        var _collection = db.getCollection(collectionName);

        if (!_collection) {
            console.log("Collection %s does not exit. Creating ...", collectionName);
            _collection = db.addCollection(collectionName, {
                indices: ["status", "creationDate"]
            });
        }

        callback(_collection);
        //resolve(_collection);
    });
};
//-----------------------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------------------
// Options to execute the Post to WorldTracer
//-----------------------------------------------------------------------------------------------------------
var agentOptions;
var agent;

agentOptions = {
    host: 'tablet.worldtracer.aero',
    port: '443',
    path: '/',
    rejectUnauthorized: false
};

agent = new https.Agent(agentOptions);
var wtrConfig = config.get("wtr");
var options = {
    method: 'POST',
    url: wtrConfig.url, // TODO: via campo
    headers: {
        "Cache-Control": "no-cache",
        "Accept-Encoding": "application/json",
        "Content-Type": "application/json",
        "accept": "*/*",
        "host": "tablet.worldtracer.aero"
    },
    body: {
        userId: wtrConfig.body.userId,
        companyId: wtrConfig.body.companyId,
        password: wtrConfig.body.password
    },
    json: true,
    agent: agent,
    agentOptions: {
        rejectUnauthorized: false
    },
    strictSSL: false,
    rejectUnauthorized: false,
    withCredentials: false
};
//-----------------------------------------------------------------------------------------------------------
// Request - POST to Authentication endpoint from SITA
//-----------------------------------------------------------------------------------------------------------
var successCounter = 0;
var failCounter = 0;

var intervalToAuthenticate = parseInt(config.get("intervalToAuthenticate"));
var requestLoop = setInterval(() => {
    if (!checkStartProcess && !checkEndProcess) {
        console.log("Não é Hora de Fazer os requests ainda!...");
        return;
    }

    request(options, (error, response, body) => {
        console.error("Request to: %s", options.url);
        //nodeRequest();
        if (error) {
            // Error ! :(
            console.error("Error: %s", error);

            failCounter++;
            console.log(`Contadores de Falhas: ${failCounter}`);

            insertAuthentication(error, "failed");
        } else {
            console.log("Response: %s", response);
            //console.log(body);

            insertAuthentication(body, body.status);

            if (body.status === "success") {
                // Success ! :)
                console.log("success! ");

                successCounter++;
                console.log(`Contadores de Sucesso: ${successCounter}`);
            } else {
                failCounter++;
                console.log(`Contadores de Erros: ${failCounter}`);
            }
        }
    });


    // Interval
}, intervalToAuthenticate);

var checkStartProcess = () => {
    var d = new Date();

    // Start DateTime at 08:00 AM
    var startDateTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 08, 00, 00, 00);
    var startLocalTime = startDateTime.getHours();
    var currentDateTime = d.getHours();

    return (currentDateTime >= startLocalTime);
};

var checkEndProcess = () => {
    var d = new Date();

    // End DateTime at 18:00 PM
    var endDateTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18, 00, 00, 00);
    var endLocalTime = endDateTime.getHours();
    var currentDateTime = d.getHours();

    return (currentDateTime <= endLocalTime);
};

var nodeRequest = () => {
    console.log("nodeRequest");
    var nodeOptions = {
        method: 'POST',
        url: 'https://tablet.worldtracer.aero/baggage/wtr/wtrtablet/v1.0/login/auth',
        headers: {
            'Cache-Control': 'no-cache',
            'Accept-Encoding': 'application/json',
            'Content-Type': 'application/json'
        },
        body: { userId: '', companyId: '', password: '' },
        json: true
    };

    request(nodeOptions, function(error, response, body) {
        if (error) {
            // Error ! :(
            console.error("Error: %s", new Error(error));
        }

        console.log(body);
    });

};
//-----------------------------------------------------------------------------------------------------------
// Function to save the response related to authenticate endpoint
//-----------------------------------------------------------------------------------------------------------
var insertAuthentication = (responseBody, status) => {
    if (responseBody) {

        // Get current datetime
        let currentDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        let auth = {
            creationDate: currentDate,
            status: status,
            responseBody: responseBody,
            successCounter: successCounter,
            failCounter: failCounter
        };

        // Store the Authentication object inside of 'authentication' collection
        loadCollection("authentications", (collection) => {

            collection.insert(auth);

            console.log("Added a new record => %s", auth.creationDate);

            db.saveDatabase();
            console.log("Save database => %s \n", db.filename);
        });
    }
};

//-----------------------------------------------------------------------------------------------------------
// Function to get records by Date and Status
//-----------------------------------------------------------------------------------------------------------
var getRecords = function(startDate, endDate, status) {
    return new Promise((resolve, reject) => {

        if (startDate && endDate && status) {
            //new Date(year, month, day, hours, minutes, seconds, milliseconds)
            let start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1, 00, 00, 00);
            let end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1, 23, 59, 59);
            //console.log("StartDate: %s", start);
            //console.log("EndDate: %s", end);

            // Store the Authentication object inside of 'authentication' collection
            loadCollection("authentications", (collection) => {
                var result = collection.chain()
                    .find({ status: "failed" })
                    .where((obj) => {
                        let creationDate = new Date(obj.creationDate);
                        return creationDate >= start && creationDate <= end;
                    })
                    .simplesort("creationDate")
                    .data();
                console.log("Found: %s", JSON.stringify(result));

                resolve(result);
            });
        }
    });
};

//-----------------------------------------------------------------------------------------------------------
// index page 
//-----------------------------------------------------------------------------------------------------------
app.get('/', function(req, res) {

    var currentDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    res.render('pages/index', {
        currentDate: currentDate
    });
});


//-----------------------------------------------------------------------------------------------------------
// about page 
//-----------------------------------------------------------------------------------------------------------
app.get('/about', function(req, res) {
    res.render('pages/about');
});

//-----------------------------------------------------------------------------------------------------------
// Find by startDate and endDate and status
//-----------------------------------------------------------------------------------------------------------
app.get('/find/:startDate/:endDate/:status', function(req, res) {

    if (!req.params &&
        !req.params.startDate &&
        !req.params.endDate &&
        !req.params.status) {
        res.send(404, "All parameters are mandatory!");
        return null;
    }

    var startDate = new Date(req.params.startDate);
    var endDate = new Date(req.params.endDate);
    var status = req.params.status;

    var result = getRecords(startDate, endDate, status)
        .then((result) => {
            //console.log("Result: %s", JSON.stringify(result));

            res.setHeader('Content-Type', 'application/json');
            res.status(200).json(result);
        });
});

//-----------------------------------------------------------------------------------------------------------
// endpoint
//-----------------------------------------------------------------------------------------------------------
app.get("/api/test", (req, res) => {

    console.error("URL: %s", wtrConfig.url);
    // request(options, (error, response, body) => {
    //     if (error) {
    //         // Error ! :(
    //         console.error("Error: %s", error);
    //     } else {
    //         console.log("Response: %s", response);

    //         console.log("Body Status: %s", body.status);
    //     }

    //     res.setHeader('Content-Type', 'application/json');
    //     res.status(200).json({
    //         error: error,
    //         response: response,
    //         body: body
    //     });
    // });

    // form data
    var postData = querystring.stringify({
        userId: wtrConfig.body.userId,
        companyId: wtrConfig.body.companyId,
        password: wtrConfig.body.password
    });

    var optionsHttps = {
        hostname: "tablet-qa.worldtracer.aero",
        port: 443,
        path: "/",
        method: "POST",
        rejectUnauthorized: false,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": postData.length
        } //,
        //cert: fs.readFileSync(__dirname + "/worldtracer-qa.dlh.de.pem")
    };
    // request object
    var req = https.request(optionsHttps, function(res) {
        var result = '';

        res.on('data', function(chunk) {
            result += chunk;
        });
        res.on('end', function() {
            console.log(result);
        });
        res.on('error', function(err) {
            console.log(err);
        });
    });

    // req error
    req.on('error', function(err) {
        console.log(err);
    });

    //send request witht the postData form
    req.write(postData);
    req.end();
    //worldtracer-qa.dlh.de
});


//-----------------------------------------------------------------------------------------------------------
// Mount the self-host to listen port :7000
//-----------------------------------------------------------------------------------------------------------
var server = app.listen(7000, function() {
    var host = server.address().address;
    host = (host === '::' ? 'localhost' : host);
    var port = server.address().port;

    //console.log("NODE_TLS_REJECT_UNAUTHORIZED: %s", process.env.NODE_TLS_REJECT_UNAUTHORIZED);

    console.log("listening at http://%s:%s", host, port);
    console.log("Date: %s", new Date());
    console.log("The magic it\'s happening");
});