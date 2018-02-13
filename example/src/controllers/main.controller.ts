import { BaseController } from "lynx-framework/base.controller";
import Request from "lynx-framework/request";
import Response from "lynx-framework/lynx/response";
import { Route, GET, API } from "lynx-framework/decorators";

@Route("/")
export default class MainController extends BaseController {
    @GET("/")
    async getMain(req: Request): Promise<Response> {
        return this.render("main", req, { username: "Boris" });
    }

    @API()
    @GET("/api")
    async getApi() {
        return "Hello, Boris";
    }
}
