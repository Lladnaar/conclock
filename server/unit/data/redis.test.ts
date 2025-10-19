/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, expect, test, vi, beforeEach} from "vitest";
import {v7 as uuid} from "uuid";
import * as data from "../../data/redis.ts";

vi.mock("uuid", () => ({
    v7: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

const type = "test";

describe("Redis...", () => {
    test("...insert key", async () => {
        const id = "00000000-0000-0000-0000-000000000000";
        vi.mocked(uuid).mockReturnValue(id as any);
        const record = {one: 1};

        const newId = data.add(type, record);
        await expect(newId).resolves.toEqual(id);

        await data.del(type, id);
    });

    test("...get key", async () => {
        const id = "11111111-1111-1111-1111-111111111111";
        vi.mocked(uuid).mockReturnValue(id as any);
        const record = {foo: "bar", num: 42};
        await data.add(type, record);

        const fetched = await data.get(type, id);
        expect(fetched).toEqual(record);

        await data.del(type, id);
    });

    test("...list keys", async () => {
        const id1 = "22222222-2222-2222-2222-222222222222";
        const id2 = "33333333-3333-3333-3333-333333333333";
        vi.mocked(uuid).mockReturnValueOnce(id1 as any);
        await data.add(type, {a: 1});
        vi.mocked(uuid).mockReturnValueOnce(id2 as any);
        await data.add(type, {b: 2});

        const keys = await data.list(type);
        expect(keys).toEqual(expect.arrayContaining([id1, id2]));

        await data.del(type, id1);
        await data.del(type, id2);
    });

    test("...exists returns true for present key", async () => {
        const id = "44444444-4444-4444-4444-444444444444";
        vi.mocked(uuid).mockReturnValue(id as any);
        await data.add(type, {x: 1});

        const exists = await data.exists(type, id);
        expect(exists).toBe(true);

        await data.del(type, id);
    });

    test("...exists returns false for missing key", async () => {
        const exists = await data.exists(type, "nonexistent-id");
        expect(exists).toBe(false);
    });

    test("...set updates an existing key", async () => {
        const id = "5555555-5555-5555-5555-555555555555";
        vi.mocked(uuid).mockReturnValue(id as any);
        await data.add(type, {a: 1});

        await data.set(type, id, {a: 2, b: 3});
        const updated = await data.get(type, id);
        expect(updated).toEqual({a: 2, b: 3});

        await data.del(type, id);
    });

    test("...update merges with existing record", async () => {
        const id = "66666666-6666-6666-6666-666666666666";
        vi.mocked(uuid).mockReturnValue(id as any);
        await data.add(type, {a: 1, b: 2});

        await data.update(type, id, {b: 3, c: 4});
        const updated = await data.get(type, id);
        expect(updated).toEqual({a: 1, b: 3, c: 4});

        await data.del(type, id);
    });

    test("...find returns id for matching property", async () => {
        const id = "77777777-7777-7777-7777-777777777777";
        vi.mocked(uuid).mockReturnValue(id as any);
        await data.add(type, {fu: "bar"});

        const found = await data.find(type, "fu", "bar");
        expect(found).toBe(id);

        await data.del(type, id);
    });

    test("...find returns null if no match", async () => {
        const found = await data.find(type, "notfound", 123);
        expect(found).toBeNull();
    });

    test("...del removes a key", async () => {
        const id = "88888888-8888-8888-8888-888888888888";
        vi.mocked(uuid).mockReturnValue(id as any);
        await data.add(type, {z: 9});

        await data.del(type, id);
        await expect(data.get(type, id)).rejects.toThrow(data.LookupError);
    });

    test("...get throws LookupError for missing key", async () => {
        await expect(data.get(type, "missing-id")).rejects.toThrow(data.LookupError);
    });

    test("...get throws FormatError for corrupted data", async () => {
        const id = "99999999-9999-9999-9999-999999999999";
        vi.mocked(uuid).mockReturnValue(id as any);
        // Insert invalid JSON directly
        const key = `test:${id}`;
        await data.__test.client.set(key, "{notjson");

        await expect(data.get(type, id)).rejects.toThrow(data.FormatError);
        await data.del(type, id);
    });
});
