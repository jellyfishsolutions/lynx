import * as express from "express";
import App from "./app";
import { app } from "./app";
import { FileOptions } from "./file.response";
import RenderResponse from "./render.response";
import RedirectResponse from "./redirect.response";
import SkipResponse from "./skip.response";
import UnauthorizedResponse from "./unauthorized.response";
import FileResponse from "./file.response";
import Request from "./request";
import { LynxControllerMetadata } from "./decorators";
import Media from "./entities/media.entity";
import StatusError from "./status-error";

import {
    createTestAccount,
    createTransport,
    getTestMessageUrl,
    Transporter
} from "nodemailer";

import { logger } from "./logger";
import Logger from "./logger";

let mailClient: Transporter;
let guard = false;
function syncronizedInit() {
    if (guard) return;
    guard = true;
    if (!mailClient) {
        if (!app.config.mailer.host) {
            try {
                createTestAccount((err, account) => {
                    if (err) {
                        logger.error(err);
                        guard = false;
                        return;
                    }
                    mailClient = createTransport({
                        host: "smtp.ethereal.email",
                        port: 587,
                        secure: false, // true for 465, false for other ports
                        auth: {
                            user: account.user, // generated ethereal user
                            pass: account.pass // generated ethereal password
                        }
                    });
                    guard = false;
                });
            } catch (e) {
                guard = false;
                logger.error(e);
            }
        } else {
            try {
                mailClient = createTransport(app.config.mailer);
                guard = false;
            } catch (e) {
                guard = false;
                logger.error(e);
            }
        }
    }
}

export enum FlashType {
    primary,
    secondary,
    success,
    danger,
    warning,
    info,
    light,
    dark
}

function mapFlashTypeToString(type: FlashType): string {
    switch (type) {
        case FlashType.primary:
            return "primary";
        case FlashType.secondary:
            return "secondary";
        case FlashType.success:
            return "success";
        case FlashType.danger:
            return "danger";
        case FlashType.warning:
            return "warning";
        case FlashType.info:
            return "info";
        case FlashType.light:
            return "light";
        case FlashType.dark:
            return "dark";
    }
}

export interface FlashMessage {
    type: FlashType;
    message: string;
}

/**
 * This class defines the basic class for any controllers. It implements a lot
 * of utility methods in order to correctly generate any response.
 */
export class BaseController {
    public app: App;
    private _metadata: LynxControllerMetadata;
    public logger: Logger = logger;

    get metadata(): LynxControllerMetadata {
        return this._metadata;
    }

    constructor(app: App) {
        this.app = app;
        syncronizedInit();
    }

    /**
     * This method is called only when the constructed has been completed.
     * Since this method is async, it can be used to perform some initialization
     * that needed the use of the await keyword.  */
    async postConstructor() {}

    /**
     * Add a value to the current request context.
     * Any variable added with this method will available in the template context
     * thought the @method render method.
     * @param req the current Request
     * @param key the key of the value to add
     * @param value the value to add
     */
    public addToContext(req: Request, key: string, value: any) {
        if (!req.lynxContext) {
            req.lynxContext = {};
        }
        req.lynxContext[key] = value;
    }

    /**
     * Utility method to generate an error with a status code.
     * This method should be used instead of the usual throw new Error(msg).
     * In this way, a proper HTTP status code can be used (for example, 404 or 500),
     * instead of the default 400.
     * @param status the http status code to return
     * @param message the error message
     * @return a new @type StatusError object
     */
    public error(status: number, message: string): StatusError {
        let err = new StatusError(message);
        err.statusCode = status;
        return err;
    }

    /**
     * This method generate an url to a route starting from the route name and
     * optionally its parameters.
     * If a parameter not is used to generate the route url, it will be appended
     * as a query parameter.
     * @param name the name of the route
     * @param parameters a plain object containing the paramters for the route.
     */
    public route(name: string, parameters?: any): string {
        return this.app.route(name, parameters);
    }

    /**
     * Generate a web page starting from a template and using a generated context.
     * @param view the name of the view
     * @param req the request object
     * @param context a plain object containing any necessary data needed by the view
     */
    public render(view: string, req: Request, context?: any): RenderResponse {
        if (!view.endsWith(".njk")) {
            view = view + ".njk";
        }
        if (!context) {
            context = {};
        }
        context.req = req;
        context.flash = (req.session as any).sessionFlash;
        for (let key in req.lynxContext) {
            context[key] = req.lynxContext[key];
        }
        delete (req.session as any).sessionFlash;
        return new RenderResponse(view, context);
    }

