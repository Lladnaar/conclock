/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, expect, test, beforeAll} from "vitest";
import axios from "axios";
import config from "../config.ts";
import {StatusCodes as http} from "http-status-codes";

function makeUrl(url: string) { return new URL(url, `http://localhost:${config.server.port}/`).href; }
let userUrl: string;
let loginUrl: string;

beforeAll(async () => {
    const response = await axios.get(makeUrl("api"));
    userUrl = makeUrl(response.data.user.url);
    loginUrl = makeUrl(response.data.login.url);
});

describe("Basic authentication...", () => {
    const userData = {
        name: "Basic Auth User",
        username: "basic@auth.user",
    };
    let user: Record<string, any> = {};
    const password1 = "correcthorsebatterystaple";
    const password2 = "rightponycapacitornail";

    test.sequential("...user created without password", async () => {
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

    test.runIf(user).sequential("...login fails before password set", async () => {
        await expect(axios.post(loginUrl, {}, {auth: {username: user.username, password: password1}}))
            .rejects.toThrowError(expect.objectContaining({status: http.UNAUTHORIZED}));
    });

    test.runIf(user).sequential("...password set", async () => {
        const url = makeUrl(user.password.url);
        const response = await axios.post(url, {password: password1});
        expect(response.status).toBe(http.OK);
    });

    test.runIf(user).sequential("...login succeeds with password", async () => {
        const response = await axios.post(loginUrl, {}, {auth: {username: user.username, password: password1}});
        expect(response.status).toBe(http.OK);
        expect(response.headers).toHaveProperty("set-cookie");
        expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([expect.stringContaining("Session-Token=")]));
    });

    test.runIf(user).sequential("...password changed", async () => {
        const url = makeUrl(user.password.url);
        const response = await axios.post(url, {oldPassword: password1, password: password2});
        expect(response.status).toBe(http.OK);
    });

    test.runIf(user).sequential("...login succeeds with new password", async () => {
        const response = await axios.post(loginUrl, {}, {auth: {username: user.username, password: password2}});
        expect(response.status).toBe(http.OK);
        expect(response.headers).toHaveProperty("set-cookie");
        expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([expect.stringContaining("Session-Token=")]));
    });

    test.runIf(user).sequential("...login fails with old password", async () => {
        await expect(axios.post(loginUrl, {}, {auth: {username: user.username, password: password1}}))
            .rejects.toThrowError(expect.objectContaining({status: http.UNAUTHORIZED}));
    });

    test.runIf(user).sequential("...user deleted", async () => {
        const response = await axios.delete(makeUrl(user.url!));
        expect(response.status).toBe(http.NO_CONTENT);
    });
});

describe("Mixed authentication...", async () => {
    const user = {
        id: "",
        url: "",
        name: "Mixed Auth User",
        username: "mixed@auth.user",
        password: "correcthorsebatterystaple",
    };
    let token: string;

    test.sequential("...user created", async () => {
        const response = await axios.post(userUrl, user);
        expect(response.status).toBe(http.CREATED);
        user.url = response.data.url;
    });

    test.runIf(user).sequential("...succeeds with correct basic auth", async () => {
        const response = await axios.post(loginUrl, {}, {auth: {username: user.username, password: user.password}});
        expect(response.status).toBe(http.OK);
        expect(response.data).toHaveProperty("sessionToken");
        token = response.data.sessionToken;
    });

    test.runIf(user).sequential("...fails with wrong basic auth", async () => {
        await expect(axios.post(loginUrl, {}, {auth: {username: user.username, password: "password"}}))
            .rejects.toThrowError(expect.objectContaining({status: http.UNAUTHORIZED}));
    });

    test.runIf(user).sequential("...succeeds with correct cookie token", async () => {
        const response = await axios.post(loginUrl, {}, {headers: {Cookie: `Session-Token=${token}`}});
        expect(response.status).toBe(http.OK);
    });

    test.runIf(user).sequential("...fails with wrong cookie token", async () => {
        await expect(axios.post(loginUrl, {}, {headers: {Cookie: "Session-Token=token"}}))
            .rejects.toThrowError(expect.objectContaining({status: http.UNAUTHORIZED}));
    });

    test.runIf(user).sequential("...succeeds with correct bearer token", async () => {
        const response = await axios.post(loginUrl, {}, {headers: {Authorization: `Bearer ${token}`}});
        expect(response.status).toBe(http.OK);
    });

    test.runIf(user).sequential("...fails with incorrect bearer token", async () => {
        await expect(axios.post(loginUrl, {}, {headers: {Authorization: "Bearer token"}}))
            .rejects.toThrowError(expect.objectContaining({status: http.UNAUTHORIZED}));
    });

    test.runIf(user).sequential("...user deleted", async () => {
        const response = await axios.delete(makeUrl(user.url!));
        expect(response.status).toBe(http.NO_CONTENT);
    });
});
