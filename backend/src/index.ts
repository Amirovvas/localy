import "./config/env";
import http from "http";
import createApi from "./createApi";
import { initSocket } from "./plugins/socket";

const app = createApi();
const server = http.createServer(app);
initSocket(server);

const port = Number(process.env.PORT) || 5000;
server.listen(port, () => {
  console.log(`Server is working on port: ${port}`);
});
