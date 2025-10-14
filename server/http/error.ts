import express from "express";
import {StatusCodes as http} from "http-status-codes";

export class BadRequestError extends Error {}
export class NotFoundError extends Error {}

export function errorHandler(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
    if (err instanceof BadRequestError || err instanceof SyntaxError)
        res.status(http.BAD_REQUEST).json({error: err.message});
    else if (err instanceof NotFoundError)
        res.status(http.NOT_FOUND).json({error: err.message});
    else
        res.status(http.INTERNAL_SERVER_ERROR).json({error: err.message});

    console.log(`${res.statusCode} ${req.method} ${req.originalUrl} ${err.message}`);
    if (res.statusCode == http.INTERNAL_SERVER_ERROR)
        console.error(err);

    next(null);
}
