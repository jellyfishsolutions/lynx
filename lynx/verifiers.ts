/**
 * This module contains a set of standard verifiers to ensure user authentication
 * and authorization.
 */

import * as express from "express";
import Role from "./entities/role.entity";
import Request from "./request";

/**
 * Verify that the user is authenticated.
 */
export function authUser(req: Request, _: express.Response) {
    if (!req.user || req.user === undefined) {
        return false;
    }
    return true;
}

/**
 * Verify that the user is NOT authenticated.
 */
export function notAuthUser(req: Request, res: express.Response) {
    return !authUser(req, res);
}

/**
 * Verify that the user is logged and that is at least a Staff member.
 */
export function isStaffOrGreater(req: Request, res: express.Response) {
    if (!authUser(req, res)) {
        return false;
    }
    if (req.user.level >= Role.STAFF_LEVEL) {
        return true;
    }
    return false;
}
