/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, expect, test, beforeAll} from "vitest";
import axios from "axios";
import config from "../config.ts";
import {StatusCodes as http} from "http-status-codes";

function makeUrl(url: string) { return new URL(url, `http://localhost:${config.server.port}/`).href; }
let userUrl: string;

beforeAll(async () => {
    const response = await axios.get(makeUrl("api"));
    userUrl = makeUrl(response.data.user.url);
});

describe("Basic edit sequence test", () => {
    let user = {
        id: "USERID",
        url: "URL",
        name: "Jane",
        username: "userName",
    };

    test.sequential("POST to create", async () => {
        const response = await axios.post(userUrl, userData);
        expect(response.status).toBe(http.CREATED);
        expect(response.data).toHaveProperty("id");
        expect(response.data).toHaveProperty("url");
        expect(response.data).toHaveProperty("name", user.name);
        expect(response.data).toHaveProperty("username", user.username);
        expect(response.data).toHaveProperty("password");
        expect(response.data.password).toHaveProperty("url");

        user = response.data;
    });

    test.sequential("GET to check", async () => {
        const response = await axios.get(makeUrl(user.url));
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(user);
    });

    test.sequential("PUT to update", async () => {
        user.username = "jane42";

        const response = await axios.put(makeUrl(user.url), user);
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(user);
    });

    test.sequential("GET to list", async () => {
        const response = await axios.get(userUrl);
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(expect.arrayContaining([expect.objectContaining({id: user.id})]));
    });

    test.sequential("DELETE to remove", async () => {
        const response = await axios.delete(makeUrl(user.url));
        expect(response.status).toBe(http.NO_CONTENT);
    });

    test.sequential("GET to find missing", async () => {
        await expect(axios.get(makeUrl(user.url))).rejects.toThrowError(expect.objectContaining({status: http.NOT_FOUND}));
    });
});

describe("Password maintenance", () => {
    let user: Record<string, any> = {
        name: "Jane",
        username: "userName",
    };

    test.sequential("Create user without password", async () => {
        const response = await axios.post(userUrl, user);
        expect(response.status).toBe(http.CREATED);

        user = response.data;
    });

    test.sequential("Change password, without old", async () => {
        const password = {password: "password1"};
        const response = await axios.post(makeUrl(user.password.url), password);
        expect(response.status).toBe(http.OK);
    });

    test.sequential("Change password, with old", async () => {
        const password = {oldPassword: "password1", password: "password2"};
        const response = await axios.post(makeUrl(user.password.url), password);
        expect(response.status).toBe(http.OK);
    });

    test.sequential("Change password, with wrong old", async () => {
        const password = {oldPassword: "password1", password: "password3"};
        await expect(axios.post(makeUrl(user.password.url), password)).rejects.toThrowError(expect.objectContaining({status: http.BAD_REQUEST}));
    });
});

describe("Unhappy paths", () => {
    test("Create without username", async () => {
        const user = {name: "Jane"};

        await expect(axios.post(userUrl, user)).rejects.toThrowError(expect.objectContaining({status: http.BAD_REQUEST}));
    });
});
