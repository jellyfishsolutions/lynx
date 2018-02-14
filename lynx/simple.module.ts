import BaseModule from "./base.module";

export default class SimpleModule extends BaseModule {
    get controllers(): string {
        return "";
    }
    get middlewares(): string {
        return "";
    }
    get translation(): string {
        return "";
    }
    get views(): string {
        return "";
    }

    get public(): string {
        return "";
    }
}
