/*
----------------------------------------------------------------------------------------------------------- 
-- App to simulate the request and response related to Login Endpoint
-----------------------------------------------------------------------------------------------------------
*/
var request = require("request");
var express = require("express");
var path = require("path");
var config = require("config");
var loki = require("lokijs");
var moment = require("moment");
moment.locale("pt-br");
// Define app
var app = express();
app.use('/scripts', express.static(__dirname + "/node_modules/"));


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
                unique: ["status", "creationDate"]
            });
        }

        callback(_collection);
        //resolve(_collection);
    });
};
//-----------------------------------------------------------------------------------------------------------


//-----------------------------------------------------------------------------------------------------------
// Request - POST to Authentication endpoint from SITA
//-----------------------------------------------------------------------------------------------------------
var successCounter = 0;
var failCounter = 0;

var intervalToAuthenticate = parseInt(config.get("intervalToAuthenticate"));
var requestLoop = setInterval(() => {
    request(options, (error, response, body) => {
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
                console.log("Found: %s", result);

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
// Options to execute the Post to WorldTracer
//-----------------------------------------------------------------------------------------------------------
var wtrConfig = config.get("wtr");
var options = {
    method: 'POST',
    url: wtrConfig.url, // TODO: via campo
    headers: {
        'Postman-Token': '99f77660-ecd1-450a-bd71-8f7b2dc943b0',
        'Cache-Control': 'no-cache',
        'Accept-Encoding': 'application/json',
        'Content-Type': 'application/json'
    },
    body: {
        userId: wtrConfig.body.userId,
        companyId: wtrConfig.body.companyId,
        password: wtrConfig.body.password
    },
    json: true
};




//-----------------------------------------------------------------------------------------------------------
// Mount the self-host to listen port :7000
//-----------------------------------------------------------------------------------------------------------
var server = app.listen(7000, function() {
    var host = server.address().address;
    host = (host === '::' ? 'localhost' : host);
    var port = server.address().port;

    console.log('listening at http://%s:%s', host, port);
    console.log('The magic it\'s happening');
});