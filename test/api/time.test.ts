import {test, expect} from "@playwright/test";
import {StatusCodes as http} from "http-status-codes";

function url(url: string) { return new URL(url, "http://localhost:8080/").href; }
let timeUrl: string;

test.beforeAll(async ({request}) => {
    const response = await request.get(url("api"));
    const body = await response.json();
    timeUrl = url(body.time.url);
});

test.describe("Time...", () => {
    test("...reports time", async ({request}) => {
        const response = await request.get(timeUrl);
        expect(response.status()).toBe(http.OK);

        const body = await response.json();
        expect(body).toHaveProperty("time");
        expect(body.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
});
