import express from "express";
import type {Id, Content} from "./resource.ts";
import {ResourceFactory, InvalidResourceError} from "./resource.ts";
import {Rest} from "../http/rest.ts";
import {NotFoundError, BadRequestError} from "../http/error.ts";
import bcrypt from "bcrypt";
import * as data from "../data/redis.ts";
import {StatusCodes as http} from "http-status-codes";

// Types

export type User = Content & {
    username: string;
    password: string | undefined;
};

export type UserResource = Id & User;

type Password = {
    password: string;
    oldPassword?: string;
};

// Factory

export class UserFactory extends ResourceFactory {
    constructor() { super("user"); }

    newContent(content: object): User {
        if (!this.isValid(content)) throw new InvalidResourceError("Invalid user");

        return {
            ...super.newContent(content),
            username: content.username,
            password: content.password,
        };
    }

    isValid(item: object): item is User {
        let validity = super.isValid(item);
        validity &&= "username" in item && typeof item.username === "string";
        validity &&= !("password" in item) || ("password" in item && (typeof item.password === "string" || typeof item.password == "undefined"));
        return validity;
    }

    isValidPassword(item: object): item is Password {
        let validity = true;
        validity &&= "password" in item && typeof item.password === "string";
        validity &&= !("oldPassword" in item) || ("oldPassword" in item && typeof item.oldPassword === "string");
        return validity;
    }

    toData(item: User) {
        return {
            ...super.toData(item),
            username: item.username,
            password: item.password,
        };
    }

    toRest(item: Id) {
        if (this.isValid(item))
            return {
                ...super.toRest(item),
                password: {url: super.makeUrl([item.id, "password"])},
            };
        else
            return super.toRest(item);
    }

    async create(user: {password: string | undefined}) {
        if (typeof user.password === "string")
            user.password = await bcrypt.hash(user.password, await bcrypt.genSalt());
        return super.create(user);
    }

    async save(id: string, user: {password: string | undefined}) {
        if (typeof user.password === "string")
            user.password = await bcrypt.hash(user.password, await bcrypt.genSalt());
        else {
            const existingUser = await data.get(this.type, id);
            user.password = typeof existingUser.password == "string" ? existingUser.password : undefined;
        }
        return super.save(id, user);
    }

    async setPassword(user: Id, password: string): Promise<void> {
        const hash = await bcrypt.hash(password, await bcrypt.genSalt());
        await data.update(this.type, user.id, {password: hash});
    }

    async checkPassword(user: Id, password: string): Promise<boolean> {
        const userData = await data.get(this.type, user.id);
        if ("password" in userData && typeof userData.password === "string")
            return bcrypt.compare(password, userData.password);
        else
            return false;
    }
}

// Rest

class UserRest extends Rest {
    userFactory: UserFactory;
    constructor() {
        const userFactory = new UserFactory();
        super(userFactory);
        this.userFactory = userFactory;
    }

    async setPassword(req: express.Request, res: express.Response) {
        try {
            const id = this.factory.newId(req.params.id!);
            if (this.userFactory.isValidPassword(req.body)) {
                if ("oldPassword" in req.body && !await this.userFactory.checkPassword(id, req.body.oldPassword!))
                    throw new BadRequestError("Old password incorrect");
                else
                    await this.userFactory.setPassword(id, req.body.password);
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
}

// Router

const userRest = new UserRest();

const router = express.Router();
router.get("/", userRest.getAll.bind(userRest));
router.get("/:id", userRest.get.bind(userRest));
router.post("/", userRest.post.bind(userRest));
router.put("/:id", userRest.put.bind(userRest));
router.delete("/:id", userRest.delete.bind(userRest));
router.post("/:id/password", userRest.setPassword.bind(userRest));

export default router;
