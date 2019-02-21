import { BaseController } from "./base.controller";
import Request from "./request";
import Response from "./response";
import { isProduction } from "./app";

/**
 * The error controller is a custom controller that is invoked when an error
 * occurred.
 * It is invoked only on non-API routes (on API routes, the standard API error is used.)
 */
export default class ErrorController extends BaseController {
    /**
     *  This method will be executed when a route is not found (the tipical 404
     *  error).
     *  @param req the standard lynx Request
     */
    public async onNotFound(req: Request): Promise<Response> {
        if (req.lynx && req.lynx.route && req.lynx.route.isAPI) {
            throw this.error(404, 'not found');
        }
        return this.render("lynx/404", req);
    }

    /**
     *  This method will be executed when an error is thrown during the execution
     *  of a route.
     *  @param error The error, with an additional "statusCode" property, containing the http status code.
     *  @param req the standard lynx Request
     */
    public async onError(error: Error, req: Request): Promise<Response> {
        let e = error as any;
        if (!e.statusCode) {
            e.statusCode = 500;
        }
        if (req.lynx && req.lynx.route && req.lynx.route.isAPI) {
            throw this.error(e.statusCode, error.message);
        }
        return this.render("lynx/error", req, {
            error: error,
            isProduction: isProduction()
        });
    }
}
