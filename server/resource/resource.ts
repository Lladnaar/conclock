import * as data from "../data/redis.ts";

export class InvalidResourceError extends Error {}
export class MissingResourceError extends Error {}

export type ResourceId = {
    id: string;
    url?: string;
};

export type ResourceContent = {name: string};

export type Resource = ResourceId & ResourceContent;

export class ResourceFactory {
    type: string;

    constructor(type: string) {
        this.type = type;
    }

    newId(id: string): ResourceId { return {id}; }

    newResource(id: ResourceId, content: ResourceContent): Resource { return {...id, ...content}; }

    newContent(content: object): ResourceContent {
        if (!this.isValid(content)) throw new InvalidResourceError("Invalid resource");

        return {name: content.name};
    }

    isValid(item: object): item is ResourceContent {
        return ("name" in item && typeof item.name === "string");
    }

    async loadAll(): Promise<ResourceId[]> {
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

    toRest(item: ResourceId): object {
        return {
            id: item.id,
            url: `/api/${this.type}/${item.id}`,
            ...(this.isValid(item) ? this.newContent(item) : {}),
        };
    }

    toData(item: ResourceContent): data.Record {
            return this.newContent(item);
    }
}
