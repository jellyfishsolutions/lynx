/**
 * Library containing useful function to generate and encrypt password and so on.
 */

import * as bcrypt from "bcrypt";
import * as _generatePassword from "password-generator";
import User from "../entities/user.entity";
import { Request } from "express";

import { logger } from "../logger";

/**
 * Encrypt a plain password. This method support async/await.
 * @param plainPassword the original plain text password
 * @return a promise with the ecrypted password
 */
export async function hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, 10);
}

/**
 * Verify that a plain password match with an encrypted hashPassword.
 * This method support async/await
 * @param plainPassword the plain text password
 * @param hashPassword the encrypted (or hashed) password
 * @return a promise, true if the two passwords match, false otherwise
 */
export async function verifyPassword(
    plainPassword: string,
    hashPassword: string
): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashPassword);
}

/**
 * Generate a new text plain password
 * @return a new generated password
 */
export function generatePassword() {
    return _generatePassword(6);
}

/**
 *  Enum with self-explanatories errors for the user login method
 */
export enum UserErrors {
    NOT_FOUND = 1,
    WRONG_PASSWORD
}

/**
 * Execute the login of a user, using the standard User Entity.
 * @param email the user email
 * @param password the plain text password
 * @return a promise, with an error if somethink goes wrong, or the user if the login was successul
 */
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

/**
 * Create a new cookie-based session for the user.
 * @param req the standard Express session
 * @param user the logged-in user
 */
export function createUserSession(req: Request, user: User) {
    (<any>req.session).user_id = user.id;
}

/**
 * Destoy (if any) the current user session.
 * @param req the standard Express session
 */
export function destroyUserSession(req: Request) {
    delete (<any>req.session).user_id;
}

/**
 * Retrieve the user from the current session
 * @param req the standard Express session
 * @return a promise, with the user if logged, or undefined
 */
export async function retrieveUserFromSession(
    req: Request
): Promise<User | undefined> {
    if (!req.session) {
        logger.error("No connection to REDIS!!!!");
        process.exit(2);
    }
    return User.findOneById((<any>req.session).user_id);
}
