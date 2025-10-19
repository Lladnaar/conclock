import {describe, expect, test, beforeAll} from "vitest";
import axios from "axios";
import config from "../config.ts";
import {StatusCodes as http} from "http-status-codes";

function makeUrl(url: string) { return new URL(url, `http://localhost:${config.server.port}/`).href; }
let timeUrl: string;

beforeAll(async () => {
    const response = await axios.get(makeUrl("api"));
    timeUrl = makeUrl(response.data.time.url);
});

describe("Time", () => {
    test("GET time reports time", async () => {
        const response = await axios.get(timeUrl);
        expect(response.status).toBe(http.OK);
        expect(response.data).toHaveProperty("time");
        expect(response.data.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    test("POST time fails", async () => {
        await expect(axios.post(timeUrl)).rejects.toThrowError();
    });

    test("PUT time fails", async () => {
        await expect(axios.put(timeUrl)).rejects.toThrowError();
    });

    test("DELETE time fails", async () => {
        await expect(axios.delete(timeUrl)).rejects.toThrowError();
    });
});
