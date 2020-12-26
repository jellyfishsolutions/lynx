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
            config.controllersFolders.unshift(this.controllers);
        }
        if (this.middlewares) {
            config.middlewaresFolders.unshift(this.middlewares);
        }
        if (this.translation) {
            config.translationFolders.unshift(this.translation);
        }
        if (this.views) {
            config.viewFolders.unshift(this.views);
        }
        if (this.public) {
            config.publicFolders.unshift(this.public);
        }
        if (this.entities) {
            config.db.entities.unshift(this.entities + '/*.entity.js');
        }
        if (this.migrations) {
            config.migrationsFolders.unshift(this.migrations);
        }
        if (this.templating) {
            config.templatingFolders.unshift(this.templating);
        }
    }

    public onDatabaseConnected() {}
}
