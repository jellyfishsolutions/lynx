import express from 'express';
import { setSkipSync } from './entities/user.entity';
import { MailClient, NodemailerClient } from './mail-client';
import Response from './response';
import UFS from './ufs';
import { LocalUFS } from './ufs';

export default interface Config {
    disabledDb: boolean;
    db: {
        type: string;
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        entities: string[];
        synchronize: boolean;
        logging: boolean;
    };
    disabledGraphQL: boolean;
    publicFolders: string[];
    viewFolders: string[];
    translationFolders: string[];
    middlewaresFolders: string[];
    controllersFolders: string[];
    migrationsFolders: string[];
    templatingFolders: string[];
    disableMigrations: boolean;
    sessionSecret: string;
    sessionStore?: any;
    tokenSecret: string;
    mailer: {
        sender: string;
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
    mailFactoryConstructor: () => MailClient;
    defaultLanguage: string;
    uploadPath: string;
    cachePath: string;
    jsonLimit?: string;
    ufs: UFS;
    onDatabaseInit: () => void;
    cachingImages: boolean;
    onlyModules: boolean;
    globalInterceptors: {
        cb: (
            req: express.Request,
            res: express.Response,
            next: () => void
        ) => void;
        onlyFor?: string;
    }[];
    beforePerformResponseInterceptors: ((
        res: Response,
        req: express.Request
    ) => Response)[];
}

export class ConfigBuilder {
    private config: Config;

    /**
     * Create a new configuration builder
     * @param basePath the current base path of the application
     * @param legacyMode enable or disable the legacy mode (default: true)
     */
    public constructor(basePath: string, legacyMode: boolean = true) {
        this.config = {
            disabledDb: false,
            disabledGraphQL: false,
            db: {
                type: 'mysql',
                host: 'localhost',
                port: 8889,
                username: 'root',
                password: 'root',
                database: 'koa_typescript2',
                entities: [basePath + '/entities/*.entity.js'],
                synchronize: true,
                logging: false,
            },
            publicFolders: [basePath + '/public'],
            viewFolders: [basePath + '/views'],
            translationFolders: [basePath + '/locale'],
            middlewaresFolders: [basePath + '/middlewares'],
            controllersFolders: [basePath + '/controllers'],
            migrationsFolders: [basePath + '/migrations'],
            templatingFolders: [basePath + '/templating'],
            disableMigrations: false,
            sessionSecret: 'session_secret',
            sessionStore: null,
            tokenSecret: 'token_secret',
            mailer: {
                sender: 'Lynx Framework <lynx.framework@fakemail.com>',
                host: '',
                port: 587,
                secure: false,
                auth: {
                    user: '',
                    pass: '',
                },
            },
            mailFactoryConstructor: () => new NodemailerClient(),
            defaultLanguage: 'it',
            uploadPath: basePath + '/../uploads',
            cachePath: basePath + '/../cache',
            ufs: new LocalUFS(),
            onDatabaseInit: () => {},
            cachingImages: false,
            onlyModules: !legacyMode,
            globalInterceptors: [],
            beforePerformResponseInterceptors: [],
        };
        if (!legacyMode) {
            this.config.db.entities = [];
            this.config.publicFolders = [];
            this.config.viewFolders = [];
            this.config.translationFolders = [];
            this.config.middlewaresFolders = [];
            this.config.controllersFolders = [];
            this.config.migrationsFolders = [];
            this.config.templatingFolders = [];
        }
    }

    public setPublicFolders(folders: string[]): ConfigBuilder {
        this.config.publicFolders = folders;
        return this;
    }

    public setViewFolders(folders: string[]): ConfigBuilder {
        this.config.viewFolders = folders;
        return this;
    }

    public setTranslationFolders(folders: string[]): ConfigBuilder {
        this.config.translationFolders = folders;
        return this;
    }

    public setMiddlewaresFolders(folders: string[]): ConfigBuilder {
        this.config.middlewaresFolders = folders;
        return this;
    }

    public setControllersFolders(folders: string[]): ConfigBuilder {
        this.config.controllersFolders = folders;
        return this;
    }

    public setMigrationsFolders(folders: string[]): ConfigBuilder {
        this.config.migrationsFolders = folders;
        return this;
    }

    public setSessionSecret(secret: string): ConfigBuilder {
        this.config.sessionSecret = secret;
        return this;
    }

    public setTokenSecret(secret: string): ConfigBuilder {
        this.config.tokenSecret = secret;
        return this;
    }

