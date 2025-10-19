import {ResourceFactory, InvalidResourceError, type Id, type Content} from "./resource.ts";
import {UserFactory} from "./user.ts";
import * as data from "../data/redis.ts";
import {randomBytes} from "node:crypto";

// Types

export type Token = Content & {
    userId: string;
};

export type TokenResource = Id & Token;

// Factory

export class TokenFactory extends ResourceFactory {
    userFactory = new UserFactory();

    constructor() { super("token"); }

    newContent(content: object): Token {
        if (!this.isValid(content)) throw new InvalidResourceError("Invalid token");

        return {
            ...super.newContent(content),
            userId: content.userId,
        };
    }

    isValid(item: object): item is Token {
        return "userId" in item && typeof item.userId === "string";
    }

    toRest(item: TokenResource): object {
        return {
            sessionToken: item.id,
            user: this.userFactory.toRest(this.userFactory.newId(item.userId)),
        };
    }

    toData(item: Token) {
        return {
            ...super.toData(item),
            userId: item.userId,
        };
    }

    async find(property: string, value: string) {
        const tokenId = await data.find(this.type, property, value);
        if (tokenId)
            return this.newId(tokenId);
        else
            return null;
    }

    async create(tokenData: object) {
        const token = this.newContent(tokenData);
        const apiKey = randomBytes(32).toString("base64");

        await data.set(this.type, apiKey, this.toData(token));
        return this.newResource(this.newId(apiKey), token);
    }
}
