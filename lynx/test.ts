import { App, ConfigBuilder } from "./index";

const port = Number(process.env.PORT) || 3000;

let myConfig = new ConfigBuilder(__dirname).setDatabase("lynx_cms").build();

const app = new App(myConfig);
app.startServer(port);
