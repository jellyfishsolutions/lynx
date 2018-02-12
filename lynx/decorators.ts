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
    verifiers: Function[];
    name?: string;
}

export interface LynxControllerMetadata {
    controllerPath: string;
    routes: LynxRouteMetadata[];
}

let routes: LynxRouteMetadata[] = [];

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
    routes[routes.length - 1].verifiers.push(func);
}

export function GET(path: string) {
    return (target: any, method: any, _: any) => {
        setTarget(target, HttpVerb.GET, path, method);
    };
}

export function POST(path: string) {
    return (target: any, method: any, _: any) => {
        setTarget(target, HttpVerb.POST, path, method);
    };
}

export function PUT(path: string) {
    return (target: any, method: any, _: any) => {
        setTarget(target, HttpVerb.PUT, path, method);
    };
}

export function DELETE(path: string) {
    return (target: any, method: any, _: any) => {
        setTarget(target, HttpVerb.DELETE, path, method);
    };
}

export function PATCH(path: string) {
    return (target: any, method: any, _: any) => {
        setTarget(target, HttpVerb.PATCH, path, method);
    };
}

export function Body(name: string, schema: any) {
    return (target: any, _: any, __: any) => {
        setBody(target, name, schema);
    };
}

export function API() {
    return (target: any, _: any, __: any) => {
        setApi(target);
    };
}

export function MultipartForm() {
    return (target: any, _: any, __: any) => {
        setMultipartForm(target);
    };
}

export function Name(name: string) {
    return (_: any, __: any, ___: any) => {
        setName(name);
    };
}

export function Verify(func: Function) {
    return (target: any, _: any, __: any) => {
        setVerify(target, func);
    };
}

export function Middleware(path: string) {
    return (target: any) => {
        target.middlewarePath = path;
    };
}
