import { BaseController } from "lynx-framework/base.controller";
import Request from "lynx-framework/request";
import Response from "lynx-framework/response";
import { Route, GET } from "lynx-framework/decorators";

@Route("/backoffice")
export default class MainController extends BaseController {
    @GET("/")
    async getMain(req: Request): Promise<Response> {
        return this.render("main", req, { username: "Backoffice" });
    }
}
