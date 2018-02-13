import { App } from "lynx-framework";
import { BaseMiddleware } from "lynx-framework/base.middleware";
import { Middleware } from "lynx-framework/decorators";
import * as express from "express";

@Middleware("/*")
export default class AlwaysMiddleware extends BaseMiddleware {
    constructor(app: App) {
        super(app);
    }
    async apply(_: express.Request, __: express.Response) {
        console.log("middleware called!");
    }
}
