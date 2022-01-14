import { Express } from 'express';
import * as express from 'express';
const http = require('http');
import * as nunjucks from 'nunjucks';
import * as fs from 'fs';
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import * as session from 'express-session';
import * as bodyParser from 'body-parser';
import * as multer from 'multer';
import * as cors from 'cors';
import * as moment from 'moment';
const flash = require('express-flash');
import Config from './config';
import BaseModule from './base.module';
import Migration from './migration';
import MigrationEntity from './entities/migration.entity';
import ErrorController from './error.controller';

import * as expressGenerator from './express-generator';

import { setup } from './entities/setup';
import User from './entities/user.entity';
import { sign } from 'jsonwebtoken';

const translations: any = {};
const routes: any = {};

import { logger } from './logger';
import {
    APIResponseWrapper,
    DefaultAPIResponseWrapper,
} from './api-response-wrapper';
import { MailClient } from './mail-client';
import { initializeTemplating } from './templating/decorators';

/**
 * Utility function to check if we are in the production environment.
 * @return true if the NODE_ENV is set to "production", false otherwise
 */
export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}

/**
 * Retrieve the preferred language from an express request, using the accepts-languages
 * header value.
 * @param req the express request
 * @return the two letter lower-cased language, or "*" (wildcard), or null
 */
export function getLanguageFromRequest(req: express.Request): string {
    let lang = req.acceptsLanguages()[0];
    if (lang.indexOf('-') !== -1) {
        lang = lang.split('-')[0];
    }
    if (lang) {
        lang = lang.trim().toLowerCase();
    }
    return lang;
}

/**
 * This function shall be called with the nunjucks environment as self parameter!
 * It retrieve the language of the current request, using the default
 * language set in the app as fallback.
 */
function retrieveLanguage(self: any): string {
    let lang = null;
    try {
        const req: express.Request = self.ctx.req;
        lang = getLanguageFromRequest(req);
        if (lang === '*') {
            lang = null;
        }
    } catch (e) {}
    try {
        if (!lang) {
            lang = self.getVariables()['lang'];
        }
        if (!lang) {
            let app: App = self.ctx.req.app.get('app');
            lang = app.config.defaultLanguage;
        }
    } catch (e) {
        lang = app.config.defaultLanguage;
    }
    return lang;
}

/**
 * Implementation of the tr filer for the nunjucks engine.
 * It trying to understand the current language from the request. The fallback
 * uses the defaultLanguage set on the app.
 */
function translate(str: string): string {
    try {
        let lang = retrieveLanguage(this);
        return performTranslation(str, translations[lang]);
    } catch (e) {
        logger.info(e);
        logger.info(this);
    }
    return str;
}

