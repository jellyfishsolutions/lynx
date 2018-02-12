import { Request as ERequest, Response as EResponse } from "express";
import RedirectResponse from "./redirect.response";
import RenderResponse from "./render.response";
import FileResponse from "./file.response";
import UnauthorizedResponse from "./unauthorized.response";

export default abstract class Response {
    abstract performResponse(req: ERequest, res: EResponse): void;
}
