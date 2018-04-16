import { setSkipSync } from "./entities/user.entity";

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
    sessionSecret: string;
    sessionStore?: any;
    tokenSecret: string;
    mailer: {
        sender: string;
    };
    defaultLanguage: string;
    uploadPath: string;
};

export class ConfigBuilder {
    private config: Config;

    public constructor(basePath: string) {
        this.config = {
            disabledDb: false,
            disabledGraphQL: false,
            db: {
                type: "mysql",
                host: "localhost",
                port: 8889,
                username: "root",
                password: "root",
                database: "koa_typescript2",
                entities: [basePath + "/entities/*.entity.js"],
                synchronize: true,
                logging: false
            },
            publicFolders: [basePath + "/public"],
            viewFolders: [basePath + "/views"],
            translationFolders: [basePath + "/locale"],
            middlewaresFolders: [basePath + "/middlewares"],
            controllersFolders: [basePath + "/controllers"],
            sessionSecret: "session_secret",
            sessionStore: null,
            tokenSecret: "token_secret",
            mailer: {
                sender: 'Lynx Framework" <lynx.framework@fakemail.com>'
            },
            defaultLanguage: "it",
            uploadPath: basePath + "/../uploads"
        };
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

    public disableGraphQL(): ConfigBuilder {
        this.config.disabledGraphQL = true;
        return this;
    }

    public setMailerSender(address: string): ConfigBuilder {
        this.config.mailer.sender = address;
        return this;
    }

    public setCustomUserEntity(hasCustom: boolean): ConfigBuilder {
        setSkipSync(!hasCustom);
        return this;
    }

    public build(): Config {
        return this.config;
    }
}
