/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, expect, test, beforeAll} from "vitest";
import axios from "axios";
import config from "../config.ts";
import {StatusCodes as http} from "http-status-codes";

const baseUrl = `http://localhost:${config.server.port}/api`;
let userUrl: string;
let loginUrl: string;

beforeAll(async () => {
    const response = await axios.get(baseUrl);
    userUrl = new URL(response.data.user.url, baseUrl).href;
    loginUrl = new URL(response.data.login.url, baseUrl).href;
});

describe("Standard user authorisation test", () => {
    let user: Record<string, any> = {
        id: "",
        url: "",
        name: "Jane",
        username: "userName",
    };
    const password1 = "correcthorsebatterystaple";
    const password2 = "rightponycapacitornail";

    test.sequential("POST to create", async () => {
        const response = await axios.post(userUrl, user);
        expect(response.status).toBe(http.CREATED);
        expect(response.data).toHaveProperty("id");
        expect(response.data).toHaveProperty("url");
        expect(response.data).toHaveProperty("name", user.name);
        expect(response.data).toHaveProperty("username", user.username);
        expect(response.data).toHaveProperty("password");
        expect(response.data.password).toHaveProperty("url");

        user = response.data;
    });

    test.sequential("Login declined with any password", async () => {
        await expect(axios.post(loginUrl, {}, {auth: {username: user.username, password: password1}}))
            .rejects.toThrowError(expect.objectContaining({status: http.UNAUTHORIZED}));
    });

    test.sequential("POST to set password", async () => {
        const url = new URL(user.password.url, userUrl).href;
        const response = await axios.post(url, {password: password1});
        expect(response.status).toBe(http.OK);
    });

    test.sequential("Login to check password 1", async () => {
        const response = await axios.post(loginUrl, {}, {auth: {username: user.username, password: password1}});
        expect(response.status).toBe(http.OK);
        expect(response.headers).toHaveProperty("set-cookie");
        expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([expect.stringContaining("Session-Token=")]));
    });

    test.sequential("POST to change password", async () => {
        const url = new URL(user.password.url, userUrl).href;
        const response = await axios.post(url, {oldPassword: password1, password: password2});
        expect(response.status).toBe(http.OK);
    });

    test.sequential("Login to check password 2", async () => {
        const response = await axios.post(loginUrl, {}, {auth: {username: user.username, password: password2}});
        expect(response.status).toBe(http.OK);
        expect(response.headers).toHaveProperty("set-cookie");
        expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([expect.stringContaining("Session-Token=")]));
    });

    test.sequential("Login declined with wrong password", async () => {
        await expect(axios.post(loginUrl, {}, {auth: {username: user.username, password: "password"}}))
            .rejects.toThrowError(expect.objectContaining({status: http.UNAUTHORIZED}));
    });

    test.sequential("DELETE to remove", async () => {
        const response = await axios.delete(new URL(user.url!, baseUrl).href);
        expect(response.status).toBe(http.NO_CONTENT);
    });
});

describe("All login methods", async () => {
    const user = {
        id: "",
        url: "",
        name: "Jane",
        username: "userNom",
        password: "correcthorsebatterystaple",
    };
    let token: string;

    test.sequential("POST to create", async () => {
        const response = await axios.post(userUrl, user);
        expect(response.status).toBe(http.CREATED);
        user.url = response.data.url;
    });

    test.sequential("Basic auth success", async () => {
        const response = await axios.post(loginUrl, {}, {auth: {username: user.username, password: user.password}});
        expect(response.status).toBe(http.OK);
        expect(response.data).toHaveProperty("sessionToken");
        token = response.data.sessionToken;
    });

    test.sequential("Basic auth failure", async () => {
        await expect(axios.post(loginUrl, {}, {auth: {username: user.username, password: "password"}}))
            .rejects.toThrowError(expect.objectContaining({status: http.UNAUTHORIZED}));
    });

    test.sequential("Token auth in cookie success", async () => {
        const response = await axios.post(loginUrl, {}, {headers: {Cookie: `Session-Token=${token}`}});
        expect(response.status).toBe(http.OK);
    });

    test.sequential("Token auth in cookie failure", async () => {
        await expect(axios.post(loginUrl, {}, {headers: {Cookie: "Session-Token=token"}}))
            .rejects.toThrowError(expect.objectContaining({status: http.UNAUTHORIZED}));
    });

    test.sequential("Token auth in header success", async () => {
        const response = await axios.post(loginUrl, {}, {headers: {Authorization: `Bearer ${token}`}});
        expect(response.status).toBe(http.OK);
    });

    test.sequential("Token auth in header failure", async () => {
        await expect(axios.post(loginUrl, {}, {headers: {Authorization: "Bearer token"}}))
            .rejects.toThrowError(expect.objectContaining({status: http.UNAUTHORIZED}));
    });

    test.sequential("DELETE to remove", async () => {
        const response = await axios.delete(new URL(user.url!, baseUrl).href);
        expect(response.status).toBe(http.NO_CONTENT);
    });
});
