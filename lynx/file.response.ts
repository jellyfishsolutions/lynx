import { Request as ERequest, Response as EResponse } from "express";
import Response from "./response";
import * as sharp from "sharp";

export interface FileOptions {
    width: number;
    height?: number;
}

export default class FileResponse extends Response {
    private path: string;
    private _contentType?: string;
    private _options?: FileOptions;
    constructor(path: string) {
        super();
        this.path = path;
    }

    set contentType(value: string) {
        this._contentType = value;
    }

    set options(value: FileOptions) {
        this._options = value;
    }

    performResponse(req: ERequest, res: EResponse) {
        if (this._contentType) {
            res.contentType(this._contentType);
        }
        if (this._options) {
            if (!this._options.height) {
                sharp(this.path)
                    .resize(this._options.width)
                    .toBuffer()
                    .then(buff => {
                        res.send(buff);
                        res.end();
                    })
                    .catch(err => {
                        throw err;
                    });
            } else if (this._options.width && this._options.height) {
                sharp(this.path)
                    .resize(this._options.width, this._options.height)
                    .crop(sharp.gravity.centre)
                    .toBuffer()
                    .then(buff => {
                        res.send(buff);
                        res.end();
                    })
                    .catch(err => {
                        throw err;
                    });
            }
            return;
        }
        res.download(this.path);
    }
}
