const moment = require("moment");
const config = require("config");
const request = require("request");
const http = require("http");
const https = require("https");
const querystring = require("querystring");
const url = require('url');

const loki = require("lokijs");
const uuidv1 = require('uuid/v1');
//----------------------------------------------------------------------
// Create the database - http://lokijs.org/
//----------------------------------------------------------------------
const lokidb = new loki(__dirname + "\\db\\worldTracer.json", {
    env: "NODEJS",
    autoload: true,
    //autoloadCallback: databaseInitialize,
    autosave: true,
    persistenceMethod: "fs",
    serializationMethod: "pretty",
    autosaveInterval: 5000 // save every five seconds for our example
});
const db = lokidb.addCollection('authentications');

/**
 * Serviço para fazer as chamadas para o endpoint de autenticação da SITA WTR
 */
let roboService = {

    // Garantir que será carregada a Collection desejada
    loadCollection: (collectionName, callback) => {

        lokidb.loadDatabase({}, () => {
            var _collection = lokidb.getCollection(collectionName);

            if (!_collection) {
                console.log("Collection %s does not exit. Creating ...", collectionName);
                _collection = lokidb.addCollection(collectionName, {
                    indices: ["status", "creationDate"]
                });
            }

            callback(_collection);
            //resolve(_collection);
        });
    },

    checkStartProcess: (initialHour) => {
        if (!initialHour) {
            throw "initial hour is mandatory!";
        }

        var now = moment();
        // Start DateTime at 08:00 AM
        var startDateTime = moment({
            hour: initialHour
        });

        //console.log("Data Atual: "+ now.format());
        //console.log("Data Inicio: "+ startDateTime.format());

        return now.hour() >= startDateTime.hour();
    },

    checkEndProcess: (endHour) => {
        if (!endHour) {
            throw "end hour is mandatory!";
        }
        var now = moment();

        // End DateTime at 18:00 PM
        var endDateTime = moment({
            hour: endHour
        });

        return now.hour() <= endDateTime.hour();
    },

    //-----------------------------------------------------------------------------------------------------------
    // Request - POST to Authentication endpoint from SITA
    //-----------------------------------------------------------------------------------------------------------
    requestLoop: (intervalToAuthenticate) => {
        if (intervalToAuthenticate <= 0) {
            throw 'Interval to Authenticate is mandatory!';
        }

        if (!roboService.checkStartProcess(8) && !roboService.checkEndProcess(18)) {
            console.log("Não é Hora de Fazer os requests ainda!...");
            return;
        }

        let successCounter = 0;
        let failCounter = 0;

        setInterval(() => {
            //process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            let options = roboService.httpsRequestOptions();
            //https.request(options.url, options.httpsOptions, (error, response, body) => {
            https.request(options.url, options.httpsOptions, (res) => {
                console.error("Request to: %s", options.url);

                res.on('data', (data) => {

                });

                //nodeRequest();
                if (error) {
                    // Error ! :(
                    console.error("Error: %s", error);

                    failCounter++;
                    console.log(`Contadores de Falhas: ${failCounter}`);

                    roboService.insertAuthentication(error, "failed", successCounter, failCounter);
                } else {
                    console.log("Response: %s", response);
                    //console.log(body);

                    if (body.status === "success") {
                        // Success ! :)
                        console.log("success! ");

                        successCounter++;
                        console.log(`Contadores de Sucesso: ${successCounter}`);
                    } else {
                        failCounter++;
                        console.log(`Contadores de Erros: ${failCounter}`);
                    }
                    roboService.insertAuthentication(body, body.status, successCounter, failCounter);
                }
            });
            // Interval
        }, intervalToAuthenticate);
    },

    //-----------------------------------------------------------------------------------------------------------
    // Function to save the response related to authenticate endpoint
    //-----------------------------------------------------------------------------------------------------------
    insertAuthentication: (responseBody, status) => {
        if (responseBody) {

            // Get current datetime
            let currentDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
            let auth = {
                creationDate: currentDate,
                status: status,
                responseBody: responseBody //,
                    //successCounter: successCounter,
                    //failCounter: failCounter
            };

            db.insert(auth);
            console.log("Added a new record => %s", auth.creationDate);

            lokidb.saveDatabase();
            console.log("Save database => %s \n", lokidb.filename);
        }
    },

    getRecords: (startDate, endDate, status) => {

        if (!startDate) {
            throw "startDate is mandatory!";
        }
        if (!endDate) {
            throw "endDate is mandatory!";
        }
        if (!status) {
            throw "status is mandatory!";
        }

        if (startDate && endDate && status) {
            //new Date(year, month, day, hours, minutes, seconds, milliseconds)
            let start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1, 00, 00, 00);
            let end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1, 23, 59, 59);
            console.log("StartDate: %s", start);
            console.log("EndDate: %s", end);

            var result = db.chain()
                .find({ status: "failed" })
                .where((obj) => {
                    let creationDate = new Date(obj.creationDate);
                    return creationDate >= start && creationDate <= end;
                })
                .simplesort("creationDate")
                .data();

            console.log("Found: %s", JSON.stringify(result));
            return result;

            //resolve(result);

            // Store the Authentication object inside of 'authentication' collection
            // loadCollection("authentications", (collection) => {
            //     var result = collection.chain()
            //         .find({ status: "failed" })
            //         .where((obj) => {
            //             let creationDate = new Date(obj.creationDate);
            //             return creationDate >= start && creationDate <= end;
            //         })
            //         .simplesort("creationDate")
            //         .data();

            //     console.log("Found: %s", JSON.stringify(result));

            //     resolve(result);
            // });
        }
        return [];

        // return new Promise((resolve, reject) => {

        //     if (startDate && endDate && status) {
        //         //new Date(year, month, day, hours, minutes, seconds, milliseconds)
        //         let start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1, 00, 00, 00);
        //         let end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1, 23, 59, 59);
        //         console.log("StartDate: %s", start);
        //         console.log("EndDate: %s", end);

        //         var result = db.chain()
        //             .find({ status: "failed" })
        //             .where((obj) => {
        //                 let creationDate = new Date(obj.creationDate);
        //                 return creationDate >= start && creationDate <= end;
        //             })
        //             .simplesort("creationDate")
        //             .data();

        //         console.log("Found: %s", JSON.stringify(result));

        //         resolve(result);

        //         // Store the Authentication object inside of 'authentication' collection
        //         // loadCollection("authentications", (collection) => {
        //         //     var result = collection.chain()
        //         //         .find({ status: "failed" })
        //         //         .where((obj) => {
        //         //             let creationDate = new Date(obj.creationDate);
        //         //             return creationDate >= start && creationDate <= end;
        //         //         })
        //         //         .simplesort("creationDate")
        //         //         .data();

        //         //     console.log("Found: %s", JSON.stringify(result));

        //         //     resolve(result);
        //         // });
        //     }
        //});

    },

    httpsRequestOptions: () => {
        let serviceOptions = {};
        //-----------------------------------------------------------------------------------------------------------
        // Options to execute the Post to WorldTracer
        //-----------------------------------------------------------------------------------------------------------
        let wtrConfig = config.get("wtr");
        let urlArgs = url.parse(wtrConfig.url);

        let agentOptions = {
            host: urlArgs.host,
            port: '443',
            path: urlArgs.path,
            rejectUnauthorized: false
        };
        let port = wtrConfig.url.indexOf("10.") < 0 ? 443 : 80;
        let agent = new https.Agent(agentOptions);
        let requestOptions = {
            method: 'POST',
            url: wtrConfig.url,
            port: port,
            headers: {
                "Cache-Control": "no-cache",
                "Accept-Encoding": "application/json",
                "Content-Type": "application/json",
                "accept": "*/*",
                "host": urlArgs.host
            },
            host: urlArgs.host,
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

        let httpsOptions = {
            protocol: urlArgs.protocol.replace(":", ""),
            host: urlArgs.host,
            hostname: urlArgs.hostname,
            port: port,
            method: "POST",
            path: urlArgs.path,
            headers: requestOptions.headers,
            timeout: 60000
        }

        serviceOptions.url = wtrConfig.url;
        serviceOptions.requestOptions = requestOptions;
        serviceOptions.httpsOptions = httpsOptions;

        return serviceOptions;
    },

    fakeRequestLoop: (intervalToAuthenticate) => {
        if (intervalToAuthenticate <= 0) {
            throw 'Interval to Authenticate is mandatory!';
        }

        if (!roboService.checkStartProcess(8) && !roboService.checkEndProcess(18)) {
            console.log("Não é Hora de Fazer os requests ainda!...");
            return;
        }

        setInterval(() => {
            console.log("Executanto Interval");

            roboService.requestFake();

            // Interval
        }, intervalToAuthenticate);
    },

    requestFake: () => {
        let options = roboService.httpsRequestOptions();

        request(options.requestOptions, (error, response, body) => {
            console.error("Request to: %s", options.url);

            if (error) {
                // Error ! :(
                console.error("Error: %s", error);

                roboService.insertAuthentication(error, "failed");

            } else {
                console.log("Response: %s", response);
                //console.log(body);

                if (body.status === "success") {
                    // Success ! :)
                    console.log("success! ");

                } else {
                    console.log(`Contadores de Erros: ${failCounter}`);
                }
                roboService.insertAuthentication(body, body.status);
            }
        });
    }

};

module.exports = roboService;