import App from "../lynx/app";

const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV == "production";

import * as session from "express-session";
import * as redisStore from "connect-redis";

let myRedisStore = redisStore(session);

let config = {
    db: {
        type: "mysql",
        host: "localhost",
        port: 8889,
        username: "root",
        password: "root",
        database: "koa_typescript2",
        entities: [__dirname + "/entities/*.entity.js"],
        synchronize: true,
        logging: false
    },
    publicFolders: [__dirname + "/public"],
    viewFolders: [__dirname + "/views"],
    translationFolders: [__dirname + "/locale"],
    middlewaresFolders: [__dirname + "/middlewares"],
    controllersFolders: [__dirname + "/controllers"],
    sessionSecret: "prova123123123",
    sessionStore: new myRedisStore({}),
    tokenSecret: "prova123123123",
    mailer: {
        sender: 'Luca Roverelli" <luca.roverelli@gmail.com>'
    },
    defaultLanguage: "it",
    uploadPath: __dirname + "/../uploads"
};

if (isProduction) {
    config.db.host = "mysql56";
    config.db.port = 3306;
    config.db.database = "bike_rental_world";
    config.db.password = "t3Ff47%&";
    config.db.username = "root";
    config.sessionSecret = "bikeRentalWorld65382";
    config.tokenSecret = "bikeTokenRenaltWorld3284798273";
    config.uploadPath = "/uploads";
    config.sessionStore = new myRedisStore({ host: "redis" });
}

const app = new App(config);
app.startServer(port);
