import { Express } from "express";
import * as express from "express";
import * as nunjucks from "nunjucks";
import * as fs from "fs";
import "reflect-metadata";
import { createConnection } from "typeorm";
import * as session from "express-session";
import * as bodyParser from "body-parser";
import * as multer from "multer";
import * as cors from "cors";
import * as moment from "moment";
const flash = require("express-flash");
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
import Config from "./config";
import BaseModule from "./base.module";

import * as expressGenerator from "./express-generator";
import * as graphqlGenerator from "./graphql/generator";

import { setup } from "./entities/setup";
import User from "./entities/user.entity";
import { sign } from "jsonwebtoken";

const translations: any = {};
const routes: any = {};

declare global {
    interface Array<T> {
        serialize(): Array<any>;
        removeHiddenField(field: string): void;
        addHiddenField(field: string): void;
    }
}

Object.defineProperty(Array.prototype, "serialize", {
    enumerable: false,
    value: function() {
        let r = [];
        for (let el of this) {
            if (el.serialize) {
                r.push(el.serialize());
            } else {
                r.push(el);
            }
        }
        return r;
    }
});

Object.defineProperty(Array.prototype, "addHiddenField", {
    enumerable: false,
    value: function(field: string) {
        for (let el of this) {
            if (el.addHiddenField) {
                el.addHiddenField(field);
            }
        }
    }
});

Object.defineProperty(Array.prototype, "removeHiddenField", {
    enumerable: false,
    value: function(field: string) {
        for (let el of this) {
            if (el.removeHiddenField) {
                el.removeHiddenField(field);
            }
        }
    }
});

/**
 * Utility function to check if we are in the production environment.
 * @return true if the NODE_ENV is set to "production", false otherwise
 */
export function isProduction(): boolean {
    return process.env.NODE_ENV === "production";
}

/**
 * Implementation of the tr filer for the nunjucks engine.
 * It trying to understand the current language from the request. The fallback
 * uses the defaultLanguage set on the app.
 */
function translate(str: string): string {
    try {
        let lang = this.getVariables()["lang"];
        if (!lang) {
            const req: express.Request = this.ctx.req;
            lang = req.acceptsLanguages()[0];
            if (lang === "*") {
                lang = null;
            }
        }
        if (!lang) {
            let app: App = this.ctx.req.app.get("app");
            lang = app.config.defaultLanguage;
        }
        return performTranslation(str, translations[lang]);
    } catch (e) {
        console.log(e);
        console.log(this);
    }
    return str;
}

function performTranslation(str: string, translations: any): string {
    let translation = translations[str];
    if (translation) {
        return translation;
    }
    const start = str.indexOf("{{");
    const end = str.indexOf("}}");
    if (start != -1 && end != -1) {
        let key = str.substring(start + 2, end);
        translation = translations[key.trim()];
        return str.replace("{{" + key + "}}", translation);
    }
    return str;
}
/**
 * Implementation of the date filter using moment.
 * The default implementation uses the "lll" string format, resulting in
 * Feb 19, 2018 4:57 PM in English.
 * @param d the date to format
 * @param format the string to format the date, default to lll
 * @return the formatted date
 */
function date(d: Date, format?: string): string {
    let lang = this.getVariables()["lang"];
    if (!lang) {
        const req: express.Request = this.ctx.req;
        lang = req.acceptsLanguages()[0];
        if (lang === "*") {
            lang = null;
        }
    }
    if (!lang) {
        let app: App = this.ctx.req.app.get("app");
        lang = app.config.defaultLanguage;
    }
    let m = moment(d).locale(lang);
    if (!format) {
        format = "lll";
    }
    return m.format(format);
}

/**
 * Apply parameters to an URL. If a parameter is not found as path parameter,
 * it is added as query parameter.
 * @param url the url to compile
 * @param parameters a plain object containing the parameters
 * @return the compiled url
 */
function applyParameterstoUrl(url: string, parameters: any): string {
    if (!parameters) {
        return url;
    }
    if (url.indexOf("?") == -1) {
        url += "?";
    } else {
        url += "&";
    }
    for (let key in parameters) {
        if (url.indexOf(":" + key) == -1) {
            url += `${key}=${parameters[key]}&`;
        } else {
            url = url.replace(":" + key, parameters[key]);
        }
    }
    if (url.endsWith("?") || url.endsWith("&")) {
        url = url.substring(0, url.length - 1);
    }
    return url;
}

