import express from 'express';

import proposalRouter from './proposal';
import systemRouter from './system';
import userRouter from './user';

const router = express.Router();

router.use('/proposal', proposalRouter);
router.use('/system', systemRouter);
router.use('/user', userRouter);

export default router;
