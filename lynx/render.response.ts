import { Request as ERequest, Response as EResponse } from "express";
import Response from "./response";
export default class RenderResponse extends Response {
    private view: string;
    private context: any;
    constructor(view: string, context: any) {
        super();
        this.view = view;
        this.context = context;
    }

    performResponse(req: ERequest, res: EResponse) {
        if (!this.context) {
            this.context = {};
        }
        if ((req as any).lang) {
            this.context.lang = (req as any).lang;
        } else {
            this.context.lang = "it";
        }
        res.render(this.view, this.context);
    }
}
