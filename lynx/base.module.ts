import Config from './config';

export default abstract class BaseModule {
    abstract get controllers(): string;
    abstract get middlewares(): string;
    abstract get translation(): string;
    abstract get views(): string;
    abstract get public(): string;
    abstract get entities(): string;
    abstract get migrations(): string;
    abstract get templating(): string;

    public mount(config: Config) {
        if (this.controllers) {
            if (config.onlyModules) {
                config.controllersFolders.push(this.controllers);
            } else {
                config.controllersFolders.unshift(this.controllers);
            }
        }
        if (this.middlewares) {
            if (config.onlyModules) {
                config.middlewaresFolders.push(this.middlewares);
            } else {
                config.middlewaresFolders.unshift(this.middlewares);
            }
        }
        if (this.translation) {
            if (config.onlyModules) {
                config.translationFolders.push(this.translation);
            } else {
                config.translationFolders.unshift(this.translation);
            }
        }
        if (this.views) {
            if (config.onlyModules) {
                config.viewFolders.push(this.views);
            } else {
                config.viewFolders.unshift(this.views);
            }
        }
        if (this.public) {
            if (config.onlyModules) {
                config.publicFolders.push(this.public);
            } else {
                config.publicFolders.unshift(this.public);
            }
        }
        if (this.entities) {
            if (config.onlyModules) {
                config.db.entities.push(this.entities + '/*.entity.js');
            } else {
                config.db.entities.unshift(this.entities + '/*.entity.js');
            }
        }
        if (this.migrations) {
            if (config.onlyModules) {
                config.migrationsFolders.push(this.migrations);
            } else {
                config.migrationsFolders.unshift(this.migrations);
            }
        }
        if (this.templating) {
            if (config.onlyModules) {
                config.templatingFolders.push(this.templating);
            } else {
                config.templatingFolders.unshift(this.templating);
            }
        }
    }

    public onDatabaseConnected() {}
}
