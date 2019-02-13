import * as express from "express";
import App from "./app";
import SkipResponse from "./skip.response";
import { ValidateObject } from "./validate-object";
import { HttpVerb } from "./http-verb";
import { LynxControllerMetadata, LynxRouteMetadata } from "./decorators";
import { BaseMiddleware, BLOCK_CHAIN } from "./base.middleware";

import { logger } from "./logger";

function retrieveArgumentsNamesFromRoute(path: string) {
    const args = [];
    const parts = path.split("/");
    for (let part of parts) {
        if (part.startsWith(":")) {
            let arg = part.substring(1, part.length);
            let endIndex = arg.indexOf("(");
            if (endIndex != -1) {
                arg = arg.substring(0, endIndex);
            }
            args.push(arg);
        }
    }
    return args;
}

function generateStandardCallback(controller: any, route: LynxRouteMetadata) {
    return async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        if (route.verifiers) {
            for (let verify of route.verifiers) {
                let passed = true;
                if (verify.isAsync) {
                    passed = await verify.fun(req, res);
                } else {
                    if (verify.fun) {
                        passed = verify.fun(req, res);
                    } else {
                        try {
                            passed = (verify as any)(req, res);
                        } catch(e) {
                            logger.error(e);
                        }
                    }
                }
                if (!passed) {
                    return next();
                }
            }
        }

        if (!controller._hasBeenInit) {
            await controller.postConstructor();
        }

        let f = controller[route.method];
        let argsNames = retrieveArgumentsNamesFromRoute(route.path);
        let argsValues = [];
        for (let arg of argsNames) {
            argsValues.push(req.params[arg]);
        }
        if (route.body != null) {
            let b = req.body;
            if (route.body.schema) {
                b = new ValidateObject(
                    b,
                    route.body.schema,
                    req.acceptsLanguages()
                );
            }
            argsValues.push(b);
        }
        argsValues.push(req);
        argsValues.push(res);
        controller._ctxMap = {};
        f.apply(controller, argsValues)
            .then((r: any) => {
                if (route.isAPI) {
                    if (typeof r === "boolean") {
                        return res.send({ success: r });
                    }
                    if (r.serialize) {
                        r = r.serialize();
                    }
                    return res.send({ success: true, data: r });
                } else {
                    if (r instanceof SkipResponse) {
                        r.performResponse(req, res);
                        return next();
                    }
                    if (r.performResponse) {
                        return r.performResponse(req, res);
                    }
                    res.send(r);
                }
            })
            .catch((error: Error) => {
                logger.info(error);
                let status = 400;
                let e = error as any;
                if (e.statusCode) {
                    status = e.statusCode;
                }
                if (route.isAPI) {
                    if (!res.headersSent) {
                        res.status(status);
                    }
                    res.send({
                        success: false,
                        error: error.message
                    });
                } else {
                    if (!res.headersSent) {
                        res.status(status);
                    }
                    next(error);
                }
            });
    };
}

export function generateRouter(
    app: App,
    controller: any,
    originalController: LynxControllerMetadata,
    routes: any
): express.Router {
    const router = express.Router();

    for (let route of originalController.routes) {
        let func: Function;
        switch (route.type) {
            case HttpVerb.GET:
                func = router.get;
                break;
            case HttpVerb.POST:
                func = router.post;
                break;
            case HttpVerb.PUT:
                func = router.put;
                break;
            case HttpVerb.DELETE:
                func = router.delete;
                break;
            case HttpVerb.PATCH:
                func = router.patch;
                break;
            default:
                throw new Error(
                    "The decoration type for the method " +
                        route.method +
                        " is invalid"
                );
        }
        if (route.name) {
            routes[route.name] = (
                originalController.controllerPath +
                "/" +
                route.path
            ).replace(/\/\/+/g, "/");
        }
        const callback = generateStandardCallback(controller, route);
        if (route.isMultipartForm) {
            func.call(router, route.path, app.upload.any(), callback);
        } else {
            func.call(router, route.path, callback);
        }
    }

    return router;
}

export function useController(
    app: App,
    Controller: LynxControllerMetadata,
    routes: any
) {
    if (!Controller.controllerPath) {
        throw new Error(
            'You should decorate the "' +
                (<any>Controller).name +
                '" class in order to use it'
        );
    }
    const controller = new (<any>Controller)(app);
    controller._metadata = Controller;
    const router = generateRouter(app, controller, Controller, routes);
    app.express.use(Controller.controllerPath, router);
}

function generateMiddlewareCallback(middleware: BaseMiddleware) {
    return (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        let f = middleware.apply;
        let argsValues = [];
        argsValues.push(req);
        argsValues.push(res);
        f.apply(middleware, argsValues)
            .then((r: any) => {
                if (r === BLOCK_CHAIN) {
                    return;
                }
                next();
            })
            .catch((error: Error) => {
                logger.info(error);
                let status = 400;
                let e = error as any;
                if (e.statusCode) {
                    status = e.statusCode;
                }
                res.status(status).send(error);
            });
    };
}

function generateMiddlewares(
    app: App,
    middleware: BaseMiddleware,
    path: string
) {
    const callback = generateMiddlewareCallback(middleware);
    app.express.use(path, callback);
}

export function useMiddleware(app: App, Middleware: any) {
    if (!Middleware.middlewarePath) {
        throw new Error(
            'You should use at least one Middleware() decorator to a method of the "' +
                Middleware.name +
                '" class.'
        );
    }
    const middleware = new Middleware(app);
    generateMiddlewares(
        app,
        middleware as BaseMiddleware,
        Middleware.middlewarePath
    );
}
