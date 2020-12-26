import { App } from '..';
import BaseFilter from './base.filter';
import BaseFunction from './base.function';

let filteringFunctions = [] as { name: string; target: any }[];
let globalFunctions = [] as { name: string; target: any }[];

export function TemplateFilter(name: string) {
    return (target: any) => {
        filteringFunctions.push({
            name: name,
            target: target,
        });
    };
}

export function TemplateFunction(name: string) {
    return (target: any) => {
        globalFunctions.push({
            name: name,
            target: target,
        });
    };
}

export function initializeTemplating(app: App) {
    for (let pp of filteringFunctions) {
        let instance = new pp.target() as BaseFilter;
        app.nunjucksEnvironment.addFilter(pp.name, function () {
            let args = [] as any[];
            for (let i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            return instance.filter(arguments[0], ...args);
        });
    }

    for (let pp of globalFunctions) {
        let instance = new pp.target() as BaseFunction;
        app.nunjucksEnvironment.addGlobal(pp.name, function () {
            let args = [] as any[];
            for (let i = 0; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            return instance.execute(...args);
        });
    }
}
