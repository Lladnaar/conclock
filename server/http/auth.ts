import express from "express";
import auth from "basic-auth";
import {UnauthorisedError} from "../http/error.ts";
import {UserFactory} from "../resource/user.ts";
import {TokenFactory, type TokenResource} from "../resource/token.ts";
import {StatusCodes as http} from "http-status-codes";

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

interface UserRequest extends express.Request {userId?: string}

export class AuthRest {
    userFactory = new UserFactory();
    tokenFactory = new TokenFactory();

    async authenticate(req: UserRequest, res: express.Response, next: express.NextFunction) {
        const basicAuth = auth(req);
        const tokenId = tokenAuth(req);
        const cookieId = cookieAuth(req);
        if (basicAuth) {
            const userId = await this.userFactory.find("username", basicAuth.name);
            if (userId && await this.userFactory.checkPassword(userId, basicAuth.pass)) {
                req.userId = userId.id;
                next();
            }
            else
                throw new UnauthorisedError("Invalid credentials");
        }
        else if (tokenId) {
            try {
                const token = await this.tokenFactory.load(tokenId) as TokenResource;
                req.userId = token.userId;
                next();
            }
            catch {
                throw new UnauthorisedError("Invalid credentials");
            }
        }
        else if (cookieId) {
            try {
                const token = await this.tokenFactory.load(cookieId) as TokenResource;
                req.userId = token.userId;
                next();
            }
            catch {
                throw new UnauthorisedError("Invalid credentials");
            }
        }
        else
            throw new UnauthorisedError("No credentials");
    }

    async login(req: UserRequest, res: express.Response) {
        let token: TokenResource;
        const tokenId = await this.tokenFactory.find("userId", req.userId!);
        if (tokenId)
            token = await this.tokenFactory.load(tokenId.id) as TokenResource;
        else
            token = await this.tokenFactory.create({
                userId: req.userId,
            }) as TokenResource;

        res
            .status(http.OK)
            .cookie("Session-Token", token.id)
            .json(this.tokenFactory.toRest(token));
    }
}

// Router

const authRest = new AuthRest();

const router = express.Router();
router.use("/", authRest.authenticate.bind(authRest));
router.post("/", authRest.login.bind(authRest));

export default router;
