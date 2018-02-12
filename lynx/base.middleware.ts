import * as express from "express";
import App from "./app";

export abstract class BaseMiddleware {
    public app: App;

    constructor(app: App) {
        this.app = app;
    }

    abstract async apply(
        req: express.Request,
        res: express.Response
    ): Promise<any>;
}
