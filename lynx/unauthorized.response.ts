import { Request as ERequest, Response as EResponse } from "express";
import Response from "./response";

export default class UnauthorizedResponse extends Response {
    performResponse(_: ERequest, res: EResponse) {
        res.redirect(401, "unauthorized");
    }
}
