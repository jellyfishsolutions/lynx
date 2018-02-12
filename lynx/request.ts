import { Request as ERequest } from "express";
import User from "./entities/user.entity";
/**
 * The standard Lynx request, uses in any request.
 * It extends the stnadard Express request, with the user property and with
 * the files arrays from the Multer library.
 */
export default interface Request extends ERequest {
    user: User;
    files: Express.Multer.File[];
};

export { Request };
