import { Request as ERequest, Response as EResponse } from "express";
import Response from "./response";

/**
 * Generate an HTML response using the template engine.
 */
export default class RenderResponse extends Response {
    private view: string;
    private context: any;

    /**
     * The constructor
     * @param view the path to the view
     * @param context the context necessary to generate the template
     */
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
