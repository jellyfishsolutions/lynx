import { Request as ERequest } from "express";
import User from "./entities/user.entity";

export default interface Request extends ERequest {
    user: User;
    files: Express.Multer.File[];
};

export { Request };
