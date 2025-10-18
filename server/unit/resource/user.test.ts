import {describe, expect, test, beforeAll} from "vitest";
import type {UserResource} from "../../resource/user.ts";
import {UserFactory} from "../../resource/user.ts";
import * as data from "../../data/redis.ts";

const userFactory = new UserFactory();

beforeAll(async () => {
    await data.useTestDb();
});

describe("User created without password tests", () => {
    const password = "correcthorsebatterystaple";
    let user: UserResource;

    test.sequential("Create user", async () => {
        user = await userFactory.create(userFactory.newContent({
            name: "Jane",
            username: "userName",
        })) as UserResource;
        expect(user).toBeTypeOf("object");
    });

    test.sequential("Blocked login before password set", async () => {
        const validPassword = await userFactory.checkPassword(user, password);
        expect(validPassword).toBeFalsy();
    });

    test.sequential("Set password", async () => {
        expect(await userFactory.setPassword(user, password)).toBeUndefined();
    });

    test.sequential("Successful login 1", async () => {
        const validPassword = await userFactory.checkPassword(user, password);
        expect(validPassword).toBeTruthy();
    });

    test.sequential("Unsuccessful login", async () => {
        const validPassword = await userFactory.checkPassword(user, "password");
        expect(validPassword).toBeFalsy();
    });

    test.sequential("Update user", async () => {
        user = await userFactory.save(user.id, user) as UserResource;
        expect(user).toBeTypeOf("object");
    });

    test.sequential("Successful login 2", async () => {
        const validPassword = await userFactory.checkPassword(user, password);
        expect(validPassword).toBeTruthy();
    });

    test.sequential("Delete user", async () => {
        expect(await userFactory.delete(user.id)).toBeUndefined();
    });
});

describe("User created with password tests", () => {
    const password = "correcthorsebatterystaple";
    let user: UserResource;

    test.sequential("Create user", async () => {
        user = await userFactory.create(userFactory.newContent({
            name: "Mark",
            username: "nameUser",
            password: password,
        })) as UserResource;
        expect(user).toBeTypeOf("object");
    });

    test.sequential("Successful login", async () => {
        const validPassword = await userFactory.checkPassword(user, password);
        expect(validPassword).toBeTruthy();
    });

    test.sequential("Unsuccessful login", async () => {
        const validPassword = await userFactory.checkPassword(user, "password");
        expect(validPassword).toBeFalsy();
    });

    test.sequential("Delete user", async () => {
        expect(await userFactory.delete(user.id)).toBeUndefined();
    });
});
