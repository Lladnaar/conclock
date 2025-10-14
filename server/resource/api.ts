import express from "express";

// REST router

const router = express.Router();
router.get("/", getAll);
export default router;

// REST verb definitions

function getAll(req: express.Request, res: express.Response) {
    res.send({
        time: {url: `${req.baseUrl}/time`},
        user: {url: `${req.baseUrl}/user`},
        event: {url: `${req.baseUrl}/event`},
    });
}
