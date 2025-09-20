import {describe, expect, test} from "vitest";
import axios from "axios";
import config from "../config.ts";

const baseUrl = `http://localhost:${config.server.port}/api`;

describe("Root", () => {
    test("Core endpoints exist", async () => {
        const response = await axios.get(baseUrl);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("time");
        expect(response.data).toHaveProperty("user");
        expect(response.data).toHaveProperty("event");
    });
});