/**
 * Transform the route name to a URL and compile it with the given parameters.
 * @param name the route name (or, eventually, the path)
 * @param parameters a plain object containing the parameters
 * @return the compiled url
 */
function route(name: string, parameters?: any): string {
    let url = name;
    if (routes[name]) {
        url = routes[name];
    }
    return applyParameterstoUrl(url, parameters);
}

/**
 * Implementation of the old filter function. This function returns the previous
 * value of the input form. Fallback to the defaultValue.
 * @param name the name used in the form
 * @param defaultValue a fallback value
 * @return the previous value or defaultValue
 */
function old(name: string, defaultValue?: any): string {
    const req = this.ctx.req;
    if (req.body && req.body[name]) {
        return req.body[name];
    }
    if (req.query[name]) {
        return req.query[name];
    }
    return defaultValue;
}

/**
 * Implementation of the format filter function to format a float number.
 * By default, the number is formatted with 2 decimal numbers.
 * @param val the number to format
 * @param decimal the number of decimal number
 * @return the formatted number as a string
 */
function format(val: number, decimal: number = 2): string {
    return Number(val).toFixed(decimal);
}

/**
 * Implementation of the resolvePath global function. Using this function, it is
 * possible to refer to any views with a virtual folder containing all the available
 * views.
 * @param path the virtual absolute path of the view
 * @return the absolute path of the view if resolved, or the original path otherwise
 */
function resolvePath(path: string): string {
    let normalizedPath = path;
    if (normalizedPath.endsWith(".njk")) {
        normalizedPath = normalizedPath.substring(0, normalizedPath.length - 4);
    }
    let app: App = this.ctx.req.app.get("app");
    let resolved = app.templateMap[path];
    if (resolved) {
        return resolved;
    }
    return path;
}

/**
 * The App class contains the initialization code for a Lynx application.
 */
export default class App {
    public express: Express;
    private _config: Config;
    private _nunjucksEnvironment: nunjucks.Environment;
    private _upload: multer.Instance;
    private _templateMap: any;

    get config(): Config {
        return this._config;
    }

    get templateMap(): any {
        return this._templateMap;
    }

    get nunjucksEnvironment(): nunjucks.Environment {
        return this._nunjucksEnvironment;
    }

    get upload(): multer.Instance {
        return this._upload;
    }

    constructor(config: Config, modules?: BaseModule[]) {
        this._config = config;

        if (modules) {
            let sanitizedModules = new Set(modules);
            sanitizedModules.forEach(module => module.mount(this._config));
        }

        config.db.entities.unshift(__dirname + "/entities/*.entity.js");
        config.middlewaresFolders.unshift(__dirname + "/middlewares");
        config.viewFolders.unshift(__dirname + "/views");

        if (!config.disabledDb) {
            createConnection(<any>config.db)
                .then(_ => {
                    // here you can start to work with your entities
                    console.log("Connection to the db established!");
                    setup(config.db.entities).catch(error => {
                        console.log(error);
                        process.exit(1);
                    });
                })
                .catch(error => {
                    console.error(error);
                    process.exit(1);
                });
        } else {
            console.log("The DB service is disabled");
        }
        this.express = express();
        this.express.set("app", this);

        this.express.use("/api/*", cors());
        if (this.config.jsonLimit) {
            this.express.use(bodyParser.json({ limit: this.config.jsonLimit }));
        } else {
            this.express.use(bodyParser.json());
        }

        this.express.use(bodyParser.urlencoded({ extended: true }));

        let app_session_options: any = {
            secret: config.sessionSecret,
            resave: false,
            saveUninitialized: true
        };
        if (config.sessionStore) {
            app_session_options.store = config.sessionStore;
        }
        let app_session = session(app_session_options);
        this.express.use(app_session);
        this.express.use(flash());

        this._upload = multer({ dest: config.uploadPath });

        for (let folder of config.publicFolders) {
            this.express.use(express.static(folder));
        }

        this.generateTemplateMap(config.viewFolders);
        this._nunjucksEnvironment = nunjucks.configure(config.viewFolders, {
            autoescape: true,
            watch: true,
            express: this.express
        });
        this._nunjucksEnvironment.addFilter("tr", translate);
        this._nunjucksEnvironment.addFilter("json", JSON.stringify);
        this._nunjucksEnvironment.addFilter("format", format);
        this._nunjucksEnvironment.addFilter("date", date);
        this.loadTranslations(config.translationFolders);
        this._nunjucksEnvironment.addGlobal("route", route);
        this._nunjucksEnvironment.addGlobal("old", old);
        this._nunjucksEnvironment.addGlobal("resolvePath", resolvePath);

        for (let path of config.middlewaresFolders) {
            this.loadMiddlewares(path);
        }
        for (let path of config.controllersFolders) {
            this.loadControllers(path);
        }

        if (!config.disabledDb && !config.disabledGraphQL) {
            const schema = graphqlGenerator.generateSchema(config.db.entities);
            // The GraphQL endpoint
            this.express.use(
                "/graphql",
                bodyParser.json(),
                graphqlExpress({ schema })
            );

            // GraphiQL, a visual editor for queries
            this.express.use(
                "/graphiql",
                graphiqlExpress({ endpointURL: "/graphql" })
            );
        }
    }

