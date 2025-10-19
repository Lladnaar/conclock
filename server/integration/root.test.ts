import {describe, expect, test} from "vitest";
import axios from "axios";
import config from "../config.ts";
import {StatusCodes as http} from "http-status-codes";

function makeUrl(url: string) { return new URL(url, `http://localhost:${config.server.port}/`).href; }

describe("Root", () => {
    test("Core endpoints exist", async () => {
        const response = await axios.get(makeUrl("api"));

        expect(response.status).toBe(http.OK);
        expect(response.data).toHaveProperty("time");
        expect(response.data).toHaveProperty("user");
        expect(response.data).toHaveProperty("login");
        expect(response.data).toHaveProperty("event");
    });
});
