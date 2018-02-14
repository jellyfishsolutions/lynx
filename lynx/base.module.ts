import Config from "./config";

export default abstract class BaseModule {
    abstract get controllers(): string;
    abstract get middlewares(): string;
    abstract get translation(): string;
    abstract get views(): string;

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
    }
}