    private recursiveGenerateTemplateMap(path: string, currentPath: string) {
        const files = fs.readdirSync(path);
        for (let index in files) {
            let currentFilePath = path + "/" + files[index];
            if (fs.lstatSync(currentFilePath).isDirectory()) {
                this.recursiveGenerateTemplateMap(
                    currentFilePath,
                    currentPath + files[index] + "/"
                );
                continue;
            }
            let name = files[index].replace(".njk", "");
            this._templateMap[currentPath + name] = currentFilePath;
        }
    }

    private generateTemplateMap(paths: string[]) {
        this._templateMap = {};
        for (let path of paths) {
            this.recursiveGenerateTemplateMap(path, "/");
        }
    }

    private loadTranslations(paths: string[]) {
        for (let path of paths) {
            const files = fs.readdirSync(path);
            for (let index in files) {
                let nameWithExtension: string = files[index];
                if (!nameWithExtension.endsWith("json")) continue;
                let name = nameWithExtension.substring(
                    0,
                    nameWithExtension.indexOf(".")
                );
                let tmp = JSON.parse(
                    fs.readFileSync(path + "/" + nameWithExtension, "utf8")
                );
                if (!translations[name]) {
                    translations[name] = {};
                }
                for (let key in tmp) {
                    translations[name][key] = tmp[key];
                }
            }
        }
    }

    private loadMiddlewares(path: string) {
        const middlewares = fs.readdirSync(path);
        for (let index in middlewares) {
            let currentFilePath = path + "/" + middlewares[index];
            if (fs.lstatSync(currentFilePath).isDirectory()) {
                this.loadMiddlewares(currentFilePath);
                continue;
            }
            if (middlewares[index].endsWith("ts")) continue;
            const midd = require(currentFilePath);
            if (!midd.default) {
                throw new Error(
                    "Plese define the middleware as the export default class in file " +
                        currentFilePath +
                        "."
                );
            }
            expressGenerator.useMiddleware(this, midd.default);
        }
    }

    private loadControllers(path: string) {
        const files = fs.readdirSync(path);
        for (let index in files) {
            let currentFilePath = path + "/" + files[index];
            if (fs.lstatSync(currentFilePath).isDirectory()) {
                this.loadControllers(currentFilePath);
                continue;
            }
            if (files[index].endsWith("ts")) continue;
            const ctrl = require(currentFilePath);
            if (!ctrl.default) {
                throw new Error(
                    "Plese define the controller as the export default class in file " +
                        currentFilePath +
                        "."
                );
            }
            expressGenerator.useController(this, ctrl.default, routes);
        }
    }

    public startServer(port: number) {
        this.express.listen(port, (err: Error) => {
            if (err) {
                return console.log(err);
            }

            return console.log(`server is listening on ${port}`);
        });
    }

    public route(name: string, parameters?: any) {
        return route(name, parameters);
    }

    public translate(str: string, req: express.Request): string {
        try {
            let lang = this._config.defaultLanguage;
            let langs = req.acceptsLanguages();
            if (langs && langs.length > 0) {
                lang = langs[0];
            }
            return performTranslation(str, translations[lang]);
        } catch (e) {
            console.log(e);
        }
        return str;
    }

    public generateTokenForUser(user: User): string {
        return sign({ id: user.id }, this._config.tokenSecret, {
            expiresIn: "1y"
        });
    }
}
