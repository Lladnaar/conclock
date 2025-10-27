import express from "express";
import {StatusCodes as http, getReasonPhrase} from "http-status-codes";

type ErrorOptions = {
    contentType?: string;
    details?: [string, string][];
};

export class HttpError extends Error {
    statusCode: http;
    contentType: string;
    details?: [string, string][];

    constructor(status: http, message: string, options?: ErrorOptions) {
        super(message);
        this.statusCode = status;
        this.contentType = options?.contentType ?? "application/json";
        this.details = options?.details;
    }
}

export class BadRequestError extends HttpError {
    constructor(message: string, options?: ErrorOptions) { super(http.BAD_REQUEST, message, options); }
}

export class NotFoundError extends HttpError {
    constructor(message: string, options?: ErrorOptions) { super(http.NOT_FOUND, message, options); }
}

export class UnauthorisedError extends HttpError {
    constructor(message: string, options?: ErrorOptions) { super(http.UNAUTHORIZED, message, options); }
}

function sendError(res: express.Response, error: HttpError) {
    if (error.contentType === "application/json") {
        res.status(error.statusCode).json({statusCode: error.statusCode, message: error.message, details: error.details});
    }
    else if (error.contentType === "text/html") {
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
