import express from "express";
import {randomBytes} from "node:crypto";
import {UserFactory} from "../resource/user.ts";

const token = randomBytes(32).toString("base64");

// Rest

export class AuthRest {
    factory = new UserFactory();

    async login(req: express.Request, res: express.Response) {
        res
            .status(200)
            .cookie("Session-Token", token)
            .json({sessionToken: token});
    }
}

// Router

const authRest = new AuthRest();

const router = express.Router();
router.post("/", authRest.login.bind(authRest));

export default router;
