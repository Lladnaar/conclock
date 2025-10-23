import * as data from "../data/redis.ts";

export class InvalidResourceError extends Error {}
export class MissingResourceError extends Error {}

export type Id = {
    id: string;
    url?: string;
};

export type Content = {
    name: string;
    [key: string]: unknown;
};

export type Resource = Id & Content;

export class ResourceFactory {
    type: string;

    constructor(type: string) {
        this.type = type;
    }

    newId(id: string): Id { return {id}; }

    newResource(id: Id, content: Content): Resource { return {...id, ...content}; }

    newContent(content: object): Content {
        if (!this.isValid(content)) throw new InvalidResourceError("Invalid resource");

        return {name: content.name};
    }

    isValid(item: object): item is Content {
        return ("name" in item && typeof item.name === "string");
    }

    async loadAll(): Promise<Id[]> {
        const ids = await data.list(this.type);
        return ids.map(id => this.newId(id));
    }

    async load(id: string) {
        try {
            const content = await data.get(this.type, id);
            return this.newResource(this.newId(id), this.newContent(content));
        }
        catch (error) {
            if (error instanceof data.LookupError)
                throw new MissingResourceError(error.message);
            else
                throw error;
        }
    }

    async create(contentData: object) {
        const content = this.newContent(contentData);
        const id = await data.add(this.type, this.toData(content));
        return this.newResource(this.newId(id), content);
    }

    async save(id: string, content: object) {
        const resource = this.newResource(this.newId(id), this.newContent(content));
        await data.set(this.type, resource.id, this.toData(resource));
        return resource;
    }

    async delete(id: string): Promise<undefined> {
        await data.del(this.type, id);
        return undefined;
    }

    toRest(item: Id): object {
        return {
            id: item.id,
            url: this.makeUrl([item.id]),
            ...(this.isValid(item) ? this.newContent(item) : {}),
        };
    }

    toData(item: Content): data.Data {
        return {name: item.name};
    }

    makeUrl(path: string[]): string {
        return `/api/${this.type}/${path.join("/")}`;
    }
}
