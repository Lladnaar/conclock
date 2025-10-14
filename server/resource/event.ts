import express from "express";
import type {Id, Content} from "./resource.ts";
import {ResourceFactory, InvalidResourceError} from "./resource.ts";
import {Rest} from "../http/rest.ts";

// Types

type Event = Content & {
    startDate: Date;
    endDate: Date;
};

export type EventResource = Id & Event;

// Factory

export class EventFactory extends ResourceFactory {
    constructor() { super("event"); }

    newContent(content: object): Event {
        if (!this.isValid(content)) throw new InvalidResourceError("Invalid event");

        return {
            ...super.newContent(content),
            startDate: new Date(content.startDate),
            endDate: new Date(content.endDate),
        };
    }

    isValid(item: object): item is Event {
        return super.isValid(item)
            && ("startDate" in item && typeof item.name === "string")
            && ("endDate" in item && typeof item.name === "string");
    }

    toRest(item: EventResource): object {
        return {
            ...super.toRest(item),
            startDate: item.startDate?.toISOString()?.slice(0, 10),
            endDate: item.endDate?.toISOString()?.slice(0, 10),
        };
    }

    toData(item: Event) {
        return {
            ...super.toData(item),
            startDate: item.startDate?.toISOString()?.slice(0, 10),
            endDate: item.endDate?.toISOString()?.slice(0, 10),
        };
    }
}

// Router

const eventRest = new Rest(new EventFactory());

const router = express.Router();
router.get("/", eventRest.getAll.bind(eventRest));
router.get("/:id", eventRest.get.bind(eventRest));
router.post("/", eventRest.post.bind(eventRest));
router.put("/:id", eventRest.put.bind(eventRest));
router.delete("/:id", eventRest.delete.bind(eventRest));

export default router;
