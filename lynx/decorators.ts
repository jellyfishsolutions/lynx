import { HttpVerb } from "./http-verb";

export interface LynxRouteBody {
    name: string;
    schema: any;
}

export interface LynxRouteMetadata {
    type: HttpVerb;
    path: string;
    method: any;
    body?: LynxRouteBody;
    isAPI: boolean;
    isMultipartForm: boolean;
    verifiers: { fun: Function; isAsync: boolean }[];
    name?: string;
}

export interface LynxControllerMetadata {
    controllerPath: string;
    routes: LynxRouteMetadata[];
}

let routes: LynxRouteMetadata[] = [];

/**
 * Decorator to set the base route of a controller.
 * @param path the route path for the controller.
 */
export function Route(path: string) {
    return (target: any) => {
        target.controllerPath = path;
        target.routes = routes;
        routes = [];
    };
}

function setTarget(_: any, type: HttpVerb, path: string, method: any) {
    routes.push({
        type: type,
        path: path,
        method: method,
        body: undefined,
        isAPI: false,
        isMultipartForm: false,
        verifiers: []
    });
}

function setBody(_: any, name: string, schema: any) {
    if (!routes) return;
    routes[routes.length - 1].body = {
        name: name,
        schema: schema
    };
}

function setApi(_: any) {
    if (!routes) return;
    routes[routes.length - 1].isAPI = true;
}

function setMultipartForm(_: any) {
    if (!routes) return;
    routes[routes.length - 1].isMultipartForm = true;
}

function setName(name: string) {
    if (!routes) return;
    routes[routes.length - 1].name = name;
}

function setVerify(_: any, func: Function) {
    if (!routes) return;
    routes[routes.length - 1].verifiers.push({ fun: func, isAsync: false });
}

function setAsyncVerify(_: any, func: Function) {
    if (!routes) return;
    routes[routes.length - 1].verifiers.push({ fun: func, isAsync: true });
}

/**
 * Set the decorated method to a GET endpoint with the specified path.
 * @param path the endpoint path
 */
export function GET(path: string) {
    return (target: any, method: any, _: any) => {
        setTarget(target, HttpVerb.GET, path, method);
    };
}

/**
 * Set the decorated method to a POST endpoint with the specified path.
 * @param path the endpoint path
 */
export function POST(path: string) {
    return (target: any, method: any, _: any) => {
        setTarget(target, HttpVerb.POST, path, method);
    };
}

/**
 * Set the decorated method to a PUT endpoint with the specified path.
 * @param path the endpoint path
 */
export function PUT(path: string) {
    return (target: any, method: any, _: any) => {
        setTarget(target, HttpVerb.PUT, path, method);
    };
}

/**
 * Set the decorated method to a DELETE endpoint with the specified path.
 * @param path the endpoint path
 */
export function DELETE(path: string) {
    return (target: any, method: any, _: any) => {
        setTarget(target, HttpVerb.DELETE, path, method);
    };
}

/**
 * Set the decorated method to a PATH endpoint with the specified path.
 * @param path the endpoint path
 */
export function PATCH(path: string) {
    return (target: any, method: any, _: any) => {
        setTarget(target, HttpVerb.PATCH, path, method);
    };
}

/**
 * Add to the decorated method a body to be injected. The body will be validated
 * using the specified schema.
 * @param name the name of the argument in the method to map the body
 * @param schema a JOI schema to validate the body object
 */
export function Body(name: string, schema: any) {
    return (target: any, _: any, __: any) => {
        setBody(target, name, schema);
    };
}

/**
 * Set the decorated method to an API endpoints.
 * In this way, the returned value of the method will be encapsulated in a
 * standard API envelope and serialized to JSON using the Lynx serialization system.
 */
export function API() {
    return (target: any, _: any, __: any) => {
        setApi(target);
    };
}

/**
 * Set the decorated method to accept MultipartForm requested.
 */
export function MultipartForm() {
    return (target: any, _: any, __: any) => {
        setMultipartForm(target);
    };
}

/**
 * Add to the decorated method a route name, in order to easely generate redirect
 * or, more general, the execution of the `route` method.
 * @param name the name of the route
 */
export function Name(name: string) {
    return (_: any, __: any, ___: any) => {
        setName(name);
    };
}

/**
 * Add to the decorated method a verification function that will be executed
 * BEFORE the route. The function must NOT be an async function, and it shell
 * return a boolean value. If true is returned, the method is then executed.
 * This method is fundamental to implement authorization to a single endpoint.
 * NOTE: this is the sync version of the AsyncVerify decorator.
 * @param func the verification function to be executed. It must NOT be an async function, and return a boolean value.
 */
export function Verify(func: Function) {
    return (target: any, _: any, __: any) => {
        setVerify(target, func);
    };
}

/**
 * Add to the decorated method a verification function that will be executed
 * BEFORE the route. The function must NOT be an async function, and it shell
 * return a boolean value. If true is returned, the method is then executed.
 * This method is fundamental to implement authorization to a single endpoint.
 * NOTE: this is the async version of the Verify decorator.
 * @param func the verification function to be executed. It MUST BE an async function, and return a boolean value.
 */
export function AsyncVerify(func: Function) {
    return (target: any, _: any, __: any) => {
        setAsyncVerify(target, func);
    };
}

/**
 * Add to the decorated class a path to be executed as middleware.
 * @param path the endpoint path
 */
export function Middleware(path: string) {
    return (target: any) => {
        target.middlewarePath = path;
    };
}
