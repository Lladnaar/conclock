import express from "express";
import {randomBytes} from "node:crypto";
import auth from "basic-auth";
import {UnauthorisedError} from "../http/error.ts";
import {UserFactory} from "../resource/user.ts";

const apiKey = randomBytes(32).toString("base64");
const BEARER_PREFIX = "Bearer ";

function tokenAuth(req: express.Request): string | undefined {
    const authHeader = req.get("Authorization");
    if (authHeader && authHeader.startsWith(BEARER_PREFIX))
        return authHeader.slice(BEARER_PREFIX.length);
}

function cookieAuth(req: express.Request): string | undefined {
    return req.cookies["Session-Token"];
}

// Rest

export class AuthRest {
    factory = new UserFactory();

    async authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
        const basic = auth(req);
        const token = tokenAuth(req);
        const cookie = cookieAuth(req);
        if (basic) {
            const userId = await this.factory.find("username", basic.name);
            if (userId && await this.factory.checkPassword(userId, basic.pass))
                next();
            else
                throw new UnauthorisedError("Invalid credentials");
        }
        else if (token) {
            if (token === apiKey)
                next();
            else
                throw new UnauthorisedError("Invalid credentials");
        }
        else if (cookie) {
            if (cookie === apiKey)
                next();
            else
                throw new UnauthorisedError("Invalid credentials");
        }
        else
            throw new UnauthorisedError("No credentials");
    }

    async login(req: express.Request, res: express.Response) {
        res
            .status(200)
            .cookie("Session-Token", apiKey)
            .json({sessionToken: apiKey});
    }
}

// Router

const authRest = new AuthRest();

const router = express.Router();
router.use("/", authRest.authenticate.bind(authRest));
router.post("/", authRest.login.bind(authRest));

export default router;
