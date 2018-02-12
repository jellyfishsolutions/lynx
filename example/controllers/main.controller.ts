import { BaseController } from "../../lynx/base.controller";
import Request from "../../lynx/request";
import Response from "../../lynx/render.response";
import { Route, GET, API } from "../../lynx/decorators";

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
