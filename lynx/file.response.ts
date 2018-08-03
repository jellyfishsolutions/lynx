import { Request as ERequest, Response as EResponse } from "express";
import AsyncResponse from "./async.response";
import * as sharp from "sharp";
import * as fs from "fs";
import { app } from "./app";

function fileExsists(path: string): Promise<boolean> {
    return new Promise<boolean>((res, _) => {
        fs.exists(path, val => {
            res(val);
        });
    });
}

function saveToCache(path: string, s: sharp.SharpInstance) {
    if (!app.config.chachingImages) {
        return;
    }
    s.withMetadata()
        .toFile(path)
        .catch(err => console.error(err));
}

/**
 * This interface defines the currently available options for files.
 */
export interface FileOptions {
    width: number;
    height?: number;
}
/**
 * Generation of a File response.
 */
export default class FileResponse extends AsyncResponse {
    private path: string;
    private _contentType?: string;
    private _options?: FileOptions;
    constructor(path: string) {
        super();
        this.path = path;
    }

    /**
     * Set the content type of the response.
     * @param value the content type
     */
    set contentType(value: string) {
        this._contentType = value;
    }

    /**
     * Set the file options, to correctly generate the response.
     * @param value the FileOptions
     */
    set options(value: FileOptions) {
        this._options = value;
    }

    /**
     * Generation of the response.
     * This method can eventually perform some transformation on output if a
     * FileOptions was specified.
     */
    async asyncResponse(_: ERequest, res: EResponse): Promise<void> {
        if (this._contentType) {
            res.contentType(this._contentType);
        }
        let path = await app.config.ufs.getToCache(
            this.path,
            app.config.cachePath
        );

        if (!this._options) {
            return res.download(path);
        }

        let cachePath = path + "_" + JSON.stringify(this._options);
        if (await fileExsists(cachePath)) {
            return res.download(cachePath);
        }

        let s: sharp.SharpInstance = {} as sharp.SharpInstance;
        let hasSharp = false;
        if (!this._options.height) {
            s = sharp(path).resize(this._options.width);
            hasSharp = true;
        }
        if (this._options.width && this._options.height) {
            hasSharp = true;
            s = sharp(path)
                .resize(this._options.width, this._options.height)
                .crop(sharp.gravity.centre);
        }
        if (hasSharp) {
            let buff = await s.toBuffer();
            res.send(buff);
            res.end();
            saveToCache(cachePath, s);
            return;
        }

        res.download(path);
    }
}
