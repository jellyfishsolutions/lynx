import * as Joi from "joi";

import * as itErrors from "./locale/joi_it";

/**
 * Contains the name of the error and a localized error message.
 */
export interface ValidationError {
    name: string;
    message: string;
}

/**
 * This class is used to validate an object using a given schema.
 * It is used by Lynx to automatically validate the body of any requests, using
 * the Body decodator.
 */
export class ValidateObject<T> {
    private _obj: T;
    private schema: Joi.Schema;
    private valid: Joi.ValidationResult<any>;

    /**
     * @param obj the object to validate
     * @param schema the schema
     * @param locales an array of available language. You can use the `req.acceptsLanguages()`
     */
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

    /**
     * Verify that the object rescpect the schema.
     * @return true if the object is valid, false otherwise.
     */
    get isValid() {
        return this.valid.error === null;
    }

    /**
     * Unwrap the object (can be valid or not!)
     * @return the unwrapped object
     */
    get obj() {
        return this._obj;
    }

    /**
     * Getter that returns an array of validation errors.
     * @return an array of validation errors. It can not be null.
     */
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

    /**
     * Getter that returns a map of errors. This prop contains the save information
     * as the `errors` prop, but with a different format.
     * @return a map or loclaized errors.
     */
    get errorsMap(): any {
        let map: any = {};
        for (let err of this.errors) {
            map[err.name] = err.message;
        }
        return map;
    }
}
