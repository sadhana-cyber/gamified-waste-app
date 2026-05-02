import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import wasteLogsRouter from "./waste-logs";
import achievementsRouter from "./achievements";
import leaderboardRouter from "./leaderboard";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/waste-logs", wasteLogsRouter);
router.use("/achievements", achievementsRouter);
router.use(leaderboardRouter);
router.use(storageRouter);

export default router;
