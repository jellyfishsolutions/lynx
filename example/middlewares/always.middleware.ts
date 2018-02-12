import App from "../../lynx/app";
import { BaseMiddleware } from "../../lynx/base.middleware";
import { Middleware } from "../../lynx/decorators";
import * as express from "express";

@Middleware("/*")
export default class AlwaysMiddleware extends BaseMiddleware {
    constructor(app: App) {
        super(app);
    }
    async apply(req: express.Request, res: express.Response) {
        console.log("middleware called!");
    }
}
