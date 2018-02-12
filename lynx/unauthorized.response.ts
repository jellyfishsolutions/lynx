import { Request as ERequest, Response as EResponse } from "express";
import Response from "./response";

/**
 * Generate an unauthorized response (status code 401).
 */
export default class UnauthorizedResponse extends Response {
    performResponse(_: ERequest, res: EResponse) {
        res.redirect(401, "unauthorized");
    }
}
