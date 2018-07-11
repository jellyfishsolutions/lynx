import * as fs from "fs";
import { app } from "./app";

export default interface UFS {
    unlink(path: string, cb: (err: Error) => void): void;
    stat(path: string): Promise<Stat>;
    getToCache(path: string, cachePath: string): Promise<string>;
    uploadFile(uploadMedia: Express.Multer.File): Promise<Express.Multer.File>;
}

export interface Stat {
    size: number;
}

export class LocalUFS implements UFS {
    unlink(path: string, cb: (err: Error) => void): void {
        fs.unlink(path, cb);
    }

    stat(path: string): Promise<Stat> {
        return new Promise<Stat>((res, rej) => {
            fs.stat(path, (err, r) => {
                if (err) {
                    return rej(err);
                }
                res(r);
            });
        });
    }

    getToCache(path: string, _: string): Promise<string> {
        return new Promise<string>((res, _) => {
            return res(app.config.uploadPath + "/" + path);
        });
    }

    uploadFile(uploadMedia: Express.Multer.File): Promise<Express.Multer.File> {
        return new Promise<Express.Multer.File>((res, _) => {
            return res(uploadMedia);
        });
    }
}
