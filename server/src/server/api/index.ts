import express from 'express';

import proposalRouter from './proposal';
import systemRouter from './system';
import userRouter from './user';
import customerRouter from './customer';
import roleRouter from './role';

const router = express.Router();

router.use('/proposal', proposalRouter);
router.use('/system', systemRouter);
router.use('/user', userRouter);
router.use('/customer', customerRouter);
router.use('/role', roleRouter);

export default router;
