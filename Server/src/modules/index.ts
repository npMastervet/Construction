import { createModuleRouter } from "./routes";

/** Business modules register here; core never imports business modules. */
export const createModuleRouters = () => [createModuleRouter()];
