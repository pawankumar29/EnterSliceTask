import { app } from "./app.js";
import { env } from "./config/env.js";



const server = app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});

const shutdown = async () => {
  console.log("Shutting down");
  server.close(async () => {
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
