import express from "express";

export default function debugMessages(req: express.Request, res: express.Response, next: express.NextFunction) {
    res.on("finish", function () {
        if (res.statusCode >= 200 && res.statusCode < 300)
            console.debug(`${res.statusCode} ${req.method} ${req.originalUrl}`);
    });
    next();
}
