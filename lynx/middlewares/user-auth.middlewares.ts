import { BaseMiddleware } from "../base.middleware";
import * as express from "express";
import { Middleware } from "../decorators";
import { verifyJwtToken } from "../libs/jwt";
import User from "../entities/user.entity";
import * as userLib from "../libs/users";
import App from "../app";

/**
 * Default middleware to enable user authentication.
 * This middleware supports both session and token authorization.
 * The should be injected as the HTTP header "Authorization" and prefixed with "Bearer".
 * This middleware retrieve the user from the DB, and adds an user property to the
 * standard Express request.
 */
@Middleware("/*")
export default class UserAuthMiddleware extends BaseMiddleware {
    constructor(app: App) {
        super(app);
    }

    async apply(req: express.Request, _: express.Response) {
        let user;
        try {
            user = await userLib.retrieveUserFromSession(req);
        } catch (err) {
            return;
        }
        if (user) {
            (<any>req).user = user;
            return;
        }
        let token = req.get("Authorization");
        if (!token) return;
        try {
            token = token.substring("Bearer".length).trim();
            let decoded: any = await verifyJwtToken(
                token,
                this.app.config.tokenSecret
            );
            let id = decoded.id;
            let user = await User.findOne(id);
            if (user) {
                (<any>req).user = user;
            }
        } catch (err) {
            console.error(err);
        }
    }
}
