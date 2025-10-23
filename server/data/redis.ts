import {createClient} from "redis";
import {v7 as uuid} from "uuid";
import config from "../config.ts";

export class LookupError extends Error {}
export class FormatError extends Error {}

type Value = number | string | boolean | undefined;
export type Data = {[key: string]: Value};

const client = createClient({url: config.redis.url});
client.on("connect", () => console.info("Connecing to Redis..."));
client.on("ready", () => console.info("Redis connected."));
client.on("error", error => console.error(`Redis Error: ${error.message || error.code}`));
client.on("reconnecting", () => console.info("Reconnecting to Redis..."));
client.connect();

class Key {
    type: string;
    id: string;

    constructor(key: string, type?: string) {
        if (type) {
            this.type = type;
            this.id = key;
        }
        else {
            const bits = key.split(":");
            if (bits[0] && bits[1] && !bits[2])
                [this.type, this.id] = bits;
            else
                throw new FormatError(`Key ${key} is invalid`);
        }
    }

    key() {
        return `${this.type}:${this.id}`;
    }
    toString() { return `<${this.key()}>`; }
}

export async function list(type: string): Promise<string[]> {
    const key = new Key("*", type);
    return (await client.keys(key.key()))
        .map(key => new Key(key).id);
}

export async function exists(type: string, id: string): Promise<boolean> {
    const key = new Key(id, type);
    return await client.exists(key.key()) > 0;
}

export async function get(type: string, id: string): Promise<Data> {
    const key = new Key(id, type);
    const jsonRecord = await client.get(key.key());
    if (jsonRecord) {
        try {
            return JSON.parse(jsonRecord);
        }
        catch {
            throw new FormatError(`Data for ${key} is corrupted`);
        }
    }
    else
        throw new LookupError(`No data found for ${key}`);
}

export async function add(type: string, record: Data): Promise<string> {
    const key = new Key(uuid(), type);
    await client.set(key.key(), JSON.stringify(record));
    return key.id;
}

export async function set(type: string, id: string, record: Data): Promise<void> {
    const key = new Key(id, type);
    const jsonContent = JSON.stringify(record);
    await client.set(key.key(), jsonContent);
}

export async function update(type: string, id: string, record: Data): Promise<void> {
    const existingRecord = await get(type, id);
    const updatedRecord = {...existingRecord, ...record};
    await set(type, id, updatedRecord);
}

export async function find(type: string, property: string, value: Value): Promise<string | null> {
    const matchKey = new Key("*", type);
    for await (const scanKeys of client.scanIterator({MATCH: matchKey.key()})) {
        for (const scanKey of scanKeys) {
            const key = new Key(scanKey);
            const item = await get(type, key.id);
            if (property in item && item[property] === value)
                return key.id;
        }
    }
    return null;
}

export async function del(type: string, id: string): Promise<void> {
    const key = new Key(id, type);
    await client.del(key.key());
}

export const __test = {
    client,
};
