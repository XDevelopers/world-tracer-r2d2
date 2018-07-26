let db = {

    //---------------------------------------------------------------------
    // Create the database - http://lokijs.org/
    //---------------------------------------------------------------------
    db = new loki(__dirname + "\\db\\worldTracer.json", {
        env: "NODEJS",
        autoload: true,
        //autoloadCallback: databaseInitialize,
        autosave: true,
        persistenceMethod: "fs",
        serializationMethod: "pretty",
        autosaveInterval: 5000 // save every five seconds for our example
    });

}

module.exports = db;