import express from "express";
import {StatusCodes as http, getReasonPhrase} from "http-status-codes";

export class HttpError extends Error {
    statusCode: http;
    type: string;

    constructor(status: http, message: string, type: string = "application/json") {
        super(message);
        this.statusCode = status;
        this.type = type;
    }
}

export class BadRequestError extends HttpError {
    constructor(message: string, type?: string) { super(http.BAD_REQUEST, message, type); }
}
export class NotFoundError extends HttpError {
    constructor(message: string, type?: string) { super(http.NOT_FOUND, message, type); }
}

function sendError(res: express.Response, error: HttpError) {
    if (error.type === "application/json") {
        res.status(error.statusCode).json({statusCode: error.statusCode, message: error.message});
    }
    else if (error.type === "text/html") {
        res.status(error.statusCode).send(`<html><body><h1>${error.statusCode}: ${getReasonPhrase(error.statusCode)}</h1><p>${error.message}</p></body></html>`);
    }
    else {
        res.status(error.statusCode).type("text/plain").send(`${error.statusCode} ${getReasonPhrase(error.statusCode)}: ${error.message}`);
    }
}

export function errorHandler(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
    if (err instanceof HttpError)
        sendError(res, err);
    else
        sendError(res, new HttpError(http.INTERNAL_SERVER_ERROR, "Unexpected error"));

    console.log(`${res.statusCode} ${req.method} ${req.originalUrl} ${err.message}`);
    if (res.statusCode == http.INTERNAL_SERVER_ERROR)
        console.error(err);

    next(null);
}