    /**
     * Redirect the current route to another
     * @param routeName the new of the target route
     * @param routeParams a plain object containing the paramters for the route.
     */
    public redirect(routeName: string, routeParams?: any): RedirectResponse {
        return new RedirectResponse(this.route(routeName, routeParams));
    }

    /**
     * Add a flash message in the current request.
     * @param msg the FlashMessage to be included
     * @param req the request
     */
    public addFlashMessage(msg: FlashMessage, req: Request) {
        let session = req.session as any;
        if (!session.sessionFlash) {
            session.sessionFlash = [];
        }
        session.sessionFlash.push({
            type: mapFlashTypeToString(msg.type),
            message: this.tr(msg.message, req)
        });
    }

    /**
     * Add a success flash message in the current request.
     * @param msg the string (can be localized) of the message
     * @param req the request
     */
    public addSuccessMessagge(msg: string, req: Request) {
        this.addFlashMessage({ type: FlashType.success, message: msg }, req);
    }

    /**
     * Add an error flash message in the current request.
     * @param msg the string (can be localized) of the message
     * @param req the request
     */
    public addErrorMessage(msg: string, req: Request) {
        this.addFlashMessage({ type: FlashType.danger, message: msg }, req);
    }

    /**
     * Generate a response suitable to file download. This method can also be
     * used to generate images of specific dimensions.
     * @param path the string path of the file, or a Media object to be downloaded
     * @param options options to correctly generate the output file
     */
    public download(path: string | Media, options?: FileOptions): FileResponse {
        let f: FileResponse;
        if (path instanceof Media) {
            if (path.isDirectory) {
                throw new Error("unable to download a directory");
            }
            f = new FileResponse(path.fileName);
            f.contentType = path.mimetype;
        } else {
            f = new FileResponse(path);
        }
        if (options) {
            f.options = options;
        }
        return f;
    }

    /**
     * Generate an unauthorized response.
     */
    public unauthorized(): UnauthorizedResponse {
        return new UnauthorizedResponse();
    }

    /**
     * Generate a skip resopnse. In this particuar case, the original Express `next()`
     * will be executed, causing the controller chain to continue its execution.
     */
    public next(): SkipResponse {
        return new SkipResponse();
    }

    /**
     * Utility method to send an email from a controller. This method is async,
     * so use the await keyword (or eventually a promise) to correctly read the
     * return value.
     * This method uses the template engine to compile the email.
     * @param req the current request
     * @param dest the email destination (can also be an array of addresses)
     * @param subjectTemplateString the subject of the email, that can also be a string template
     * @param textTemplate the text version of the email, referencing a path in the view folders
     * @param htmlTemplate the html version of the email, referencing a path in the view folders
     * @param context a plain object containing any necessary data needed by the view
     */
    public async sendMail(
        req: express.Request,
        dest: string | string[],
        subjectTemplateString: string,
        textTemplate: string,
        htmlTemplate: string,
        context: any
    ): Promise<boolean> {
        if (!context) {
            context = {};
        }
        context.req = req;

        let subject = this.app.nunjucksEnvironment.renderString(
            subjectTemplateString,
            context
        );

        if (!textTemplate.endsWith(".njk")) {
            textTemplate += ".njk";
        }
        if (!htmlTemplate.endsWith(".njk")) {
            htmlTemplate += ".njk";
        }
        let text = this.app.nunjucksEnvironment.render(textTemplate, context);
        let html = this.app.nunjucksEnvironment.render(htmlTemplate, context);

        let mailOptions = {
            from: this.app.config.mailer.sender, // sender address
            to: dest,
            subject: subject, // Subject line
            text: text, // plain text body
            html: html // html body
        };
        try {
            let result = await mailClient.sendMail(mailOptions);
            if (result) {
                logger.debug("Preview URL: %s", getTestMessageUrl(result));

                return true;
            }
        } catch (e) {
            logger.error(e);
        }
        return false;
    }

    /**
     * Utility method to obtain a translated string.
     * @param str the string key to be transalted
     * @param req the original request
     */
    public tr(str: string, req: Request): string {
        return this.app.translate(str, req);
    }
}
