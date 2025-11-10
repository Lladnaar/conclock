import express from "express";
import {NotFoundError, BadRequestError} from "../http/error.ts";
import bcrypt from "bcrypt";
import * as data from "../data/redis.ts";
import {StatusCodes as http} from "http-status-codes";
import {checkSchema, validationResult} from "express-validator";

type UserData = {
    name: string;
    username: string;
    password?: string;
};

const userSchema = {
    name: {isString: true, notEmpty: true, escape: true},
    username: {isString: true, notEmpty: true, escape: true},
    password: {isString: true, optional: true, notEmpty: true},
};

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

const passwordSchema = {
    password: {isString: true, notEmpty: true},
    oldPassword: {isString: true, optional: true, notEmpty: true},
};

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

async function extractUser(req: express.Request): Promise<UserData> {
    const result = validationResult(req);
    if (!result.isEmpty())
        throw new BadRequestError("Invalid user data", {
            details: result.array().flatMap((error) => {
                switch (error.type) {
                case "field": return [[error.path, `${error.msg} (${error.value})`]];
                case "unknown_fields": return error.fields.map((f): [string, string] => [f.path, "Unexpected field"]);
                default: return [[error.type, error.msg]];
                }
            }),
        });

    if (req.body.password)
        req.body.password = await encryptPassword(req.body.password);
    return req.body as UserData;
}

async function userPost(req: express.Request, res: express.Response) {
    const protoUser = await extractUser(req);

    const id = await data.add("user", protoUser);
    const user = makeUserResponse(id, protoUser);
    res.status(http.CREATED).json(user);
}

async function userPut(req: express.Request, res: express.Response) {
    const protoUser = await extractUser(req);
    const id = req.params.id!;

    if (!protoUser.password) {
        const existingUser = await data.get("user", id) as UserData;
        protoUser.password = existingUser.password;
    }

    await data.set("user", id, protoUser);
    const user = makeUserResponse(id, protoUser);
    res.status(http.OK).json(user);
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

async function extractPassword(req: express.Request): Promise<PasswordData> {
    const result = validationResult(req);
    if (!result.isEmpty())
        throw new BadRequestError("Invalid user data", {
            details: result.array().flatMap((error) => {
                switch (error.type) {
                case "field": return [[error.path, `${error.msg} (${error.value})`]];
                case "unknown_fields": return error.fields.map((f): [string, string] => [f.path, "Unexpected field"]);
                default: return [[error.type, error.msg]];
                }
            }),
        });

    if (req.body.password)
        req.body.password = await encryptPassword(req.body.password);
    return req.body as PasswordData;
}

async function userSetPassword(req: express.Request, res: express.Response) {
    try {
        const id = req.params.id!;
        const protoPassword = await extractPassword(req);
        if (protoPassword.oldPassword && !await checkPassword(id, protoPassword.oldPassword!))
            throw new BadRequestError("Old password incorrect");
        else
            await data.update("user", id, {password: protoPassword.password});
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
router.post("/", checkSchema(userSchema, ["body"]), userPost);
router.put("/:id", checkSchema(userSchema, ["body"]), userPut);
router.delete("/:id", userDelete);
router.post("/:id/password", checkSchema(passwordSchema, ["body"]), userSetPassword);

export default router;
