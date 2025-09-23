import {v7 as uuid} from "uuid";

export class LookupError extends Error {}
export class FormatError extends Error {}

type Value = number | string | boolean | undefined;
type Record = {[key: string]: Value};

const data: Map<string, Map<string, Map<string, Value>>> = new Map();

export async function list(type: string): Promise<string[]> {
    const resourcesOfType = data.get(type);
    return resourcesOfType ? Array.from(resourcesOfType.keys()) : [];
}

export async function exists(type: string, id: string): Promise<boolean> {
    return data.get(type)?.get(id) ? true : false;
}

export async function get(type: string, id: string): Promise<Record> {
    const map = data.get(type)?.get(id);
    const record: Record = {};
    if (map) {
        for (const entry of map) {
            record[entry[0]] = entry[1];
        }
        return record;
    }
    throw new LookupError(`No data found for type=${type} id=${id}`);
}

export async function add(type: string, record: Record): Promise<string> {
    const id = uuid();
    await set(type, id, record);
    return id;
}

export async function set(type: string, id: string, record: Record): Promise<void> {
    const resourcesOfType = data.get(type);
    if (!resourcesOfType) data.set(type, new Map());
    const map = new Map();
    for (const key in record) {
        map.set(key, record[key]);
    }
    data.get(type)?.set(id, map);
}

export async function update(type: string, id: string, record: Record): Promise<void> {
    const map = data.get(type)?.get(id);
    if (map) {
        for (const key in record) {
            map.set(key, record[key]);
        }
    }
}

export async function find(type: string, property: string, value: Value): Promise<string | null> {
    const map = data.get(type);
    if (map) {
        for (const entry of map) {
            if (entry[1].get(property) === value) {
                return entry[0];
            }
        }
    }
    return null;
}

export async function del(type: string, id: string): Promise<void> {
    const map = data.get(type)?.get(id);
    if (map) {
        data.get(type)?.delete(id);
    }
}
