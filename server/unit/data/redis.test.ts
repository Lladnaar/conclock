import {describe, expect, test, vi, beforeAll, beforeEach} from "vitest";
import {v7 as uuid} from "uuid";
import * as data from "../../data/redis.ts";

vi.mock("uuid", () => ({
    v7: vi.fn(),
}));

beforeAll(async () => {
    await data.useTestDb();
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe("Redis", () => {
    test("Insert key", async () => {
        const id = "00000000-0000-0000-0000-000000000000";
        vi.mocked(uuid).mockReturnValue(id as unknown as Buffer);
        const record = {one: 1};

        const newId = data.add("test", record);
        await expect(newId).resolves.toEqual(id);
    });

    test("Get inserted key", async () => {
        const id = "11111111-1111-1111-1111-111111111111";
        vi.mocked(uuid).mockReturnValue(id as unknown as Buffer);
        const record = {foo: "bar", num: 42};
        await data.add("test", record);

        const fetched = await data.get("test", id);
        expect(fetched).toEqual(record);
    });

    test("List keys", async () => {
        const id1 = "22222222-2222-2222-2222-222222222222";
        const id2 = "33333333-3333-3333-3333-333333333333";
        vi.mocked(uuid).mockReturnValueOnce(id1 as unknown as Buffer);
        await data.add("test", {a: 1});
        vi.mocked(uuid).mockReturnValueOnce(id2 as unknown as Buffer);
        await data.add("test", {b: 2});

        const keys = await data.list("test");
        expect(keys).toEqual(expect.arrayContaining([id1, id2]));
    });

    test("Exists returns true for present key", async () => {
        const id = "44444444-4444-4444-4444-444444444444";
        vi.mocked(uuid).mockReturnValue(id as unknown as Buffer);
        await data.add("test", {x: 1});
        const exists = await data.exists("test", id);
        expect(exists).toBe(true);
    });

    test("Exists returns false for missing key", async () => {
        const exists = await data.exists("test", "nonexistent-id");
        expect(exists).toBe(false);
    });

    test("Set updates an existing key", async () => {
        const id = "55555555-5555-5555-5555-555555555555";
        vi.mocked(uuid).mockReturnValue(id as unknown as Buffer);
        await data.add("test", {a: 1});
        await data.set("test", id, {a: 2, b: 3});
        const updated = await data.get("test", id);
        expect(updated).toEqual({a: 2, b: 3});
    });

    test("Del removes a key", async () => {
        const id = "88888888-8888-8888-8888-888888888888";
        vi.mocked(uuid).mockReturnValue(id as unknown as Buffer);
        await data.add("test", {z: 9});
        await data.del("test", id);
        await expect(data.get("test", id)).rejects.toThrow(data.LookupError);
    });

    test("Get throws LookupError for missing key", async () => {
        await expect(data.get("test", "missing-id")).rejects.toThrow(data.LookupError);
    });

    test("Get throws FormatError for corrupted data", async () => {
        const id = "99999999-9999-9999-9999-999999999999";
        vi.mocked(uuid).mockReturnValue(id as unknown as Buffer);
        // Insert invalid JSON directly
        const key = `test:${id}`;
        await data.__test.client.set(key, "{notjson");
        await expect(data.get("test", id)).rejects.toThrow(data.FormatError);
    });
});
