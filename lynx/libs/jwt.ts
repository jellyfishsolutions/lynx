import { verify } from "jsonwebtoken";

/**
 * Token verification. It wraps the jsonwebtoken library
 * @param token the token to verify and decode
 * @param sectet the secret necessary to decode the token
 * @return the decoded token, or an error.
 */
export async function verifyJwtToken(token: string, secret: string) {
    return new Promise((resolve, reject) => {
        verify(token, secret, (err, decoded) => {
            if (err) return reject(err);
            return resolve(decoded);
        });
    });
}
