import express from "express";
import {NotFoundError, BadRequestError} from "../http/error.ts";
import bcrypt from "bcrypt";
import * as data from "../data/redis.ts";
import {StatusCodes as http} from "http-status-codes";

type UserData = {
    name: string;
    username: string;
    password?: string;
};

function isValidUser(user: unknown): user is UserData {
    return true; // **** FIX THIS ****
}

type UserResponse = {
    id: string;
    url: string;
    password?: {url: string};
    token?: {url: string};
} & Partial<Omit<UserData, "password">>;

type PasswordData = {
    password: string;
    oldPassword?: string;
};

function isValidPassword(password: unknown): password is PasswordData {
    return true; // **** FIX THIS ****
}

function makeUserResponse(id: string, user?: UserData): UserResponse {
    const userResponse: UserResponse = {
        id: id,
        url: `/api/user/${id}`,
    };
    if (user) {
        userResponse.name = user.name;
        userResponse.username = user.username;
        userResponse.password = {url: `/api/user/${id}/password`};
        userResponse.token = {url: `/api/user/${id}/token`};
    }
    return userResponse;
}

async function userGetAll(req: express.Request, res: express.Response) {
    const idList = await data.list("user");
    const userList = idList.map(id => makeUserResponse(id));
    res.status(http.OK).json(userList);
}

async function userGet(req: express.Request, res: express.Response) {
    const id = req.params.id!;
    try {
        const item = await data.get("user", id) as UserData;
        const user = makeUserResponse(id, item);
        res.status(http.OK).json(user);
    }
    catch (error) {
        if (error instanceof data.LookupError)
            throw new NotFoundError(error.message);
        else
            throw error;
    }
}

async function userPost(req: express.Request, res: express.Response) {
    if (isValidUser(req.body)) {
        if (typeof req.body.password === "string")
            req.body.password = await encryptPassword(req.body.password);

        const id = await data.add("user", req.body as data.Data);
        const user = makeUserResponse(id, req.body);
        res.status(http.CREATED).json(user);
    }
    else
        throw new BadRequestError("Invalid user data.");
}

async function userPut(req: express.Request, res: express.Response) {
    if (isValidUser(req.body)) {
        const id = req.params.id!;
        if (typeof req.body.password === "string")
            req.body.password = await encryptPassword(req.body.password);
        else {
            const existingUser = await data.get("user", id);
            req.body.password = typeof existingUser.password == "string" ? existingUser.password : undefined;
        }

        await data.set("user", id, req.body as data.Data);
        const user = makeUserResponse(id, req.body);
        res.status(http.OK).json(user);
    }
    else
        throw new BadRequestError("Invalid user data.");
}

async function userDelete(req: express.Request, res: express.Response) {
    const id = req.params.id!;
    await data.del("user", id);
    res.status(http.NO_CONTENT).send();
}

async function encryptPassword(password: string): Promise<string> {
    return bcrypt.hash(password, await bcrypt.genSalt());
}

export async function checkPassword(id: string, password: string): Promise<boolean> {
    const userData = await data.get("user", id);
    if ("password" in userData && typeof userData.password === "string")
        return bcrypt.compare(password, userData.password);
    else
        return false;
}

async function userSetPassword(req: express.Request, res: express.Response) {
    try {
        const id = req.params.id!;
        if (isValidPassword(req.body)) {
            if ("oldPassword" in req.body && !await checkPassword(id, req.body.oldPassword!))
                throw new BadRequestError("Old password incorrect");
            else {
                const hash = await encryptPassword(req.body.password);
                await data.update("user", id, {password: hash});
            }
        }
        res.status(http.OK).send();
    }
    catch (error) {
        if (error instanceof data.LookupError)
            throw new NotFoundError(error.message);
        else
            throw error;
    }
}

export async function userFind(property: string, value: string): Promise<string | null> {
    const userId = await data.find("user", property, value);
    if (userId)
        return userId;
    else
        return null;
}

const router = express.Router();
router.get("/", userGetAll);
router.get("/:id", userGet);
router.post("/", userPost);
router.put("/:id", userPut);
router.delete("/:id", userDelete);
router.post("/:id/password", userSetPassword);

export default router;
