/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, expect, test, beforeAll} from "vitest";
import axios from "axios";
import config from "../../server/config.ts";
import {StatusCodes as http} from "http-status-codes";

function makeUrl(url: string) { return new URL(url, `http://localhost:${config.server.port}/`).href; }
let userUrl: string;

beforeAll(async () => {
    const response = await axios.get(makeUrl("api"));
    userUrl = makeUrl(response.data.user.url);
});

describe("User resource...", () => {
    const userData = {
        name: "Test Resource User",
        username: "test1@resource.user",
    };
    let user: Record<string, any> = {};

    test.sequential("...created", async () => {
        const response = await axios.post(userUrl, userData);
        expect(response.status).toBe(http.CREATED);
        expect(response.data).toHaveProperty("id");
        expect(response.data).toHaveProperty("url");
        expect(response.data).toHaveProperty("name", userData.name);
        expect(response.data).toHaveProperty("username", userData.username);
        expect(response.data).toHaveProperty("password");
        expect(response.data.password).toHaveProperty("url");

        user = response.data;
    });

    test.runIf(user).sequential("...exists", async () => {
        const response = await axios.get(makeUrl(user.url));
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(user);
    });

    test.runIf(user).sequential("...updated", async () => {
        user.username = "test2@resource.user";

        const response = await axios.put(makeUrl(user.url), user);
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(user);
    });

    test.runIf(user).sequential("...exists on list", async () => {
        const response = await axios.get(userUrl);
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(expect.arrayContaining([expect.objectContaining({id: user.id})]));
    });

    test.runIf(user).sequential("...deleted", async () => {
        const response = await axios.delete(makeUrl(user.url));
        expect(response.status).toBe(http.NO_CONTENT);
    });

    test.runIf(user).sequential("...missing", async () => {
        await expect(axios.get(makeUrl(user.url))).rejects.toThrowError(expect.objectContaining({status: http.NOT_FOUND}));
    });
});

describe("Password...", () => {
    let user: Record<string, any> = {
        name: "Password Resource User",
        username: "password@resource.user",
    };
    const password1 = "correcthorsebatterystaple";
    const password2 = "rightponycapacitornail";

    test.sequential("...not yet set on new user", async () => {
        const response = await axios.post(userUrl, user);
        expect(response.status).toBe(http.CREATED);

        user = response.data;
    });

    test.runIf(user).sequential("...unconditionally changed", async () => {
        const password = {password: password1};
        const response = await axios.post(makeUrl(user.password.url), password);
        expect(response.status).toBe(http.OK);
    });

    test.runIf(user).sequential("...changed with old password", async () => {
        const password = {oldPassword: password1, password: password2};
        const response = await axios.post(makeUrl(user.password.url), password);
        expect(response.status).toBe(http.OK);
    });

    test.runIf(user).sequential("...fails to change with wrong old", async () => {
        const password = {oldPassword: password1, password: password2};
        await expect(axios.post(makeUrl(user.password.url), password)).rejects.toThrowError(expect.objectContaining({status: http.BAD_REQUEST}));
    });

    test.runIf(user).sequential("...deleted", async () => {
        const response = await axios.delete(makeUrl(user.url));
        expect(response.status).toBe(http.NO_CONTENT);
    });
});

describe("System fails...", () => {
    test("...create without username", async () => {
        const user = {
            name: "Failing Resource User",
        };

        await expect(axios.post(userUrl, user)).rejects.toThrowError(expect.objectContaining({status: http.BAD_REQUEST}));
    });
});
