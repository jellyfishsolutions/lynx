import { GraphQLSchema } from "graphql";
import { EntityMetadata } from "./decorators";
import * as fs from "fs";
import * as pluralize from "pluralize";
import { getRepository } from "typeorm";
import { makeExecutableSchema } from "graphql-tools";
const graphqlFields = require("graphql-fields");

import { logger } from "../logger";

export function generateSchema(entitiesPaths: string[]): GraphQLSchema {
    let data: { entity: any; meta: EntityMetadata }[] = [];

    for (let path of entitiesPaths) {
        if (path.endsWith("/*.entity.js")) {
            path = path.substring(0, path.length - "/*.entity.js".length);
        }
        if (!fs.existsSync(path)) {
            continue;
        }
        const files = fs.readdirSync(path);
        for (let index in files) {
            if (files[index].endsWith("ts")) continue;
            const entity = require(path + "/" + files[index]).default;
            if (!entity) {
                continue;
            }
            if (entity.graphQL && entity.graphQL.hasGraphQL) {
                data.push({ entity: entity, meta: entity.graphQL });
            }
        }
    }

    var queries = "";
    var mutators = "";
    var schemas = "";
    let resolvers: any = { Query: {}, Mutation: {} };
    let dbNames: String[] = [];
    for (let d of data) {
        let inputType = "";
        let cName = d.meta.className.toLowerCase();
        if (dbNames.indexOf(d.meta.className) != -1) {
            logger.warn(
                "The entity " +
                    cName +
                    " reference to " +
                    d.meta.className +
                    " tables, which is already mapped!"
            );
            continue;
        }
        dbNames.push(d.meta.className);
        let queryName = pluralize(cName);
        queryName =
            "findAll" +
            queryName.substring(0, 1).toUpperCase() +
            queryName.substring(1);
        var schemaType = `type ${d.meta.className} {\n`;
        queries += `\t${queryName}(`;
        inputType = `input ${d.meta.className}Input {\n`;
        for (let i = 0; i < d.meta.fields.length; i++) {
            let field = d.meta.fields[i];
            schemaType += `\t${field.name}: ${mapType(field.type)}\n`;
            if (field.type.startsWith("[")) {
                continue;
            }
            if (field.writable && field.type != TYPE_ID) {
                inputType += `\t${field.name}: ${mapType(field.type)}\n`;
            }
            queries += `${field.name}: ${mapType(field.type)}, `;
            if (field.type == "String") {
                queries += `${field.name}Like: ${mapType(field.type)}, `;
            }
        }
        queries += " " + OFFSET + ": Int, " + LIMIT + ": Int";

        schemaType += "}\n";
        queries += `): [${d.meta.className}] \n`;
        inputType += "}\n";
        schemaType += inputType;
        mutators += `\tcreate${d.meta.className}(input: ${
            d.meta.className
        }Input): ${d.meta.className}\n`;
        mutators += `\tupdate${d.meta.className}(id: ID!, input: ${
            d.meta.className
        }Input): ${d.meta.className}\n`;
        mutators += `\tdelete${d.meta.className}(id: ID!): ${
            d.meta.className
        }\n`;

        schemas += schemaType;

        resolvers.Query[queryName] = async (
            _: any,
            args: any,
            __: any,
            info: any
        ) => {
            let request: any = graphqlFields(info);
            let qb = getRepository(d.entity)
                .createQueryBuilder(cName)
                .select();
            for (let field of d.meta.fields) {
                if (field.type.indexOf("[") == -1) {
                    continue;
                }
                if (!request.hasOwnProperty(field.name)) {
                    continue;
                }
                let f = field.type.replace("[", "").replace("]", "");
                qb = qb.leftJoinAndSelect(cName + "." + field.name, f);
            }
            qb = qb.where("true");
            for (let arg in args) {
                if (isReservedArgs(arg)) {
                    continue;
                }
                let p: any = {};
                p[arg] = args[arg];
                var key = arg;
                if (arg.endsWith("Like")) {
                    key = arg.substring(0, arg.length - 4);
                    p[arg] = "%" + p[arg] + "%";
                    qb = qb.andWhere(`${cName}.${key} LIKE :${arg}`, p);
                } else {
                    qb = qb.andWhere(`${cName}.${key} =  :${arg}`, p);
                }
            }
            if (args[OFFSET]) {
                qb.offset(args[OFFSET]);
            }
            if (args[LIMIT]) {
                qb.limit(args[LIMIT]);
            }
            return qb.getMany();
        };

        resolvers.Mutation[`create${d.meta.className}`] = async (
            _: any,
            args: any,
            __: any,
            ___: any
        ) => {
            let input: any = {};
            for (let key in args.input) {
                input[key] = args.input[key];
            }
            let obj = await getRepository(d.entity).create();
            obj = await getRepository(d.entity).merge(obj, input);
            await (obj as any).save();
            return obj;
        };
        resolvers.Mutation[`update${d.meta.className}`] = async (
            _: any,
            args: any,
            __: any,
            ___: any
        ) => {
            let id = args.id;
            let obj = (await getRepository(d.entity).findOneById(id)) as any;
            for (let key in args.input) {
                obj[key] = args.input[key];
            }
            await obj.save();
            return obj;
        };
        resolvers.Mutation[`delete${d.meta.className}`] = async (
            _: any,
            args: any,
            __: any,
            ___: any
        ) => {
            let obj = (await getRepository(d.entity).findOneById(
                args.id
            )) as any;
            await getRepository(d.entity).deleteById(args.id);
            return obj;
        };
    }

    queries = `type Query {\n${queries}}\n`;
    mutators = `type Mutation {\n${mutators}}\n`;
    let typeDefs = `${queries}\n${mutators}\n${schemas}`;

    return makeExecutableSchema({
        typeDefs,
        resolvers
    });
}

function mapType(type: String): String {
    let isArray = false;
    if (type.endsWith("[]")) {
        isArray = true;
        type = type.replace("[]", "");
    }
    switch (type) {
        case "Number":
            return toTypeArray("Int", isArray);
    }
    return toTypeArray(type, isArray);
}

function toTypeArray(type: String, isArray: boolean) {
    if (isArray) {
        return "[" + type + "]";
    }
    return type;
}

const TYPE_ID = "ID";
const OFFSET = "_offset";
const LIMIT = "_limit";
const reservedArgs = [OFFSET, LIMIT];

function isReservedArgs(arg: String): boolean {
    for (let res of reservedArgs) {
        if (arg == res) {
            return true;
        }
    }
    return false;
}
