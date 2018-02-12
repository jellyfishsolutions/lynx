import Response from "./response";
import { Request as ERequest, Response as EResponse } from "express";

/**
 * Generation of a redirect response.
 */
export default class RedirectResponse extends Response {
    private path: string;

    /**
     * Base constructor
     * @param path the redirect path
     */
    constructor(path: string) {
        super();
        this.path = path;
    }

    performResponse(_: ERequest, res: EResponse) {
        res.redirect(this.path);
    }
}
