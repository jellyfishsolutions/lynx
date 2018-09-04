import * as fs from "fs";
import { app } from "./app";

export default interface UFS {
    unlink(path: string, cb: (err: Error) => void): void;
    stat(path: string): Promise<Stat>;
    getToCache(path: string, cachePath: string): Promise<string>;
    uploadFile(uploadMedia: any): Promise<any>;
    uploadFileFromCache(path: string, cachePath: string): Promise<void>;
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
            fs.stat(app.config.uploadPath + "/" + path, (err, r) => {
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

    uploadFile(uploadMedia: any): Promise<any> {
        return new Promise<any>((res, _) => {
            return res(uploadMedia);
        });
    }

    uploadFileFromCache(path: string, cachePath: string): Promise<void> {
        return new Promise<void>((res, rej) => {
            fs.copyFile(
                cachePath + "/" + path,
                app.config.uploadPath + "/" + path,
                err => {
                    if (err) {
                        return rej(err);
                    }
                    return res();
                }
            );
        });
    }
}