function performTranslation(str: string, translations: any): string {
    let translation = translations[str];
    if (translation !== null && translation !== undefined) {
        return translation;
    }
    const start = str.indexOf('{{');
    const end = str.indexOf('}}');
    if (start != -1 && end != -1) {
        let key = str.substring(start + 2, end);
        translation = translations[key.trim()];
        return str.replace('{{' + key + '}}', translation);
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
    if (!d) {
        return '';
    }
    let lang = retrieveLanguage(this);
    let m = moment(d).locale(lang);
    if (!format) {
        format = 'lll';
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
function applyParametersToUrl(url: string, parameters: any): string {
    if (!parameters) {
        return url;
    }
    if (url.indexOf('?') == -1) {
        url += '?';
    } else {
        url += '&';
    }
    for (let key in parameters) {
        if (url.indexOf(':' + key) == -1) {
            url += `${key}=${parameters[key]}&`;
        } else {
            url = url.replace(':' + key, parameters[key]);
        }
    }
    if (url.endsWith('?') || url.endsWith('&')) {
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
    return applyParametersToUrl(url, parameters);
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
    if (normalizedPath.endsWith('.njk')) {
        normalizedPath = normalizedPath.substring(0, normalizedPath.length - 4);
    }
    let app: App = this.ctx.req.app.get('app');
    let resolved = app.templateMap[path];
    if (resolved) {
        return resolved;
    }
    return path;
}

/**
 * This function returns the current server url, with the used protocol and port.
 * This function is available as global function on nunjucks.
 */
function currentHost(): string {
    let req = this.ctx.req;
    return req.protocol + '://' + req.get('host');
}

export let app: App;

/**
 * The App class contains the initialization code for a Lynx application.
 */
export default class App {
    public express: Express;
    public httpServer: any;
    private readonly _config: Config;
    private readonly _nunjucksEnvironment: nunjucks.Environment;
    private readonly _upload: multer.Instance;
    private _templateMap: any;
    private _modules: Set<BaseModule> = new Set();
    private _errorController: ErrorController;
    public apiResponseWrapper: APIResponseWrapper =
        new DefaultAPIResponseWrapper();
    private _mailClient: MailClient;

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

    get mailClient(): MailClient {
        return this._mailClient;
    }

    /**
     * This property allow the customization of the standard error controller.
     * You need to create the controller using its standard constructor:
     * new MyCustomErrorController(app)
     */
    set customErrorController(ctrl: ErrorController) {
        this._errorController = ctrl;
    }

    constructor(config: Config, modules?: BaseModule[]) {
        this._config = config;
        app = this;

        if (!config.onlyModules) {
            logger.warn(
                'LEGACY MODE: loading both modules and a current application context is now deprecated.'
            );
            logger.warn(
                'LEGACY MODE: please reorganize your project folder in order to have ONLY modules, also for your current application context!'
            );
        }

        if (modules) {
            this._modules = new Set(modules);
            this._modules.forEach((module) => module.mount(this._config));
        }

        config.db.entities.unshift(__dirname + '/entities/*.entity.js');
        config.middlewaresFolders.unshift(__dirname + '/middlewares');
        config.viewFolders.unshift(__dirname + '/views');

        if (!config.disabledDb) {
            createConnection(<any>config.db)
                .then((_) => {
                    // here you can start to work with your entities
                    logger.info('Connection to the db established!');
                    setup(config.db.entities)
                        .then((_) => {
                            this._modules.forEach((module) =>
                                module.onDatabaseConnected()
                            );
                            if (!config.disableMigrations) {
                                this.executeMigrations()
                                    .catch((err) => {
                                        logger.error(err);
                                        process.exit(1);
                                    })
                                    .then(() => {
                                        if (this._config.onDatabaseInit) {
                                            this._config.onDatabaseInit();
                                        }
                                    });
                            } else if (this._config.onDatabaseInit) {
                                this._config.onDatabaseInit();
                            }
                        })
                        .catch((error) => {
                            logger.error(error);
                            process.exit(1);
                        });
                })
                .catch((error) => {
                    logger.error(error);
                    process.exit(1);
                });
        } else {
            logger.debug('The DB service is disabled');
        }
        this.express = express();
        this.httpServer = http.createServer(this.express);
        this.express.set('app', this);
        this.express.use((_, res, next) => {
            res.setHeader('X-Powered-By', 'lynx-framework/express');
            next();
        });

        for (let interceptor of this.config.globalInterceptors) {
            if (interceptor.onlyFor) {
                this.express.use(interceptor.onlyFor, interceptor.cb);
            } else {
                this.express.use(interceptor.cb);
            }
        }

        this.express.use('/api/*', cors());
        if (this.config.jsonLimit) {
            this.express.use(bodyParser.json({ limit: this.config.jsonLimit }));
        } else {
            this.express.use(bodyParser.json());
        }

        this.express.use(bodyParser.urlencoded({ extended: true }));

        let app_session_options: any = {
            secret: config.sessionSecret,
            resave: false,
            saveUninitialized: true,
        };
        if (config.sessionStore) {
            app_session_options.store = config.sessionStore;
        }
        let app_session = session(app_session_options);
        this.express.use(app_session);
        this.express.use(flash());

        this._upload = multer({ dest: config.uploadPath });
        fs.exists(config.cachePath, (exists) => {
            if (!exists) {
                fs.mkdir(config.cachePath, (err) => {
                    if (err) {
                        logger.error(
                            'Error creating the local cache directory',
                            err
                        );
                    }
                });
            }
        });

        for (let folder of config.publicFolders) {
            this.express.use(express.static(folder));
        }

        this.generateTemplateMap(config.viewFolders);
        this._nunjucksEnvironment = nunjucks.configure(config.viewFolders, {
            autoescape: true,
            watch: true,
            express: this.express,
        });
        this._nunjucksEnvironment.addFilter('tr', translate);
        this._nunjucksEnvironment.addFilter('json', JSON.stringify);
        this._nunjucksEnvironment.addFilter('format', format);
        this._nunjucksEnvironment.addFilter('date', date);
        this.loadTranslations(config.translationFolders);
        this._nunjucksEnvironment.addGlobal('route', route);
        this._nunjucksEnvironment.addGlobal('old', old);
        this._nunjucksEnvironment.addGlobal('resolvePath', resolvePath);
        this._nunjucksEnvironment.addGlobal('currentHost', currentHost);

        for (let path of config.templatingFolders) {
            this.loadTemplating(path);
        }
        initializeTemplating(this);

        for (let path of config.middlewaresFolders) {
            this.loadMiddlewares(path);
        }
        for (let path of config.controllersFolders) {
            this.loadControllers(path);
        }

        this._errorController = new ErrorController(this);

        this._mailClient = config.mailFactoryConstructor();
        this._mailClient.init().catch((err) => {
            logger.warn('Error trying to initialize the mailClient', err);
        });
    }

    private recursiveGenerateTemplateMap(path: string, currentPath: string) {
        const files = fs.readdirSync(path);
        for (let index in files) {
            let currentFilePath = path + '/' + files[index];
            if (fs.lstatSync(currentFilePath).isDirectory()) {
                this.recursiveGenerateTemplateMap(
                    currentFilePath,
                    currentPath + files[index] + '/'
                );
                continue;
            }
            let name = files[index].replace('.njk', '');
            this._templateMap[currentPath + name] = currentFilePath;
        }
    }

    private generateTemplateMap(paths: string[]) {
        this._templateMap = {};
        for (let path of paths) {
            this.recursiveGenerateTemplateMap(path, '/');
        }
    }

    private async recursiveExecuteMigrations(path: string) {
        if (!fs.existsSync(path)) {
            logger.warn('The migration folder ' + path + " doesn't exists!");
            return;
        }
        const files = fs.readdirSync(path).sort((a, b) => a.localeCompare(b));
        for (let index in files) {
            let currentFilePath = path + '/' + files[index];
            if (fs.lstatSync(currentFilePath).isDirectory()) {
                await this.recursiveExecuteMigrations(currentFilePath);
                continue;
            }
            if (currentFilePath.endsWith('ts')) continue;
            const m = require(currentFilePath);
            if (!m.default) {
                throw new Error(
                    'Please define the migration as the export default class in file ' +
                        currentFilePath +
                        '.'
                );
            }
            let entity = await MigrationEntity.findByName(currentFilePath);
            if (entity && entity.wasExecuted()) {
                continue;
            }
            if (!entity) {
                entity = new MigrationEntity();
                entity.name = currentFilePath;
                await entity.save();
            }
            let migration = new m.default() as Migration;
            try {
                await migration.up();
                entity.setExecuted();
                await entity.save();
                logger.info('Migration ' + currentFilePath + ' executed!');
            } catch (e) {
                entity.setFailed();
                await entity.save();
                logger.error(
                    'Error executing the migration ' + currentFilePath
                );
                throw e;
            }
        }
    }

    /**
     *  This method will execute the migrations.
     *  By default, this method will be executed automatically during the app
     *  startup. In some scenario, like hight-scalability, this behaviour could
     *  be unwanted. Thus, it is possibly otherwise to explicitly call this method
     *  in some other way (for example, connecting it to a standard http route).
     */
    public async executeMigrations() {
        for (let path of this._config.migrationsFolders) {
            await this.recursiveExecuteMigrations(path);
        }
    }

    private loadTranslations(paths: string[]) {
        for (let path of paths) {
            const files = fs.readdirSync(path);
            for (let index in files) {
                let nameWithExtension: string = files[index];
                if (!nameWithExtension.endsWith('json')) continue;
                let name = nameWithExtension.substring(
                    0,
                    nameWithExtension.indexOf('.')
                );
                let tmp = JSON.parse(
                    fs.readFileSync(path + '/' + nameWithExtension, 'utf8')
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
        if (!fs.existsSync(path)) {
            logger.warn('The middleares folder ' + path + " doesn't exists!");
            return;
        }
        const middlewares = fs.readdirSync(path);
        for (let index in middlewares) {
            let currentFilePath = path + '/' + middlewares[index];
            if (fs.lstatSync(currentFilePath).isDirectory()) {
                this.loadMiddlewares(currentFilePath);
                continue;
            }
            if (middlewares[index].endsWith('ts')) continue;
            const midd = require(currentFilePath);
            if (!midd.default) {
                throw new Error(
                    'Please define the middleware as the export default class in file ' +
                        currentFilePath +
                        '.'
                );
            }
            expressGenerator.useMiddleware(this, midd.default);
        }
    }

    private loadControllers(path: string) {
        const files = fs.readdirSync(path);
        for (let index in files) {
            let currentFilePath = path + '/' + files[index];
            if (fs.lstatSync(currentFilePath).isDirectory()) {
                this.loadControllers(currentFilePath);
                continue;
            }
            if (files[index].endsWith('ts')) continue;
            const ctrl = require(currentFilePath);
            if (!ctrl.default) {
                throw new Error(
                    'Please define the controller as the export default class in file ' +
                        currentFilePath +
                        '.'
                );
            }
            expressGenerator.useController(this, ctrl.default, routes);
        }
    }

    private loadTemplating(path: string) {
        if (!fs.existsSync(path)) {
            return;
        }
        const files = fs.readdirSync(path);
        for (let index in files) {
            let currentFilePath = path + '/' + files[index];
            if (fs.lstatSync(currentFilePath).isDirectory()) {
                this.loadTemplating(currentFilePath);
                continue;
            }
            if (files[index].endsWith('ts')) continue;
            require(currentFilePath);
        }
    }

    public startServer(port: number) {
        this.express.use((req, res) => {
            this._errorController
                .onNotFound(req as any)
                .then((r: any) => {
                    if (!res.headersSent) {
                        res.status(404);
                    }
                    r.performResponse(req, res);
                })
                .catch((err) => {
                    if (!res.headersSent) {
                        res.status(404);
                    }
                    res.send(err);
                });
        });
        this.express.use((error: Error, req: any, res: any, _: any) => {
            this._errorController
                .onError(error, req as any)
                .then((r: any) => {
                    if (!res.headersSent) {
                        res.status(500);
                    }
                    r.performResponse(req, res);
                })
                .catch((err) => {
                    if (!res.headersSent) {
                        res.status(500);
                    }
                    res.send(err);
                });
        });

        this.httpServer.listen(port, () => {
            logger.info(`server is listening on ${port}`);
        });
    }

    /**
     * Proxy method to the usual `route` method available from the controller
     * @param name the name of the route
     * @param parameters an object containing the parameters of the route
     * @returns the compiled url
     */
    public route(name: string, parameters?: any) {
        return route(name, parameters);
    }

    /**
     * Request the translation of a string
     * @param str  the string to be translated
     * @param req the request from which infer the language
     * @param language optionally, the language can be forced using this variable
     * @returns the translated string
     */
    public translate(str: string, req: express.Request, language?: string): string {
        try {
            let lang = language ?? getLanguageFromRequest(req);
            if (!lang) {
                lang = this._config.defaultLanguage;
            }
            return performTranslation(str, translations[lang]);
        } catch (e) {
            logger.info(e);
        }
        return str;
    }

    /**
     * Utility method to generate an user token
     * @param user the user
     * @returns the token for the user
     */
    public generateTokenForUser(user: User): string {
        return sign({ id: user.id }, this._config.tokenSecret, {
            expiresIn: '1y',
        });
    }
}

declare global {
    interface Array<T> {
        serialize(): Array<any>;
        removeHiddenField(field: string): void;
        addHiddenField(field: string): void;
    }
}

Object.defineProperty(Array.prototype, 'serialize', {
    enumerable: false,
    configurable: true,
    value: function () {
        let r = [];
        for (let el of this) {
            if (el.serialize) {
                r.push(el.serialize());
            } else {
                r.push(el);
            }
        }
        return r;
    },
});

Object.defineProperty(Array.prototype, 'addHiddenField', {
    enumerable: false,
    configurable: true,
    value: function (field: string) {
        for (let el of this) {
            if (el.addHiddenField) {
                el.addHiddenField(field);
            }
        }
    },
});

Object.defineProperty(Array.prototype, 'removeHiddenField', {
    enumerable: false,
    configurable: true,
    value: function (field: string) {
        for (let el of this) {
            if (el.removeHiddenField) {
                el.removeHiddenField(field);
            }
        }
    },
});