    public setSessionStore(store: any): ConfigBuilder {
        this.config.sessionStore = store;
        return this;
    }

    public setUploadPath(path: string): ConfigBuilder {
        this.config.uploadPath = path;
        return this;
    }

    public setCachePath(path: string): ConfigBuilder {
        this.config.cachePath = path;
        return this;
    }

    public setDefaultLanguage(language: string): ConfigBuilder {
        this.config.defaultLanguage = language;
        return this;
    }

    public setEntitiesFolders(folders: string[]): ConfigBuilder {
        this.config.db.entities = folders;
        return this;
    }

    public setDatabaseType(type: string): ConfigBuilder {
        this.config.disabledDb = false;
        this.config.db.type = type;
        return this;
    }

    public setDatabaseHost(host: string): ConfigBuilder {
        this.config.disabledDb = false;
        this.config.db.host = host;
        return this;
    }

    public setDatabasePort(port: number): ConfigBuilder {
        this.config.disabledDb = false;
        this.config.db.port = port;
        return this;
    }

    public setDatabaseLogin(username: string, password: string): ConfigBuilder {
        this.config.disabledDb = false;
        this.config.db.username = username;
        this.config.db.password = password;
        return this;
    }

    public setDatabase(database: string): ConfigBuilder {
        this.config.disabledDb = false;
        this.config.db.database = database;
        return this;
    }

    public disableDB(): ConfigBuilder {
        this.config.disabledDb = true;
        return this;
    }

    public disableMigration(): ConfigBuilder {
        this.config.disableMigrations = true;
        return this;
    }

    public enableMigration(): ConfigBuilder {
        this.config.disableMigrations = false;
        return this;
    }

    public disableGraphQL(): ConfigBuilder {
        this.config.disabledGraphQL = true;
        return this;
    }

    public setMailerSender(address: string): ConfigBuilder {
        this.config.mailer.sender = address;
        return this;
    }

    public setMailerAuth(user: string, password: string): ConfigBuilder {
        this.config.mailer.auth.user = user;
        this.config.mailer.auth.pass = password;
        return this;
    }

    public setMailerServer(
        host: string,
        port: number,
        secure: boolean
    ): ConfigBuilder {
        this.config.mailer.host = host;
        this.config.mailer.port = port;
        this.config.mailer.secure = secure;
        return this;
    }

    /**
     * Set a different method to istantiace a mailer client.
     * @param fn a function that istantiate a `MailClient` object
     */
    public setMailClientFactoryConstructor(fn: () => MailClient) {
        this.config.mailFactoryConstructor = fn;
        return this;
    }

    public setCustomUserEntity(hasCustom: boolean): ConfigBuilder {
        setSkipSync(!hasCustom);
        return this;
    }

    public setJsonLimit(limit: string): ConfigBuilder {
        this.config.jsonLimit = limit;
        return this;
    }

    public setUFS(ufs: UFS): ConfigBuilder {
        this.config.ufs = ufs;
        return this;
    }

    public setOnDatabaseInit(cb: () => void): ConfigBuilder {
        this.config.onDatabaseInit = cb;
        return this;
    }

    public enableCachingImages(): ConfigBuilder {
        this.config.cachingImages = true;
        return this;
    }

    /**
     * Add global interceptor to the Lynx application.
     * They are mounted before any other routes and middleware, using the
     * `express.use` methods.
     * @param cb The interceptor function that needs to be executed
     * @param onlyFor A sub-path for the interceptor (optional, default to anything)
     * @returns
     */
    public addGlobalRoutingInterceptor(
        cb: (
            req: express.Request,
            res: express.Response,
            next: () => void
        ) => void,
        onlyFor?: string
    ): ConfigBuilder {
        this.config.globalInterceptors.push({ cb: cb, onlyFor: onlyFor });
        return this;
    }

    /**
     * Add "Response" interceptor to the Lynx application.
     * This interceptor will be executed when a request is completed, just before the
     * execution of the `performResponse` method of any response object.
     *
     * This method must return a (potentially) new response, or edit the current response
     * @param cb  The interceptor function that needs to be executed
     * @returns
     */
    public addBeforePerformResponseInterceptor(
        cb: (res: Response, req: express.Request) => Response
    ): ConfigBuilder {
        this.config.beforePerformResponseInterceptors.push(cb);
        return this;
    }

    public build(): Config {
        return this.config;
    }
}
