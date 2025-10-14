import express from "express";
import {StatusCodes as http} from "http-status-codes";
import {ResourceFactory, InvalidResourceError, MissingResourceError} from "../resource/resource.ts";
import {NotFoundError, BadRequestError} from "./error.ts";

export class Rest {
    factory: ResourceFactory;

    constructor(factory: ResourceFactory) {
        this.factory = factory;
    }

    async get(req: express.Request, res: express.Response) {
        try {
            const resource = await this.factory.load(req.params.id!);
            res.status(http.OK).send(this.factory.toRest(resource));
        }
        catch (error) {
            if (error instanceof MissingResourceError)
                throw new NotFoundError(error.message);
            else
                throw error;
        }
    }

    async getAll(req: express.Request, res: express.Response) {
        const resources = await this.factory.loadAll();
        res.status(http.OK).send(resources.map(resource => this.factory.toRest(resource)));
    }

    async post(req: express.Request, res: express.Response) {
        try {
            const resource = await this.factory.create(req.body);
            res.status(http.CREATED).send(this.factory.toRest(resource));
        }
        catch (error) {
            if (error instanceof InvalidResourceError)
                throw new BadRequestError(error.message);
            else
                throw error;
        }
    }

    async put(req: express.Request, res: express.Response) {
        try {
            const resource = await this.factory.save(req.params.id!, req.body);
            res.status(http.OK).send(this.factory.toRest(resource));
        }
        catch (error) {
            if (error instanceof InvalidResourceError)
                throw new BadRequestError(error.message);
            else
                throw error;
        }
    }

    async delete(req: express.Request, res: express.Response) {
        await this.factory.delete(req.params.id!);
        res.status(http.NO_CONTENT).send();
    }
}
