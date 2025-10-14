import {describe, expect, test, beforeAll} from "vitest";
import axios from "axios";
import config from "../config.ts";
import {StatusCodes as http} from "http-status-codes";

const baseUrl = `http://localhost:${config.server.port}/api`;
let userUrl: string;

beforeAll(async () => {
    const response = await axios.get(baseUrl);
    userUrl = new URL(response.data.user.url, baseUrl).href;
});

describe("Basic edit sequence test", () => {
    const user = {
        id: "USERID",
        url: "URL",
        name: "Jane",
        username: "userName",
        password: "passWord",
    };

    test.sequential("POST to create", async () => {
        const response = await axios.post(userUrl, user);
        expect(response.status).toBe(http.CREATED);
        expect(response.data).toHaveProperty("id");
        expect(response.data).toHaveProperty("url");
        expect(response.data).toHaveProperty("name", user.name);
        expect(response.data).toHaveProperty("username", user.username);
        expect(response.data).toHaveProperty("password", user.password);

        user.id = response.data.id;
        user.url = response.data.url;
    });

    test.sequential("GET to check", async () => {
        const response = await axios.get(new URL(user.url, baseUrl).href);
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(user);
    });

    test.sequential("PUT to update", async () => {
        user.username = "jane42";
        user.password = "correcthorsebatterystaple";

        const response = await axios.put(new URL(user.url, baseUrl).href, user);
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(user);
    });

    test.sequential("GET to list", async () => {
        const response = await axios.get(userUrl);
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(expect.arrayContaining([expect.objectContaining({id: user.id})]));
    });

    test.sequential("DELETE to remove", async () => {
        const response = await axios.delete(new URL(user.url, baseUrl).href);
        expect(response.status).toBe(http.NO_CONTENT);
    });

    test.sequential("GET to find missing", async () => {
        await expect(axios.get(new URL(user.url, baseUrl).href)).rejects.toThrowError(expect.objectContaining({status: http.NOT_FOUND}));
    });
});
