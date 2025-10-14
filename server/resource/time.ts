import express from "express";

// REST router

const router = express.Router();
router.get("/", getTime);
export default router;

// REST verb definitions

function getTime(req: express.Request, res: express.Response) {
    res.send({
        url: `${req.baseUrl}`,
        time: new Date(),
    });
}
