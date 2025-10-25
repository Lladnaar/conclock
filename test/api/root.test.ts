import {test, expect} from "@playwright/test";
import {StatusCodes as http} from "http-status-codes";

function url(url: string) { return new URL(url, "http://localhost:8080/").href; }

test.describe("Root...", () => {
    test("...endpoints exist", async ({request}) => {
        const response = await request.get(url("api"));
        expect(response.status()).toBe(http.OK);

        const body = await response.json();
        expect(body).toHaveProperty("time");
        expect(body).toHaveProperty("user");
        expect(body).toHaveProperty("login");
        expect(body).toHaveProperty("event");
    });
});
