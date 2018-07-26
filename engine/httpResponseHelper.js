let httpResponseHelper = {

    badRequest: (res, message) => {
        res.status(400);
        res.json({ "message": message });
    },

    internalError: (res, message, error) => {
        res.status(500);
        res.json({ "message": message, "error": error });
    },

    notFound: (res, message) => {
        res.status(400);
        res.json({ "message": message });
    },

    ok: (res, message) => {
        res.status(201);
        res.json({ "message": message });
    },

    data: (res, data) => {
        res.status(200);
        res.json(data);
    },

}

module.exports = httpResponseHelper;