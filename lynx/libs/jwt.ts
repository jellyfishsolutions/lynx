import { verify } from "jsonwebtoken";

export async function verifyJwtToken(token: string, secret: string) {
    return new Promise((resolve, reject) => {
        verify(token, secret, (err, decoded) => {
            if (err) return reject(err);
            return resolve(decoded);
        });
    });
}
