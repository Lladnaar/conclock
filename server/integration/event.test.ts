import {describe, expect, test, beforeAll} from "vitest";
import axios from "axios";
import config from "../config.ts";
import {StatusCodes as http} from "http-status-codes";

const baseUrl = `http://localhost:${config.server.port}/api`;
let eventUrl: string;

beforeAll(async () => {
    const response = await axios.get(baseUrl);
    eventUrl = new URL(response.data.event.url, baseUrl).href;
});

describe("Postman event sequence test", () => {
    const event = {
        id: "EVENTID",
        url: "URL",
        name: "Testercon",
        startDate: "2025-09-13",
        endDate: "2025-09-20",
    };

    test.sequential("POST to create", async () => {
        const response = await axios.post(eventUrl, event);
        expect(response.status).toBe(http.CREATED);
        expect(response.data).toHaveProperty("id");
        expect(response.data).toHaveProperty("url");
        expect(response.data).toHaveProperty("name", event.name);
        expect(response.data).toHaveProperty("startDate", event.startDate);
        expect(response.data).toHaveProperty("endDate", event.endDate);

        event.id = response.data.id;
        event.url = response.data.url;
    });

    test.sequential("GET to check", async () => {
        const response = await axios.get(new URL(event.url, baseUrl).href);
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(event);
    });

    test.sequential("PUT to update", async () => {
        event.name = "Testercon II";
        event.startDate = "2026-09-13";
        event.endDate = "2026-09-17";

        const response = await axios.put(new URL(event.url, baseUrl).href, event);
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(event);
    });

    test.sequential("GET to list", async () => {
        const response = await axios.get(eventUrl);
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(expect.arrayContaining([expect.objectContaining({id: event.id})]));
    });

    test.sequential("DELETE to remove", async () => {
        const response = await axios.delete(new URL(event.url, baseUrl).href);
        expect(response.status).toBe(http.NO_CONTENT);
    });

    test.sequential("GET to find missing", async () => {
        await expect(axios.get(new URL(event.url, baseUrl).href)).rejects.toThrowError(expect.objectContaining({status: http.NOT_FOUND}));
    });
});
