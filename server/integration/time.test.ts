import {describe, expect, test, beforeAll} from "vitest";
import axios from "axios";
import config from "../config.ts";

const baseUrl = `http://localhost:${config.server.port}/api`;
let timeUrl: string;

beforeAll(async () => {
    const response = await axios.get(baseUrl);
    timeUrl = new URL(response.data.time.url, baseUrl).href;
});

describe("Time", () => {
    test("GET time reports time", async () => {
        const response = await axios.get(timeUrl);
        expect(response.status).toBe(200);
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
