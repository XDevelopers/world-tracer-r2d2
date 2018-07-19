module.exports = {
    apps: [{
        name: "wtr-r2d2",
        script: "app.js",
        env: {
            NODE_ENV: "development"
        },
        env_production: {
            NODE_ENV: "production"
        },
        instances: 1,
        exec_mode: "fork"
    }]
}