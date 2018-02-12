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

    async postConstructor() {}

    public route(name: string, parameters?: any): string {
        return this.app.route(name, parameters);
    }

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

    public redirect(routeName: string): RedirectResponse {
        return new RedirectResponse(this.route(routeName));
    }

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

    public unauthorized(): UnauthorizedResponse {
        return new UnauthorizedResponse();
    }

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

    public tr(str: string, req: Request): string {
        return this.app.translate(str, req);
    }
}
