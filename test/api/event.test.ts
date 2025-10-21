/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, expect, test, beforeAll} from "vitest";
import axios from "axios";
import config from "../../server/config.ts";

import {StatusCodes as http} from "http-status-codes";

function makeUrl(url: string) { return new URL(url, `http://localhost:${config.server.port}/`).href; }
let eventUrl: string;

beforeAll(async () => {
    const response = await axios.get(makeUrl("api"));
    eventUrl = makeUrl(response.data.event.url);
});

describe("Event resource...", () => {
    const eventData = {
        name: "Testercon",
        startDate: "2025-09-13",
        endDate: "2025-09-20",
    };
    let event: Record<string, any> = {};

    test.sequential("...created", async () => {
        const response = await axios.post(eventUrl, eventData);
        expect(response.status).toBe(http.CREATED);
        expect(response.data).toHaveProperty("id");
        expect(response.data).toHaveProperty("url");
        expect(response.data).toHaveProperty("name", eventData.name);
        expect(response.data).toHaveProperty("startDate", eventData.startDate);
        expect(response.data).toHaveProperty("endDate", eventData.endDate);

        event = response.data;
    });

    test.runIf(event).sequential("...exists", async () => {
        const response = await axios.get(makeUrl(event.url));
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(event);
    });

    test.runIf(event).sequential("...updated", async () => {
        event.name = "Testercon II";
        event.startDate = "2026-09-13";
        event.endDate = "2026-09-17";

        const response = await axios.put(makeUrl(event.url), event);
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(event);
    });

    test.runIf(event).sequential("...exists on list", async () => {
        const response = await axios.get(eventUrl);
        expect(response.status).toBe(http.OK);
        expect(response.data).toEqual(expect.arrayContaining([expect.objectContaining({id: event.id})]));
    });

    test.runIf(event).sequential("...deleted", async () => {
        const response = await axios.delete(makeUrl(event.url));
        expect(response.status).toBe(http.NO_CONTENT);
    });

    test.runIf(event).sequential("...missing", async () => {
        await expect(axios.get(makeUrl(event.url))).rejects.toThrowError(expect.objectContaining({status: http.NOT_FOUND}));
    });
});
