import express from "express";
import type {ResourceId, ResourceContent} from "./resource.ts";
import {ResourceFactory, InvalidResourceError} from "./resource.ts";
import {Rest} from "../http/rest.ts";

// Types

type UserContent = ResourceContent & {
    username: string;
    password: string;
};

export type User = ResourceId & UserContent;

// Factory

export class UserFactory extends ResourceFactory {
    constructor() { super("user"); }

    newContent(content: object): UserContent {
        if (!this.isValid(content)) throw new InvalidResourceError("Invalid user");

        return {
            ...super.newContent(content),
            username: content.username,
            password: content.password,
        };
    }

    isValid(item: object): item is UserContent {
        return (super.isValid(item)
            && "username" in item && typeof item.username === "string"
            && "password" in item && typeof item.password === "string");
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
