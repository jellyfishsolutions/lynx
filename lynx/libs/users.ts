import * as bcrypt from "bcrypt";
import * as _generatePassword from "password-generator";
import User from "../entities/user.entity";
import { Request } from "express";

export async function hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(
    plainPassword: string,
    hashPassword: string
): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashPassword);
}

export function generatePassword() {
    return _generatePassword(6);
}

export enum UserErrors {
    NOT_FOUND = 1,
    WRONG_PASSWORD
}

export async function performLogin(
    email: string,
    password: string
): Promise<User | UserErrors> {
    let user = await User.findOne({ email: email });
    if (!user) {
        return UserErrors.NOT_FOUND;
    }
    if (!await verifyPassword(password, user.password)) {
        return UserErrors.WRONG_PASSWORD;
    }
    return user;
}

export function createUserSession(req: Request, user: User) {
    (<any>req.session).user_id = user.id;
}

export function destroyUserSession(req: Request) {
    delete (<any>req.session).user_id;
}

export async function retrieveUserFromSession(
    req: Request
): Promise<User | undefined> {
    if (!req.session) {
        console.error("No connection to REDIS!!!!");
        process.exit(2);
    }
    return User.findOneById((<any>req.session).user_id);
}
