// Core HTTP server definition

import express from "express";
import cookieParser from "cookie-parser";
import config from "./config.ts";
import apiRouter from "./resource/api.ts";
import timeRouter from "./resource/time.ts";
import userRouter from "./resource/user.ts";
import eventRouter from "./resource/event.ts";
import authRouter from "./http/auth.ts";
import {errorHandler, NotFoundError} from "./http/error.ts";
import debugMessages from "./http/debug.ts";

// Server

const server = express();

// Middleware

server.use(express.json());
server.use(cookieParser());
if (config.server.debug) server.use(debugMessages);

// Resources

server.use("/", express.static(config.client.path));
server.use("/api", apiRouter);
server.use("/api/time", timeRouter);
server.use("/api/user", userRouter);
server.use("/api/event", eventRouter);
server.use("/api/login", authRouter);

// Errors

server.all("/api/{*any}", () => { throw new NotFoundError("Resource not found"); });
server.all("/{*any}", () => { throw new NotFoundError("Resource not found", {contentType: "text/html"}); });
server.use(errorHandler);

// Start server

server.listen(config.server.port, () => {
    console.info(`Listening at http://localhost:${config.server.port}`);
});
