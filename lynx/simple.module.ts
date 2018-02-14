import BaseModule from "./base.module";

export default class SimpleModule extends BaseModule {
    get controllers(): string {
        return __dirname + "controllers";
    }
    get middlewares(): string {
        return __dirname + "middlewares";
    }
    get translation(): string {
        return __dirname + "locale";
    }
    get views(): string {
        return __dirname + "views";
    }

    get public(): string {
        return __dirname + "public";
    }
}
