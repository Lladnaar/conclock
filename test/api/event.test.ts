import {test, expect} from "@playwright/test";
import {StatusCodes as http} from "http-status-codes";

function url(url: string) { return new URL(url, "http://localhost:8080/").href; }
let eventUrl: string;

test.beforeAll(async ({request}) => {
    const response = await request.get(url("api"));
    const body = await response.json();
    eventUrl = url(body.event.url);
});

test.describe("Event resource...", () => {
    test.describe.configure({mode: "serial"});

    const eventData = {
        name: "Testercon",
        startDate: "2025-09-13",
        endDate: "2025-09-20",
    };
    type Event = {id: string; url: string; name: string; startDate: string; endDate: string};
    let event: Event;

    test("...created", async ({request}) => {
        const response = await request.post(eventUrl, {data: eventData});
        expect(response.status()).toBe(http.CREATED);

        const body = await response.json();
        expect(body).toHaveProperty("id");
        expect(body).toHaveProperty("url");
        expect(body).toHaveProperty("name", eventData.name);
        expect(body).toHaveProperty("startDate", eventData.startDate);
        expect(body).toHaveProperty("endDate", eventData.endDate);

        event = body;
    });

    test("...exists", async ({request}) => {
        const response = await request.get(url(event.url));
        expect(response.status()).toBe(http.OK);

        const body = await response.json();
        expect(body).toEqual(event);
    });

    test("...updated", async ({request}) => {
        event.name = "Testercon II";
        event.startDate = "2026-09-13";
        event.endDate = "2026-09-17";

        const response = await request.put(url(event.url), {data: event});
        expect(response.status()).toBe(http.OK);

        const body = await response.json();
        expect(body).toEqual(event);
    });

    test("...exists on list", async ({request}) => {
        const response = await request.get(eventUrl);
        expect(response.status()).toBe(http.OK);

        const body = await response.json();
        expect(body).toEqual(expect.arrayContaining([expect.objectContaining({id: event.id})]));
    });

    test("...deleted", async ({request}) => {
        const response = await request.delete(url(event.url));
        expect(response.status()).toBe(http.NO_CONTENT);
    });

    test("...missing", async ({request}) => {
        const response = await request.get(url(event.url));
        expect(response.status()).toBe(http.NOT_FOUND);
    });
});
