import * as Joi from "joi";

import * as itErrors from "./locale/joi_it";

/**
 * SchemaBuilder for the Joi validator.
 * It exposes some facility methods for some simple task,
 * and it also allows a complete personalization of the final result.
 */
export class SchemaBuilder {
    keys: any;
    lastKey: string;
    constructor() {
        this.keys = {};
    }

    /**
     * Generate the final Joi Object Schema
     */
    build(): Joi.ObjectSchema {
        return Joi.object().keys(this.keys);
    }

    /**
     * General method, that can be used with the Joi functions
     */
    general(key: string, spec: any): SchemaBuilder {
        this.keys[key] = spec;
        this.lastKey = key;
        return this;
    }

    /**
     * Add an optional string to the Schema
     * @param key the key
     * @param min minimum length of the string
     * @param max maximum length of the string
     * @return the schema builder
     */
    stringOptional(key: string, min?: number, max?: number): SchemaBuilder {
        let tmp = Joi.string();
        if (min !== undefined) {
            tmp = tmp.min(min);
        } else {
            tmp = tmp.allow("");
        }
        if (max !== undefined) {
            tmp = tmp.max(max);
        }
        this.keys[key] = tmp;
        this.lastKey = key;
        return this;
    }

    /**
     * Add a required string to the Schema
     * @param key the key
     * @param min minimum length of the string
     * @param max maximum length of the string
     * @return the schema builder
     */
    string(key: string, min?: number, max?: number): SchemaBuilder {
        this.stringOptional(key, min, max);
        this.keys[key] = this.keys[key].required();
        this.lastKey = key;
        return this;
    }

    /**
     * Add a required email to the Schema
     * @param key the key
     * @return the schema builder
     */
    email(key: string): SchemaBuilder {
        this.keys[key] = Joi.string()
            .email()
            .required();
        this.lastKey = key;
        return this;
    }

    /**
     * Add an optional email to the Schema
     * @param key the key
     * @return the schema builder
     */
    emailOptional(key: string): SchemaBuilder {
        this.keys[key] = Joi.string().email();
        this.lastKey = key;
        return this;
    }

    /**
     * Add a required password to the Schema.
     * The password will be validated using the following regex:
     * ^[0-9a-zA-Z\|\!\"\£\$\%\&\/\(\)\=\?\^\,\;\.\:\-\_\\\~]{6,}$
     * @param key the key
     * @return the schema builder
     */
    password(key: string): SchemaBuilder {
        this.keys[key] = Joi.string()
            .regex(
                /^[0-9a-zA-Z\|\!\"\£\$\%\&\/\(\)\=\?\^\,\;\.\:\-\_\\\~]{6,}$/
            )
            .required();
        return this;
    }

    /**
     * Add an optional password to the Schema.
     * The password will be validated using the following regex:
     * ^[0-9a-zA-Z\|\!\"\£\$\%\&\/\(\)\=\?\^\,\;\.\:\-\_\\\~]{6,}$
     * @param key the key
     * @return the schema builder
     */
    passwordOptional(key: string): SchemaBuilder {
        this.keys[key] = Joi.string().regex(
            /^[0-9a-zA-Z\|\!\"\£\$\%\&\/\(\)\=\?\^\,\;\.\:\-\_\\\~]{6,}$/
        );
        return this;
    }

    /**
     * Add an optional number to the Schema
     * @param key the key
     * @param min minimum value of the number
     * @param max maximum value of the number
     * @return the schema builder
     */
    numberOptional(key: string, min?: number, max?: number): SchemaBuilder {
        let tmp = Joi.number();
        if (min !== undefined) {
            tmp = tmp.min(min);
        }
        if (max !== undefined) {
            tmp = tmp.max(max);
        }
        this.keys[key] = tmp;
        this.lastKey = key;
        return this;
    }

    /**
     * Add a required number to the Schema
     * @param key the key
     * @param min minimum value of the number
     * @param max maximum value of the number
     * @return the schema builder
     */
    number(key: string, min?: number, max?: number): SchemaBuilder {
        this.numberOptional(key, min, max);
        this.keys[key] = this.keys[key].required();
        this.lastKey = key;
        return this;
    }

    /**
     * Add an optional integer number to the Schema
     * @param key the key
     * @param min minimum value of the number
     * @param max maximum value of the number
     * @return the schema builder
     */
    integerOptional(key: string, min?: number, max?: number): SchemaBuilder {
        let tmp = Joi.number().integer();
        if (min !== undefined) {
            tmp = tmp.min(min);
        }
        if (max !== undefined) {
            tmp = tmp.max(max);
        }
        this.keys[key] = tmp;
        this.lastKey = key;
        return this;
    }

    /**
     * Add a required integer number to the Schema
     * @param key the key
     * @param min minimum value of the number
     * @param max maximum value of the number
     * @return the schema builder
     */
    integer(key: string, min?: number, max?: number): SchemaBuilder {
        this.integerOptional(key, min, max);
        this.keys[key] = this.keys[key].required();
        this.lastKey = key;
        return this;
    }

    /**
     * Add an optional date to the Schema
     * @param key the key
     * @return the schema builder
     */
    dateOptional(key: string): SchemaBuilder {
        this.keys[key] = Joi.date();
        this.lastKey = key;
        return this;
    }

    /**
     * Add a required date to the Schema
     * @param key the key
     * @return the schema builder
     */
    date(key: string): SchemaBuilder {
        this.keys[key] = Joi.date().required();
        this.lastKey = key;
        return this;
    }

    /**
     * Add the label to the last added key
     * @param label the label to use in case of error
     * @return the schema builder
     */
    withLabel(label: string): SchemaBuilder {
        if (this.lastKey) {
            this.keys[this.lastKey] = this.keys[this.lastKey].label(label);
        }
        return this;
    }
}

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
        if (this.isValid) {
            return errors;
        }
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
