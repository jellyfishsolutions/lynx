import { Request as ERequest, Response as EResponse } from 'express';
import AsyncResponse from './async.response';
import * as Jimp from 'jimp';
import * as fs from 'fs';
import { app } from './app';
import logger from './logger';

function fileExists(path: string): Promise<boolean> {
    return new Promise<boolean>((res, _) => {
        fs.exists(path, (val) => {
            res(val);
        });
    });
}

function saveToCache(path: string, s: Jimp) {
    if (!app.config.cachingImages) {
        return;
    }
    s.writeAsync(path).catch((err) => logger.shared.error(err));
}

function saveBuffToCache(path: string, buff: Buffer) {
    if (!app.config.cachingImages) {
        return;
    }
    fs.writeFile(path, buff, (err) => {
        logger.shared.error(err);
    });
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
    private readonly path: string;
    private _contentType?: string;
    private _fileName: string;
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
     * Set the name of the file to download
     * @param value the name of the file
     */
    set fileName(value: string) {
        this._fileName = value;
    }

    /**
     * Set the file options, to correctly generate the response.
     * @param value the FileOptions
     */
    set options(value: FileOptions) {
        this._options = value;
    }

    private download(res: EResponse, path: string) {
        if (this._fileName) {
            return res.download(path, this._fileName);
        }
        res.download(path);
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
            return this.download(res, path);
        }

        let cachePath = path + '_' + JSON.stringify(this._options);
        if (await fileExists(cachePath)) {
            return this.download(res, cachePath);
        }

        if (!(await fileExists(path))) {
            res.status(404);
            res.end();
            return;
        }

        if (
            app.customResizeFunction != null &&
            (this._options.height || this._options.width)
        ) {
            let buff = await app.customResizeFunction(path, this._options);
            res.send(buff);
            res.end();
            saveBuffToCache(cachePath, buff);
            return;
        }
        let img = {} as Jimp;
        let hasProcessing = false;
        if (!this._options.height) {
            img = await Jimp.read(path);
            img = img.resize(this._options.width, Jimp.AUTO);
            hasProcessing = true;
        }
        if (this._options.width && this._options.height) {
            hasProcessing = true;
            img = await Jimp.read(path);
            img = img.resize(this._options.width, this._options.height);
        }
        if (hasProcessing) {
            let buff = await (img as Jimp).getBufferAsync(
                this._contentType as string
            );
            res.send(buff);
            res.end();
            saveToCache(cachePath, img);
            return;
        }
        this.download(res, path);
    }
}
