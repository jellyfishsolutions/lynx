import RenderResponse from "./render.response";
import { Request as ERequest, Response as EResponse } from "express";

export default class XmlResponse extends RenderResponse {
    performResponse(req: ERequest, res: EResponse) {
        res.contentType('application/xml');
        return super.performResponse(req, res);
    }
}