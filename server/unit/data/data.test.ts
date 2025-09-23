import {describe, expect, test} from "vitest";
import * as data from "../../data/data.ts";

describe("data", () => {
    let id = "uu-ii-dd";
    const record = {name: "value", description: "description"};
    const recordWithNewValue = {name: "newValue", altName: "value"};
    const recordWithNewValueAndUpdate = {name: "newValue", altName: "value", added: "newValue"};

    test.sequential("list empty section", async () => {
        const emptyList: string[] = await data.list("section");
        expect(emptyList).toEqual([]);
    });

    test.sequential("get no items", async () => {
        await expect(() => data.get("section", id)).rejects.toThrow(`No data found for type=section id=${id}`);
    });

    test.sequential("add first item", async () => {
        id = await data.add("section", record);
        expect(id).not.toBeUndefined();
        expect(id).not.toBeNull();
    });

    test.sequential("list section with one item", async () => {
        const sectionList: string[] = await data.list("section");
        expect(sectionList).toEqual([id]);
    });

    test.sequential("get one item", async () => {
        const foundRecord = await data.get("section", id);
        expect(foundRecord).toEqual(record);
    });

    test.sequential("overwrite only item", async () => {
        const returnValue = await data.set("section", id, recordWithNewValue);
        expect(returnValue).toBeUndefined();
    });

    test.sequential("get one overwritten item", async () => {
        const foundRecord = await data.get("section", id);
        expect(foundRecord).toEqual(recordWithNewValue);
    });

    test.sequential("update only item", async () => {
        const returnValue = await data.update("section", id, {added: "newValue"});
        expect(returnValue).toBeUndefined();
    });

    test.sequential("get one updated item", async () => {
        const foundRecord = await data.get("section", id);
        expect(foundRecord).toEqual(recordWithNewValueAndUpdate);
    });

    test.sequential("delete", async () => {
        const returnValue = await data.del("section", id);
        expect(returnValue).toBeUndefined();
    });

    test.sequential("get no item after deleted", async () => {
        await expect(() => data.get("section", id)).rejects.toThrow(`No data found for type=section id=${id}`);
    });

    test.sequential("find nothing", async () => {
        const returnValue = await data.find("section", "name", "value");
        expect(returnValue).toBeNull();
    });

    test.sequential("find first item", async () => {
        id = await data.add("section", record);
        await data.add("section", recordWithNewValue);
        const foundId = await data.find("section", "name", "value");
        expect(foundId).toEqual(id);
    });
});
