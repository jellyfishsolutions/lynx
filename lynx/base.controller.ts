import * as express from "express";
import App from "./app";
import { FileOptions } from "./file.response";
import RenderResponse from "./render.response";
import RedirectResponse from "./redirect.response";
import UnauthorizedResponse from "./unauthorized.response";
import FileResponse from "./file.response";
import Request from "./request";
import { LynxControllerMetadata } from "./decorators";
import Media from "./entities/media.entity";

import {
    createTestAccount,
    createTransport,
    getTestMessageUrl,
    Transporter
} from "nodemailer";

let mailClient: Transporter;
let guard = false;
function syncronizedInit() {
    if (guard) return;
    guard = true;
    if (!mailClient) {
        try {
            createTestAccount((err, account) => {
                if (err) {
                    console.log(err);
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
            console.log(e);
        }
    }
}
/**
 * This class defines the basic class for any controllers. It implements a lot
 * of utility methods in order to correctly generate any response.
 */
export class BaseController {
    public app: App;
    private _metadata: LynxControllerMetadata;

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
    public render(
        view: string,
        req: express.Request,
        context?: any
    ): RenderResponse {
        if (!view.endsWith(".njk")) {
            view = view + ".njk";
        }
        if (!context) {
            context = {};
        }
        context.req = req;
        return new RenderResponse(view, context);
    }

    /**
     * Redirect the current route to another
     * @param routeName the new of the target route
     */
    public redirect(routeName: string): RedirectResponse {
        return new RedirectResponse(this.route(routeName));
    }

    /**
     * Generate a response suitable to file download. This method can also be
     * used to generate images of specific dimensions.
     * @param path the string path of the file, or a Media object to be downloaded
     * @param options options to correctly generate the output file
     */
    public download(path: string | Media, options?: FileOptions): FileResponse {
        if (path instanceof Media) {
            if (path.isDirectory) {
                throw new Error("unable to downlaod a directory");
            }
            let f = new FileResponse(path.path);
            f.contentType = path.mimetype;
            if (options) {
                f.options = options;
            }
            return f;
        }
        return new FileResponse(path);
    }

    /**
     * Generate an unauthorized response.
     */
    public unauthorized(): UnauthorizedResponse {
        return new UnauthorizedResponse();
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
                console.log("Preview URL: %s", getTestMessageUrl(result));

                return true;
            }
        } catch (e) {
            console.log(e);
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
