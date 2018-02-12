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
