import express from "express";
import type {Id, Content} from "./resource.ts";
import {ResourceFactory, InvalidResourceError} from "./resource.ts";
import {Rest} from "../http/rest.ts";

// Types

export type User = Content & {
    username: string;
    password: string | undefined;
};

export type UserResource = Id & User;

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

    toData(item: User) {
        return {
            ...super.toData(item),
            username: item.username,
            password: item.password,
        };
    }
}

// Router

const userRest = new Rest(new UserFactory());

const router = express.Router();
router.get("/", userRest.getAll.bind(userRest));
router.get("/:id", userRest.get.bind(userRest));
router.post("/", userRest.post.bind(userRest));
router.put("/:id", userRest.put.bind(userRest));
router.delete("/:id", userRest.delete.bind(userRest));

export default router;
