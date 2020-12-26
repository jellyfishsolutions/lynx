import * as express from 'express';
import App from './app';
import StatusError from './status-error';

export const BLOCK_CHAIN = '__block_chain';

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
     * Utility method to generate an error with a status code.
     * This method should be used instead of the usual throw new Error(msg).
     * In this way, a proper HTTP status code can be used (for example, 404 or 500),
     * instead of the default 400.
     * @param status the http status code to return
     * @param message the error message
     * @return a new @type StatusError object
     */
    public error(status: number, message: string): StatusError {
        let err = new StatusError(message);
        err.statusCode = status;
        return err;
    }

    /**
     * This method is automatically executed by the framework.
     * @param req the standard express Request object
     * @param res the standard express Response object
     * @return to block the middlewares-controller chain, please return `BLOCK_CHAIN`
     */
    abstract apply(req: express.Request, res: express.Response): Promise<any>;
}
