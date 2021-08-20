# lynx

lynx is a NodeJS framework for Web Development, based on decorators and the async/await support.

The idea is to enforce code maintainability and readability enforcing a precise project structure, **decorators** and completely remove the callback (or promises) nightmare leaning on the new **async/await** supports, available in the new versions of NodeJS.

Lynx is influenced by the Java Spring framework, trying to bring a more enterprise-level environment to NodeJS.

## Libraries

Lynx is founded by state-of-the-art libraries. It uses:

-   **[ExpressJS](http://expressjs.com/)** for the management of routes;
-   **[nunjucks](https://mozilla.github.io/nunjucks/)** as template engine;
-   **[TypeORM](http://typeorm.io/)** as ORM to the database;
-   **[JWT](https://jwt.io/)** to enable token authentication;
-   **[multer](https://github.com/expressjs/multer)** to manage file upload;
-   **[nodemailer](https://nodemailer.com)** to send emails;
-   **[joi](https://github.com/hapijs/joi)** to validate the requests;
-   **[jimp](https://github.com/oliver-moran/jimp)** to perform image resizing and other operations.

## Out-Of-The-Box Features

With Lynx, you will have the following functionality out of the box:

-   user management, and low level function for login, registration, authorization and authentication;
-   media upload management, file upload and retrieving, on a virtual-folder environment;
-   multi-language is a first class citizen! You can use new nunjucks filter to enable multi-language on the template engine, but also during fields validation!
-   datatables, directly integrated on the template engine, with pagination, filtering and ordering (please use the `lynx-datatable` module)

## Installation

```
npm install lynx-framework
```

## Lynx module structure

A Lynx module shall be formed by different folders:

```
.
├── controllers
│   ├── backoffice
│   │   └── main.controller.ts
│   └── main.controller.ts
├── entities
├── index.ts
├── libs
├── locale
│   ├── en.json
│   └── it.json
├── middlewares
│   └── always.middleware.ts
├── public
├── templating
└── views
    └── main.njk
```

-   The `controllers` folder shall contain (with subfolder support) any controllers.
-   The `entities` folder shall contain any entities, that will be automatically mapped with `TypeORM`.
-   The `libs` folder shall contain any additional libraries or utility functions, that can be used by controllers and middlewares.
-   The `local` folder shall contains localization file formatted as key-value JSON file.
-   The `middlewares` folder shall contain (with subfolder support) any middleware.
-   The `public` folder shall contain all the public resources, such as images, css and so on.
-   The `templating` folder shall contain filters and functions to enchant the templating system.
-   The `view` folder shall contain the nunjucks templates. An `emails` subfolder, containing the email templates, is recommended.

The `index.ts` should be the entry point of the module, defining a class that implements the `BaseModule` abstract class. For semplicity, also a `SimpleModule` class can be used, in order to define only the folders needed by the module.

The project structure can be customized with different folder names, simply editing the module class. Otherwise, this structure is strictly recommended.

## Lynx application

A Lynx application is composed by at least one module, and an entry point of the standard node application.

To start a Lynx application, it is necessary to instantiate a Lynx `App` object. For example, the `index.ts` file can be:

```
import { App, ConfigBuilder } from "lynx-framework/app";
import AppModule from "./modules/app";

const port = Number(process.env.PORT) || 3000;

const app = new App(new ConfigBuilder(__dirname, false).build(), [new AppModule()]);
app.startServer(port);
```

Any Lynx configuration, such as database connection, token secrets, folders and so on, can be customized using the `ConfigBuilder` object.
Any controllers, middlewares and entities of any modules will be automatically loaded by the Lynx app.

## Controllers

A controller defines a set of endpoints. Any endpoint responds to a specific
path and HTTP verb, and can generate an HTML or JSON response.
Any controller shall extends the `BaseController` class, in order to inherit a lot of
utility methods.
It is possible to define only ONE controller for each file, and the class shall be `export default`.
Moreover, the file should be named as `controllerName.controller.ts`.

The minimum configuration of a controller is the following:

```
import { Route } from "lynx-framework/decorators";
import BaseController from "lynx-framework/base.controller";

@Route("/myController/path")
export default class MyController extends BaseController {
    ...
}
```

To define endpoints, it is necessary to decor a method. There is a decorator for each HTTP verb (GET, POST, etc..). For example:

```
    ...
    @GET('/helloWorld')
    async helloWorld() {
        return "Hello, world!";
    }
```

the method `helloWorld` will be executed for any `GET` request to `/myController/path/helloWorld`.

### Method decorators

#### `GET(path)`, `POST(path)`, `PUT(path)`, `PATCH(path)`, `DELETE(path)`

These decorators map the method to the chosen HTTP verb with the specified path.
Moreover, `path` can contains path parameters, for example `/authors/:id/posts`. The path parameters will be injected in the method as arguments:

```
    @GET('/authors/:id/posts/:secondParameter')
    async doubleParameters(id:Number, secondParameter:String) {
        ...
    }
```

Since Lynx is based on Express, more information about the url parameters can be found [here](https://expressjs.com/en/guide/routing.html).

**IMPORTANT** these decorators shall be put just before the method definition, and as last decorator used to the method.

### `API()`

The `API` decorator enforce the serialization of the returned object to JSON. This feature is very useful to build an API.
In this case, the returned object will be added inside the following standard return object:

```
 {
     "success": true/false,
     "data": "returned object serialized"
 }
```

If the method returns a boolean value, the return object will be:

```
 {
     "success": returned value
 }
```

For more information about the object serialization, please check the [Entity chapter]().

### `MultipartForm()`

This decorator simply allows the MultipartForm in post request. It is essential to enable the automatic file upload system.

### `Name(name)`

This decorator allows to set a name to the route. So, it is possible to recall this route in a very simple way.
The route name is used by any `route` functions.

### `Verify(function)`

Add to the decorated method a verification function that will be executed BEFORE the route.
The function must NOT be an async function, and it shell return a boolean value. If true is returned, the method is then executed. This method is fundamental to implement authorization to a single endpoint.
NOTE: the function shall NOT be a class method, but a proper Typescript function.
Example:

```
function alwaysDeny(req, res) {
    return false;
}
...
@Verify(alwaysDeny)
@GET("/unreachable")
async someMethod() {
    ...
}
```

### `AsyncVerify(function)`

Add to the decorated method a verification function that will be executed BEFORE the route.
The function MUST BE an async function, and it shell return a boolean value. If true is returned, the method is then executed. This method is fundamental to implement authorization to a single endpoint.
NOTE: the function shall NOT be a class method, but a proper Typescript function.

> This method is available from version 0.5.5

Example:

```
async function alwaysDeny(req, res) {
    return false;
}
...
@AsyncVerify(alwaysDeny)
@GET("/unreachable")
async someMethod() {
    ...
}
```

### `IsDisabledOn(function)`

Add to the decorated method a verification function that will be executed BEFORE the route.
The function shall return a boolean value and it is evaluated during the server startup.
If the function return true, the decorated method is ignored and is not added to the current controller.

> This method is available from version 1.1.5.

Example:

```
function disableOnProduction() {
    return isProduction == true;
}
...
@IsDisabledOn(disableOnProduction)
@GET("/test")
async testMethod() {
    ...
}
```

### `Body(name, schema)`

The `Body` decorator inject the request body as a parameter of the decorated method. The body object
is automatically wrapped inside a `ValidateObject`, that is verified using a [JOI schema](https://github.com/hapijs/joi).
Example:

```
import { ValidateObject } from "lynx-framework/validate-object";
import * as Joi from "joi";

const loginSchema = Joi.object().keys({
    email: Joi.string()
        .email()
        .required()
        .label("{{input_email}}"), //I can use a localized string!
    password: Joi.string()
        .required()
        .min(4)
        .regex(/^[a-zA-Z0-9]{3,30}$/)
        .label("{{input_password}}") //I can use a localized string!
});

...

@Body("d", loginSchema)
@POST("/login")
async performLogin(
    d: ValidateObject<{ email: string; password: string }>
) {
    if (!d.isValid) {
        //d.errors contains localized errors!
        return false;
    }
    let unwrapped = d.obj; //I can use unwrapped.email and unwrapped.password!
    ...
}
```

Starting from version `0.5.8`, a new builder class can be used to create Joi schemas.
The previous example can be simplified as follows:

```
import { ValidateObject, SchemaBuilder } from "lynx-framework/validate-object";

...

const loginSchema = new SchemaBuilder()
    .email("email")
    .withLabel("{{input_email}}")
    .password("password")
    .withLabel("{{input_password}}")
    .build();

...

@Body("d", loginSchema)
@POST("/login")
async performLogin(
    d: ValidateObject<{ email: string; password: string }>
) {
    if (!d.isValid) {
        //d.errors contains localized errors!
        return false;
    }
    let unwrapped = d.obj; //I can use unwrapped.email and unwrapped.password!
    ...
}
```

### Advanced

#### Accessing the original `req` and `res`

When an endpoint method is called, the last two arguments always are the original `req` and `res` objects.
The `req` object has also the `user` and `files` properties (it is a _Lynx Request Object_).
The use of `res` object is discouraged, in favor of a standard returned object from the endpoint method.
Example:

```
@GET("/endpoint/:id")
async myEndpoint(id:Number, req: Request, res: Response) {
    ...
}
```

#### `postConstructor`

It is possible to override the `postConstructor` methods that will be called after the creation of the controller. This method is `async`, so it is possible to perform asynchronous initialization. Always remember that there will be only ONE instance of any controller in a Lynx application.

## Enhancements to the Nunjucks engine

### `tr` filter

The `tr` filter automatically localize a string. Usage:

```
<button type="submit" class="btn btn-primary px-4">{{ "button_login" | tr }}</button>
```

The `button_login` shall be a property in the JSON localized file.

### `json` filter

The `json` filter automatically format an object or variable to JSON.

### `format` filter

The `format` filter format a number to a string, with a fixed number of decimal digits (default: 2).
Usage:

```
<span class="price">€ {{ price | format }}</span>
<span class="integer_number">{{ myNumber | format(0) }}
```

### `date` filter

The `date` filter format a date to a string, using the `moment`. The default format will use the
`lll` format, but it is possible to override this behavior.
Usage:

```
<span class="date">€ {{ data.createdAt | date }}</span>
<span class="my_date_custom">{{ data.createdAt | date("YYYY-MM-DD") }}
```

### `route` global function

The `route` function compile a route name to an url with the given parameters.
If an url is used instead of a route name, the url is still compiled with the given parameters.
Usage:

```
<a href="{{route('forgot_password')}}" class="btn btn-link px-0">...</a>
```

To set the name of a route, use the `Name` decorated to the chosen method.

### `old` global function

The `old` function is used to retrieve the latest value of a form. It can be used to retrieve the value of an input while performing server side form validation. It is also possible to specify a default value.
Usage:

```
<input type="email" name="email" class="form-control" value="{{old('email')}}">
```

### `currentHost` global function

The `currentHost` function is used to retrieve the current server host. This can be used, with the `route` function, to generate an absolute
url (for example, needed to generate an url for an email).

### Add custom filters and functions to the template engine.

It is possible to add new custom filters and functions using the `TemplateFilter` and `TemplateFunction` decorators.
In both cases, it is necessary to create a new class for each filter or function, inside the `templating` folder of the module.

NOTE: filters and functions do not need to be defined as `export default class`es as for controllers or entities. Moreover, only once instance for each class will be created (they are managed as "singleton" by Lynx).

#### Custom filter

Example: create a new `currency` filter.
Create a new `currency.filter.ts` file inside the `templating` folder as follows:

```
import { TemplateFilter } from 'lynx-framework/templating/decorators';
import BaseFilter from 'lynx-framework/templating/base.filter';

@TemplateFilter('currency')
export class CurrencyFiltering extends BaseFilter {
    filter(val: any, ...args: any[]): string {
        if (val == undefined) {
            return val;
        }
        //TODO: convert the `val` variable and return the result
        return val + '€';
    }
}

```

### Custom function

Example: create a new `placeholderUrl` function.
Create a new `placeholder-url.function.ts` file inside the `templating` folder as follows:

```
import { TemplateFunction } from 'lynx-framework/templating/decorators';
import BaseFunction from 'lynx-framework/templating/base.function';

@TemplateFunction('placeholderUrl')
export default class PlaceholderUrlFunction extends BaseFunction {
    execute(...args: any[]) {
        let ratio = this.safeGet(args, 0);
        let text = 'Free';
        if (!ratio) {
            ratio = '4:3';
        } else {
            text = ratio;
        }
        let _ww = (ratio + '').split(':')[0];
        let _hh = (ratio + '').split(':')[1];
        let h = ((350 / Number(_ww)) * Number(_hh)).toFixed(0);
        return 'http://via.placeholder.com/350x' + h + '?text=' + text;
    }
}

```

## Custom `API` response

Starting from `1.0.0-rc4`, it is possible to customize the standard response of the `API` tagged routes.

To achieve this feature, it is necessary to implement the `APIResponseWrapper` interface, and set the `apiResponseWrapper` property of your `App` instance.
By default, the `DefaultResponseWrapper` implementation is used.

## Lynx Modules

Lynx supports custom module to add functionality at the current application. A module act exactly as a legacy Lynx application, with its standard `controllers`, `middlewares`, `entities`, `views`, `locale` and `public` folders.
Modules shall be loaded at startup time, and shall be injected in the Lynx application constructor:

```
const app = new App(myConfig, [new DatagridModule(), new AdminUIModule()] as BaseModule[]);
```

In this example, the Lynx application is created with the `DatagridModule` and the `AdminUIModule` modules.

Modules are the standard to provide additional functionality to the Lynx framework.

## Mail Client

Since day 0, Lynx supports a very simple API to send emails from controllers, with the methods `sendMail` and `sendMailRaw`. Starting from `1.2.0`, this methods are available outside the controller context.

The `App` class define the `mailClient` property of type `MailClient`. This class contains the methods `sendMail` and `sendMailRaw` to respectivly send emails.
The first method uses the `nunjuks` template system to send emails, both for plain text, html text and subject. The latter is a low level version of the API, directly sending the email body and subject. Both APIs support multiple destination addresses.

The mail client is configured thought the `ConfigBuilder` of the application.

By default, a standard SMTP sender client is used (using the usual NodeMailer library). It is possible to use a custom sender class (that implements the `MailClient` interface) using the `setMailClientFactoryConstructor` method of the `ConfigBuilder`.

## Interceptors

> This feature is available from version 1.1.21

Lynx supports two types of interceptors, in order to manage and edit requests. Currently, _Global Routing Interceptor_ and _Before Perform Response Interceptor_ are supported.

### Global Routing Interceptor

This interceptor can be mounded as an additional `express Router`, and it is executed before any middleware or routes defined by the lynx modules system.
Seems the interceptor is mounted as a router, it is possible to define a subpath in which it should be executed.

> Warning: usually, it is possible to use a standard middleware to achieve most of the common jobs. Use this interceptor only if it is necessary to execute this function before any middleware.

### Before Perform Response Interceptor

This interceptor is executed just before the `performResponse` method of any Lynx `Response` is executed.
This interceptor can be useful to override some standard behavior of the framework responses. A typical example is the editing of the final url for a `RedirectResponse`.

### Basic usage

At Jellyfish Solutions, we use this two interceptors in conjunction, in order to manage url rewrite based on the language.
In this particular case, the language of the user is not set in the usual `Accept-Language` header of the request, but it is a portion of the current url.
The _Global Routing Interceptor_ is used to remove the language from the request url, and correctly update the usual request language.
The _Perform Response Interceptor_ is used to add (if necessary) the correct language to a redirect response, without editing the application code.
