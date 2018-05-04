import * as moment from "moment";
import * as colors from "colors/safe";

export enum Level {
    error = 0,
    warn = 1,
    info = 2,
    verbose = 3,
    debug = 4,
    silly = 5
}

export default class Logger {
    private static self: Logger;

    public static get shared() {
        if (!Logger.self) {
            Logger.self = new Logger();
        }
        return Logger.self;
    }

    private constructor() {}

    private level: Level = Level.debug;

    private get head(): string {
        let now = moment();
        let d = now.format("YYYY-MM-DD HH:mm:ss");
        return "[" + d + "] ";
    }

    public log(msg: any, ...optionalParameters: any[]) {
        this.info(msg, optionalParameters);
    }

    public error(msg: any, ...optionalParameters: any[]) {
        if (this.level < Level.error) {
            return;
        }
        if (optionalParameters.length > 0) {
            console.error(colors.red(this.head + msg), optionalParameters);
        } else {
            console.error(colors.red(this.head + msg));
        }
    }

    public warn(msg: any, ...optionalParameters: any[]) {
        if (this.level < Level.warn) {
            return;
        }
        if (optionalParameters.length > 0) {
            console.warn(colors.yellow(this.head + msg), optionalParameters);
        } else {
            console.warn(colors.yellow(this.head + msg));
        }
    }

    public info(msg: any, ...optionalParameters: any[]) {
        if (this.level < Level.info) {
            return;
        }
        if (optionalParameters.length > 0) {
            console.info(this.head + msg, optionalParameters);
        } else {
            console.info(this.head + msg);
        }
    }

    public verbose(msg: any, ...optionalParameters: any[]) {
        if (this.level < Level.verbose) {
            return;
        }
        if (optionalParameters.length > 0) {
            console.log(this.head + msg, optionalParameters);
        } else {
            console.log(this.head + msg);
        }
    }

    public debug(msg: any, ...optionalParameters: any[]) {
        if (this.level < Level.debug) {
            return;
        }
        if (optionalParameters.length > 0) {
            console.debug(this.head + msg, optionalParameters);
        } else {
            console.debug(this.head + msg);
        }
    }

    public silly(msg: any, ...optionalParameters: any[]) {
        if (this.level < Level.silly) {
            return;
        }
        if (optionalParameters.length > 0) {
            console.log(this.head + msg, optionalParameters);
        } else {
            console.log(this.head + msg);
        }
    }
}

let logger = Logger.shared;

export { logger };
