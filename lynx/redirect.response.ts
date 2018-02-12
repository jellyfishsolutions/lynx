import Response from "./response";
import { Request as ERequest, Response as EResponse } from "express";

export default class RedirectResponse extends Response {
    private path: string;

    constructor(path: string) {
        super();
        this.path = path;
    }

    performResponse(_: ERequest, res: EResponse) {
        res.redirect(this.path);
    }
}
