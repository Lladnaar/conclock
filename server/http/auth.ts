import express from "express";
import auth from "basic-auth";
import {UnauthorisedError} from "../http/error.ts";
import * as data from "../data/redis.ts";
import {StatusCodes as http} from "http-status-codes";
import {randomBytes} from "node:crypto";
import {userFind, checkPassword} from "../resource/user.ts";

const BEARER_PREFIX = "Bearer ";

function tokenAuth(req: express.Request): string | undefined {
    const authHeader = req.get("Authorization");
    if (authHeader && authHeader.startsWith(BEARER_PREFIX))
        return authHeader.slice(BEARER_PREFIX.length);
}

function cookieAuth(req: express.Request): string | undefined {
    return req.cookies["Session-Token"];
}

interface UserRequest extends express.Request {userId?: string}

async function authenticate(req: UserRequest, res: express.Response, next: express.NextFunction) {
    const basicAuth = auth(req);
    const tokenId = tokenAuth(req);
    const cookieId = cookieAuth(req);
    if (basicAuth) {
        const userId = await userFind("username", basicAuth.name);
        if (userId && await checkPassword(userId, basicAuth.pass)) {
            req.userId = userId;
            next();
        }
        else
            throw new UnauthorisedError("Invalid credentials");
    }
    else if (tokenId) {
        try {
            const token = await getToken(tokenId) as TokenData;
            req.userId = token.userId;
            next();
        }
        catch {
            throw new UnauthorisedError("Invalid credentials");
        }
    }
    else if (cookieId) {
        try {
            const token = await getToken(cookieId) as TokenData;
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

type TokenData = {
    userId: string;
};

type TokenResponse = {
    sessionToken: string;
} & Partial<TokenData>;

function makeTokenResponse(id: string, token?: TokenData): TokenResponse {
    const tokenResponse: TokenResponse = {
        sessionToken: id,
    };
    if (token) {
        tokenResponse.userId = token.userId;
    }
    return tokenResponse;
}

async function getToken(id: string): Promise<TokenData> {
    return await data.get("token", id) as TokenData;
}

async function createToken(userId: string): Promise<string> {
    const apiKey = randomBytes(32).toString("base64");
    const token = {userId: userId};

    await data.set("token", apiKey, token);
    return apiKey;
}

async function findToken(userId: string): Promise<string | null> {
    return await data.find("token", "userId", userId);
}

async function returnToken(req: UserRequest, res: express.Response) {
    let token: TokenData;
    let tokenId = await findToken(req.userId!);
    if (tokenId)
        token = await data.get("token", tokenId) as TokenData;
    else {
        tokenId = await createToken(req.userId!);
        token = {userId: req.userId!};
    }

    res
        .status(http.OK)
        .cookie("Session-Token", tokenId)
        .json(makeTokenResponse(tokenId, token));
}

async function revokeToken(req: UserRequest, res: express.Response) {
    const tokenId = await findToken(req.userId!);
    if (tokenId)
        await data.del("token", tokenId);

    res
        .status(http.NO_CONTENT)
        .cookie("Session-Token", undefined)
        .send();
}

const router = express.Router();
router.post("/", authenticate, returnToken);
router.delete("/", authenticate, revokeToken);

export default router;
