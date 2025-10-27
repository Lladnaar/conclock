import express from "express";
import {BadRequestError, NotFoundError} from "../http/error.ts";
import * as data from "../data/redis.ts";
import {StatusCodes as http} from "http-status-codes";
import {checkSchema, validationResult} from "express-validator";

type EventData = {
    name: string;
    startDate: string;
    endDate: string;
};

const eventSchema = {
    name: {isString: true, notEmpty: true, escape: true},
    startDate: {isString: true, isDate: true, notEmpty: true},
    endDate: {isString: true, isDate: true, notEmpty: true},
};

type EventResponse = {
    id: string;
    url: string;
} & Partial<EventData>;

function makeEventResponse(id: string, event?: EventData): EventResponse {
    const eventResponse: EventResponse = {
        id: id,
        url: `/api/event/${id}`,
    };
    if (event) {
        eventResponse.name = event.name;
        eventResponse.startDate = event.startDate;
        eventResponse.endDate = event.endDate;
    }
    return eventResponse;
}

async function eventGetAll(req: express.Request, res: express.Response) {
    const idList = await data.list("event");
    const eventList = idList.map(id => makeEventResponse(id));
    res.status(http.OK).json(eventList);
}

async function eventGet(req: express.Request, res: express.Response) {
    const id = req.params.id!;
    try {
        const item = await data.get("event", id) as EventData;
        const event = makeEventResponse(id, item);
        res.status(http.OK).json(event);
    }
    catch (error) {
        if (error instanceof data.LookupError)
            throw new NotFoundError(error.message);
        else
            throw error;
    }
}

function extractEvent(req: express.Request): EventData {
    const result = validationResult(req);
    if (!result.isEmpty())
        throw new BadRequestError("Invalid event data", {
            details: result.array().flatMap((error) => {
                switch (error.type) {
                case "field": return [[error.path, `${error.msg} (${error.value})`]];
                case "unknown_fields": return error.fields.map((f): [string, string] => [f.path, "Unexpected field"]);
                default: return [[error.type, error.msg]];
                }
            }),
        });

    return req.body as EventData;
}

async function eventPost(req: express.Request, res: express.Response) {
    const protoEvent = extractEvent(req);

    const id = await data.add("event", protoEvent);
    const event = makeEventResponse(id, protoEvent);
    res.status(http.CREATED).json(event);
}

async function eventPut(req: express.Request, res: express.Response) {
    const protoEvent = extractEvent(req);
    const id = req.params.id!;

    await data.set("event", id, protoEvent);
    const event = makeEventResponse(id, protoEvent);
    res.status(http.OK).json(event);
}

async function eventDelete(req: express.Request, res: express.Response) {
    const id = req.params.id!;
    await data.del("event", id);
    res.status(http.NO_CONTENT).send();
}

const router = express.Router();
router.get("/", eventGetAll);
router.get("/:id", eventGet);
router.post("/", checkSchema(eventSchema, ["body"]), eventPost);
router.put("/:id", checkSchema(eventSchema, ["body"]), eventPut);
router.delete("/:id", eventDelete);

export default router;
