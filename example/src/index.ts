import { App, ConfigBuilder } from "lynx-framework";
import BaseModule from "lynx-framework/base.module";

const port = Number(process.env.PORT) || 3000;

import AuthModule from "lynx-auth";

let myConfig = new ConfigBuilder(__dirname).build();
AuthModule.settings.controllerPath = "/autenticazione";
AuthModule.settings.context.masterTemplatePath = "/layouts/base";

const app = new App(myConfig, [new AuthModule()] as BaseModule[]);
app.startServer(port);
