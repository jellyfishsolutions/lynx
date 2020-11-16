import { Request as ERequest, Response as EResponse } from "express";
import Response from "./response";

/**
 *
 * This class simply wrap the original Response class in order to add async/await
 * functionality, improving code readability and maintenability.
 */
export default abstract class AsyncResponse extends Response {
    /**
     * Generate the correct response, injecting it to the standard Express response.
     * @param req the standard Express request
     * @param res the standard Express response
     */
    abstract async asyncResponse(req: ERequest, res: EResponse): Promise<void>;

    performResponse(req: ERequest, res: EResponse) {
        this.asyncResponse(req, res)
            .then(() => {})
            .catch(err => {
                throw err;
            });
    }
}
