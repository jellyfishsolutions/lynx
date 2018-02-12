import { Request as ERequest, Response as EResponse } from "express";

/**
 * This is the base class for any response returned by a non-API controller.
 * This class is used by the framework to correctly generate the response.
 */
export default abstract class Response {
    /**
     * Generate the correct response, injecting it to the standard Express response.
     * @param req the standard Express request
     * @param res the standard Express response
     */
    abstract performResponse(req: ERequest, res: EResponse): void;
}
