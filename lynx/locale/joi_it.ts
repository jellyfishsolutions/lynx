export const errors = {
    root: "value",
    key: "{{!label}} ",
    messages: {
        wrapArrays: true
    },
    any: {
        unknown: "non è permesso",
        invalid: "contiene un valore non valido",
        empty: "non è permesso che sia vuoto",
        required: "è richiesto",
        allowOnly: "deve essere uno di {{valids}}",
        default: "threw an error when running default method"
    },
    alternatives: {
        base: "non corrisponde a nessuna delle alternative permesse",
        child: ""
    },
    array: {
        base: "deve essere un array",
        includes:
            "alla posizione {{pos}} non corrisponde a neesuno dei tipi permessi",
        includesSingle:
            'il valore singolo di "{{!label}}" non corrisponde a nesusno dei tipi permessi',
        includesOne: "alla posizione {{pos}} fallisce perchè {{reason}}",
        includesOneSingle:
            'il singolo valore di "{{!label}}" fallisce perchè {{reason}}',
        includesRequiredUnknowns:
            "non contiene {{unknownMisses}} valore(i) richiesti",
        includesRequiredKnowns: "non contiene {{knownMisses}}",
        includesRequiredBoth:
            "non contiene {{knownMisses}} e {{unknownMisses}} altri valore(i) richiesti",
        excludes: "alla posizione {{pos}} contiene un valore escluso",
        excludesSingle:
            'singolo valore di "{{!label}}" contiene un valore escluso',
        min: "deve contenere almeno {{limit}} elementi",
        max: "deve contetere meno di o uguale a {{limit}} elementi",
        length: "deve contenere {{limit}} elementi",
        ordered: "alla posizione {{pos}} fallisce perchè {{reason}}",
        orderedLength:
            "alla posizione {{pos}} fallisce perchè l'array deve contenere al massimo {{limit}} elementi",
        ref: 'riferimenti "{{ref}}" che non è un numero intero positivo',
        sparse: "non deve essere uno sparse array",
        unique: "posizione {{pos}} contiene un valore duplicato"
    },
    boolean: {
        base: "deve essere un boleano"
    },
    binary: {
        base: "must be a buffer or a string",
        min: "must be at least {{limit}} bytes",
        max: "must be less than or equal to {{limit}} bytes",
        length: "must be {{limit}} bytes"
    },
    date: {
        base: "deve essere un numero di millisecondi o una data valida",
        format:
            "deve essere una stringa in uno dei seguenti formati {{format}}",
        strict: "deve essere una data valida",
        min: 'deve essere più grande o uguale a "{{limit}}"',
        max: 'deve essere più priccola o uguale a "{{limit}}"',
        isoDate: "deve essere una data valida nel formato ISO 8601",
        timestamp: {
            javascript:
                "deve essere un timestamp valido o un numero in millisecondi",
            unix: "deve essere un timestamp valido o un numero in secondi"
        },
        ref: 'il riferimento "{{ref}}" che non è una data'
    },
    function: {
        base: "must be a Function",
        arity: "must have an arity of {{n}}",
        minArity: "must have an arity greater or equal to {{n}}",
        maxArity: "must have an arity lesser or equal to {{n}}",
        ref: "must be a Joi reference",
        class: "must be a class"
    },
    lazy: {
        base: "!!schema error: lazy schema must be set",
        schema: "!!schema error: lazy schema function must return a schema"
    },
    object: {
        base: "must be an object",
        child: '!!child "{{!child}}" fails because {{reason}}',
        min: "must have at least {{limit}} children",
        max: "must have less than or equal to {{limit}} children",
        length: "must have {{limit}} children",
        allowUnknown: '!!"{{!child}}" is not allowed',
        with: '!!"{{mainWithLabel}}" missing required peer "{{peerWithLabel}}"',
        without:
            '!!"{{mainWithLabel}}" conflict with forbidden peer "{{peerWithLabel}}"',
        missing: "must contain at least one of {{peersWithLabels}}",
        xor: "contains a conflict between exclusive peers {{peersWithLabels}}",
        or: "must contain at least one of {{peersWithLabels}}",
        and:
            "contains {{presentWithLabels}} without its required peers {{missingWithLabels}}",
        nand:
            '!!"{{mainWithLabel}}" must not exist simultaneously with {{peersWithLabels}}',
        assert:
            '!!"{{ref}}" validation failed because "{{ref}}" failed to {{message}}',
        rename: {
            multiple:
                'cannot rename child "{{from}}" because multiple renames are disabled and another key was already renamed to "{{to}}"',
            override:
                'cannot rename child "{{from}}" because override is disabled and target "{{to}}" exists',
            regex: {
                multiple:
                    'cannot rename children {{from}} because multiple renames are disabled and another key was already renamed to "{{to}}"',
                override:
                    'cannot rename children {{from}} because override is disabled and target "{{to}}" exists'
            }
        },
        type: 'must be an instance of "{{type}}"',
        schema: "must be a Joi instance"
    },
    number: {
        base: "deve essere un numero",
        min: "deve essere più grande o uguale a {{limit}}",
        max: "deve essere più piccolo o uguale a  {{limit}}",
        less: "deve essere più piccolo di{{limit}}",
        greater: "deve essere più grande di {{limit}}",
        float: "deve essere un numero con la virgola",
        integer: "deve essere un numero intero",
        negative: "deve essere un numero negativo",
        positive: "deve essere un numero positivo",
        precision: "deve avere non più di {{limit}} cifre decimali",
        ref: 'il riferimento "{{ref}}" che non è un numero',
        multiple: "deve essere un multiplo di {{multiple}}"
    },
    string: {
        base: "deve essere una stringa",
        min: "deve essere almeno di {{limit}} caratteri",
        max: "non può essere più lungo di {{limit}} caratteri",
        length: "deve essere di {{limit}} caratteri",
        alphanum: "deve contenere solo caratteri alfa-numerici",
        token: "deve contenere solo caratteri alfa-numerici e underscore",
        regex: {
            base:
                'con valore "{{!value}}" non rispetta il seguente pattern: {{pattern}}',
            name: 'con valore "{{!value}}" non rispetta il pattern {{name}}',
            invert: {
                base:
                    'con valore "{{!value}}" non deve rispettare il seguente pattern: {{pattern}}',
                name:
                    'con valore "{{!value}}" non deve ripsettare il pattern {{name}}'
            }
        },
        email: "deve essere un indirizzo email valido",
        uri: "deve essere un uri valido",
        uriRelativeOnly: "deve essere un uri relativo valido",
        uriCustomScheme:
            "deve essere un uri valido secondo lo schema {{scheme}}",
        isoDate: "deve essere una data in ISO 8601",
        guid: "deve essere un GUID valido",
        hex: "deve contenere solo caratteri esadecimali",
        base64: "deve essere un base64 valido",
        hostname: "deve essere un hostname valido",
        normalize: "deve essere un unicode normalizzato nell form {{form}}",
        lowercase: "deve contenere solo caratteri minuscoli",
        uppercase: "deve contenere solo caratteri maiuscoli",
        trim: "deve non terminare o iniziare con degli spazi",
        creditCard: "deve essere una carta di credito",
        ref: 'il riferimento "{{ref}}" che non è un numero',
        ip: "deve essere un indirizzo ip valido con CIDR {{cidr}}",
        ipVersion:
            "deve essere un indirizzo ip valido in una delel seguenti versioni {{version}} con CIDR {{cidr}}"
    }
};
