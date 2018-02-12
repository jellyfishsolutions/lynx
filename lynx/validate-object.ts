import * as Joi from "joi";

import * as itErrors from "./locale/joi_it";

export interface ValidationError {
    name: string;
    message: string;
}

export class ValidateObject<T> {
    private _obj: T;
    private schema: Joi.Schema;
    private valid: Joi.ValidationResult<any>;

    constructor(obj: any, schema: Joi.Schema, locales: string[]) {
        this._obj = obj;
        this.schema = schema;
        let options = null;
        for (let locale of locales) {
            if (locale.indexOf("en") != -1) {
                break;
            }
            if (locale == "it") {
                options = {
                    language: itErrors.errors
                };
                break;
            }
        }
        this.validate(options);
    }

    private validate(options: any) {
        this.valid = Joi.validate(this._obj, this.schema, options);
    }

    get isValid() {
        return this.valid.error === null;
    }

    get obj() {
        return this._obj;
    }

    get errors(): ValidationError[] {
        let errors: ValidationError[] = [];
        for (let err of this.valid.error.details) {
            errors.push({
                name: err.context && err.context.key ? err.context.key : "",
                message: err.message
            });
        }
        return errors;
    }
}
