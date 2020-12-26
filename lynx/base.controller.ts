import * as express from 'express';
import App from './app';
import { FileOptions } from './file.response';
import RenderResponse from './render.response';
import RedirectResponse from './redirect.response';
import SkipResponse from './skip.response';
import UnauthorizedResponse from './unauthorized.response';
import FileResponse from './file.response';
import Request from './request';
import { LynxControllerMetadata } from './decorators';
import Media from './entities/media.entity';
import StatusError from './status-error';

import { logger } from './logger';
import Logger from './logger';
import XmlResponse from './xml.response';

export enum FlashType {
    primary,
    secondary,
    success,
    danger,
    warning,
    info,
    light,
    dark,
}

function mapFlashTypeToString(type: FlashType): string {
    switch (type) {
        case FlashType.primary:
            return 'primary';
        case FlashType.secondary:
            return 'secondary';
        case FlashType.success:
            return 'success';
        case FlashType.danger:
            return 'danger';
        case FlashType.warning:
            return 'warning';
        case FlashType.info:
            return 'info';
        case FlashType.light:
            return 'light';
        case FlashType.dark:
            return 'dark';
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
        if (!view.endsWith('.njk')) {
            view = view + '.njk';
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
            message: this.tr(msg.message, req),
        });
    }

    /**
     * Add a success flash message in the current request.
     * @param msg the string (can be localized) of the message
     * @param req the request
     */
    public addSuccessMessage(msg: string, req: Request) {
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
                throw new Error('unable to download a directory');
            }
            f = new FileResponse(path.fileName);
            f.contentType = path.mimetype;
            if (path.originalName) {
                f.fileName = path.originalName;
            }
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
     * Generate a response as an Xml file, but starting from a standard Nunjuks template.
     * This response is very similar to the standard render response. The main difference is the
     * the `contentType`, setted do `application/xml`.
     * Moreover, the flash messages are ignored.
     * @param view the name of the view
     * @param req the request object
     * @param context a plain object containing any necessary data needed by the view
     */
    public xml(view: string, req: Request, context?: any): XmlResponse {
        if (!view.endsWith('.njk')) {
            view = view + '.njk';
        }
        if (!context) {
            context = {};
        }
        context.req = req;
        for (let key in req.lynxContext) {
            context[key] = req.lynxContext[key];
        }
        return new XmlResponse(view, context);
    }

    /**
     * Utility method to send emails from a controller.
     * This method is similar to the `sendMail` method, but define a lower level API.
     * Indeed, it directly accepts the text and the html of the email, and not the templates urls.
     * @param dest the email destination (can also be an array of addresses)
     * @param subject the subject of the email
     * @param text the text version of the email
     * @param html the html version of the email
     */
    public async sendRawMail(
        dest: string | string[],
        subject: string,
        text: string,
        html: string
    ) {
        return this.app.mailClient.sendRawMail(dest, subject, text, html);
    }

    /**
     * Utility method to send an email from a controller. This method is async,
     * so use the await keyword (or eventually a promise) to correctly read the
     * return value.
     * This method uses the template engine to compile the email.
     * NOTE: internally, this method uses the `sendRawMail` method.
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
        return this.app.mailClient.sendMail(
            req,
            dest,
            subjectTemplateString,
            textTemplate,
            htmlTemplate,
            context
        );
    }

    /**
     * Utility method to obtain a translated string.
     * @param str the string key to be translated
     * @param req the original request
     */
    public tr(str: string, req: Request): string {
        return this.app.translate(str, req);
    }

    /**
     * Utility method to obtain a translated string, formatted with parameters.
     * Each parameter should be encoded as {0}, {1}, etc...
     * @param str the string key to be translated
     * @param req the original request
     * @param args the arguments to format the string
     */
    public trFormat(str: string, req: Request, ...args: any): string {
        let translated = this.tr(str, req);
        return this.format(translated, args);
    }

    private format(fmt: string, ...args: any) {
        if (
            !fmt.match(/^(?:(?:(?:[^{}]|(?:\{\{)|(?:\}\}))+)|(?:\{[0-9]+\}))+$/)
        ) {
            throw new Error('invalid format string.');
        }
        return fmt.replace(
            /((?:[^{}]|(?:\{\{)|(?:\}\}))+)|(?:\{([0-9]+)\})/g,
            (_, str, index) => {
                if (str) {
                    return str.replace(/(?:{{)|(?:}})/g, (m: string[]) => m[0]);
                } else {
                    if (index >= args.length) {
                        throw new Error(
                            'argument index is out of range in format'
                        );
                    }
                    return args[index];
                }
            }
        );
    }
}
