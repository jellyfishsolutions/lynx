export interface FieldMetadata {
    type: String;
    name: String;
    writable: boolean;
}

export interface EntityMetadata {
    hasGraphQL: boolean;
    className: String;
    fields: FieldMetadata[];
}

let currentEntity: EntityMetadata = initGraphEntity();

function initGraphEntity() {
    return {
        className: "",
        hasGraphQL: false,
        fields: Array<FieldMetadata>()
    };
}

export interface EntityOptions {
    name?: String;
}

export function GraphQL(options?: EntityOptions) {
    return (target: any) => {
        currentEntity.hasGraphQL = true;
        if (options && options.name) {
            currentEntity.className = options.name;
        } else {
            currentEntity.className = target.name;
        }
        target.graphQL = currentEntity;
        currentEntity = initGraphEntity();
    };
}

export interface FieldOptions {
    type?: String;
    writable?: boolean;
}

export function GraphField(options?: FieldOptions) {
    return (target: any, key: string) => {
        var type = Reflect.getMetadata("design:type", target, key);
        if (type.name == "Array") {
            type = type.elemType + "[]";
        } else {
            type = type.name;
        }
        if (options && options.type) {
            type = options.type;
        }
        var writable = true;
        if (options && options.writable) {
            writable = options.writable;
        }
        currentEntity.fields.push({
            name: key,
            type: type,
            writable: writable
        });
    };
}
