// config/env обязан быть первым: он читает .env до того, как остальные модули
// (pg, jwt) обратятся к process.env
import "./config/env";
import http from "http";
import createApi from "./createApi";
import { initSocket } from "./plugins/socket";

const app = createApi();
// socket.io нужен "сырой" http.Server, а не то, что возвращает app.listen —
// поэтому создаём его явно и вешаем на него и Express, и Socket.io
const server = http.createServer(app);
initSocket(server);

const port = Number(process.env.PORT) || 5000;
server.listen(port, () => {
  console.log(`Server is working on port: ${port}`);
});
