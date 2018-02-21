import * as express from "express";
import App from "./app";

export const BLOCK_CHAIN = "__block_chain";

/**
 * This class defines the base middleware class. Any middleware should be extends
 * this abstract class, implementing the apply method.
 */
export abstract class BaseMiddleware {
    public app: App;

    constructor(app: App) {
        this.app = app;
    }

    /**
     * This method is automatically executed by the framework.
     * @param req the standard express Request object
     * @param res the standard express Response object
     * @return to block the middlewares-controller chain, please return `BLOCK_CHAIN`
     */
    abstract async apply(
        req: express.Request,
        res: express.Response
    ): Promise<any>;
}
