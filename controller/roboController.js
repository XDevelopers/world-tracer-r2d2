const result = require("../engine/httpResponseHelper");
const roboService = require('../service/roboService');

let roboController = {

    authenticate: (req, res) => {
        try {

            let username = req.body.username || "";
            let password = req.body.password || "";

            let dbUser = userService.getByLogin(username, password);

            // If authentication is success will generate a token
            // and dispatch it to the client.
            if (dbUser) {
                result.data(res, tokenService.generateToken(dbUser));
            }

        } catch (ex) {
            result.badRequest(res, ex.message);
            return;
        }
    },


    //-----------------------------------------------------------------------------------------------------------
    // Function to get records by Date and Status
    //-----------------------------------------------------------------------------------------------------------
    getRecords: (req, res) => {
        try {

            if (!req.params &&
                !req.params.startDate &&
                !req.params.endDate &&
                !req.params.status) {
                res.send(404, "All parameters are mandatory!");
                return null;
            }

            let startDate = new Date(req.params.startDate);
            let endDate = new Date(req.params.endDate);
            let status = req.params.status;

            var data = roboService.getRecords(startDate, endDate, status);
            // .then((data) => {
            //     //console.log("Result: %s", JSON.stringify(result));

            //     res.setHeader('Content-Type', 'application/json');
            //     result.data(res, data);
            // });
            res.setHeader('Content-Type', 'application/json');
            result.data(res, data);

        } catch (ex) {
            result.badRequest(res, ex.message);
            return;
        }
    }

};
module.exports = roboController;