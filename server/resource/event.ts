import express from "express";
import {BadRequestError, NotFoundError} from "../http/error.ts";
import * as data from "../data/redis.ts";
import {StatusCodes as http} from "http-status-codes";

type EventData = {
    name: string;
    startDate: string;
    endDate: string;
};

function isValidEvent(event: unknown): event is EventData {
    return true; // **** FIX THIS ****
}

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

async function eventPost(req: express.Request, res: express.Response) {
    if (isValidEvent(req.body)) {
        const id = await data.add("event", req.body as data.Data);
        const event = makeEventResponse(id, req.body);
        res.status(http.CREATED).json(event);
    }
    else
        throw new BadRequestError("Invalid event data.");
}

async function eventPut(req: express.Request, res: express.Response) {
    if (isValidEvent(req.body)) {
        const id = req.params.id!;
        await data.set("event", id, req.body as data.Data);
        const event = makeEventResponse(id, req.body);
        res.status(http.OK).json(event);
    }
    else
        throw new BadRequestError("Invalid event data.");
}

async function eventDelete(req: express.Request, res: express.Response) {
    const id = req.params.id!;
    await data.del("event", id);
    res.status(http.NO_CONTENT).send();
}

const router = express.Router();
router.get("/", eventGetAll);
router.get("/:id", eventGet);
router.post("/", eventPost);
router.put("/:id", eventPut);
router.delete("/:id", eventDelete);

export default router;
