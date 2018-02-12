# lynx

lynx is a NodeJS framework for Web Development, based on decorators and the async/await support.

The idea is to enforce code maintainability and readability enforcing a precise project structure, **decorators** and completely remove the callback (or promises) nightmare leaning on the new **async/await** supports, available in the new versions of NodeJS.

Lynx is influenced by the Java Spring framework, trying to bring a more enterprise-level environment to NodeJS.

## Libraries

Lynx is founded by state-of-the-art libraries. It uses:

* **[ExpressJS](http://expressjs.com/)** for the management of routes;
* **[nunjucks](https://mozilla.github.io/nunjucks/)** as template engine;
* **[TypeORM](http://typeorm.io/)** as ORM to the database;
* **[GraphQL](http://graphql.org/)** to automatically exposes an API to the database entities;
* **[JWT](https://jwt.io/)** to enable token authentication;
* **[multer](https://github.com/expressjs/multer)** to manage file upload;
* **[nodemailer](https://nodemailer.com)** to send emails;
* **[joi](https://github.com/hapijs/joi)** to validate the requests;
* **[sharp](http://sharp.dimens.io/)** to perform image resizing and other operations.

## Out-Of-The-Box Features

With Lynx, you will have the following functionality out of the box:

* user management, and low level function for login, registration, authorization and authentication;
* media upload management, file upload and retrieving, on a virtual-folder environment;
* multi-language is a first class citizen! You can use new nunjucks filter to enable multi-language on the template engine, but also during fields validation!
* GraphQL (queries and mutations!) automatically generated based on your Database entities and decoration.
* datatables, directly integrated on the template engine, with pagination, filtering and ordering.

## Controllers

A controller defines a set of endpoints. Any endpoint responds to a specific
path and HTTP verb, and can generate an HTML or JSON response.
Any controller shall extends the `BaseController` class, in order to inherit a lot of
utility methods.
It is possible to define only ONE controller for each file, and the class shall be `export default`.
Moreover, the file should be named as `controllerName.controller.ts`.

The minimum configuration of a controller is the following:

```
import { Route } from "lynx/decorators";
import BaseController from "lynx/base.controller";

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

### `Body(name, schema)`

The `Body` decorator inject the request body as a parameter of the decorated method. The body object
is automatically wrapped inside a `ValidateObject`, that is verified using a [JOI schema](https://github.com/hapijs/joi).
Example:

```
import { ValidateObject } from "lynx/validate-object";
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
