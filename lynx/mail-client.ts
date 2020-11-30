import * as express from 'express';
import {
    createTestAccount,
    createTransport,
    getTestMessageUrl,
    Transporter,
} from 'nodemailer';
import { app } from './app';
import { logger } from './logger';

export interface MailClient {
    init(): Promise<void>;
    /**
     * Utility method to send emails from a controller.
     * This method is similar to the `sendMail` method, but define a lower level API.
     * Indeed, it directly accepts the text and the html of the email, and not the templates urls.
     * @param dest the email destination (can also be an array of addresses)
     * @param subject the subject of the email
     * @param text the text version of the email
     * @param html the html version of the email
     */
    sendRawMail(
        dest: string | string[],
        subject: string,
        text: string,
        html: string
    ): Promise<boolean>;
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
    sendMail(
        req: express.Request,
        dest: string | string[],
        subjectTemplateString: string,
        textTemplate: string,
        htmlTemplate: string,
        context: any
    ): Promise<boolean>;
}

export class NodemailerClient implements MailClient {
    constructor() {}

    private guard = false;
    private mailClient: Transporter;

    public async init(): Promise<void> {
        return new Promise((res, rej) => {
            if (this.guard) {
                return res();
            }
            this.guard = true;
            if (this.mailClient) {
                return res();
            }
            if (!app.config.mailer.host) {
                try {
                    createTestAccount((err, account) => {
                        if (err) {
                            logger.error(err);
                            this.guard = false;
                            return rej(err);
                        }
                        this.mailClient = createTransport({
                            host: 'smtp.ethereal.email',
                            port: 587,
                            secure: false, // true for 465, false for other ports
                            auth: {
                                user: account.user, // generated ethereal user
                                pass: account.pass, // generated ethereal password
                            },
                        });
                        this.guard = false;
                        return res();
                    });
                } catch (e) {
                    this.guard = false;
                    logger.error(e);
                    return rej(e);
                }
            } else {
                try {
                    this.mailClient = createTransport(app.config.mailer);
                    this.guard = false;
                    return res();
                } catch (e) {
                    this.guard = false;
                    logger.error(e);
                    return rej(e);
                }
            }
        });
    }

    public async sendRawMail(
        dest: string | string[],
        subject: string,
        text: string,
        html: string
    ): Promise<boolean> {
        let mailOptions = {
            from: app.config.mailer.sender, // sender address
            to: dest,
            subject: subject, // Subject line
            text: text, // plain text body
            html: html, // html body
        };
        try {
            let result = await this.mailClient.sendMail(mailOptions);
            if (result) {
                logger.debug('Preview URL: %s', getTestMessageUrl(result));
            }
            return true;
        } catch (e) {
            logger.error(e);
        }
        return false;
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

        let subject = app.nunjucksEnvironment.renderString(
            subjectTemplateString,
            context
        );

        if (!textTemplate.endsWith('.njk')) {
            textTemplate += '.njk';
        }
        if (!htmlTemplate.endsWith('.njk')) {
            htmlTemplate += '.njk';
        }
        let text = app.nunjucksEnvironment.render(textTemplate, context);
        let html = app.nunjucksEnvironment.render(htmlTemplate, context);

        return this.sendRawMail(dest, subject, text, html);
    }
}
