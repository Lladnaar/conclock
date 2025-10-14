import express from "express";
import type {ResourceId, ResourceContent} from "./resource.ts";
import {ResourceFactory, InvalidResourceError} from "./resource.ts";
import {Rest} from "../http/rest.ts";

// Types

type EventContent = ResourceContent & {
    startDate: Date;
    endDate: Date;
};

export type Event = ResourceId & EventContent;

// Factory

export class EventFactory extends ResourceFactory {
    constructor() { super("event"); }

    newContent(content: object): EventContent {
        if (!this.isValid(content)) throw new InvalidResourceError("Invalid event");

        return {
            ...super.newContent(content),
            startDate: content.startDate,
            endDate: content.endDate,
        };
    }

    isValid(item: object): item is EventContent {
        return super.isValid(item)
            && ("startDate" in item && typeof item.name === "string")
            && ("endDate" in item && typeof item.name === "string");
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
