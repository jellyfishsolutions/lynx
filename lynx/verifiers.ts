import * as express from "express";
import Role from "./entities/role.entity";
import Request from "./request";

export function authUser(req: Request, _: express.Response) {
    if (!req.user || req.user === undefined) {
        return false;
    }
    return true;
}

export function notAuthUser(req: Request, res: express.Response) {
    return !authUser(req, res);
}

export function isStaffOrGreater(req: Request, res: express.Response) {
    if (!authUser(req, res)) {
        return false;
    }
    if (req.user.level >= Role.STAFF_LEVEL) {
        return true;
    }
    return false;
}
