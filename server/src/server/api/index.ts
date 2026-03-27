import express from 'express';

import { requireAuth } from '../middlewares';
import authRouter from './auth';
import proposalRouter from './proposal';
import systemRouter from './system';
import userRouter from './user';
import customerRouter from './customer';
import roleRouter from './role';
import catalogueRouter from './catalogue';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/proposal', requireAuth, proposalRouter);
router.use('/system', requireAuth, systemRouter);
router.use('/user', requireAuth, userRouter);
router.use('/customer', requireAuth, customerRouter);
router.use('/role', requireAuth, roleRouter);
router.use('/catalogue', requireAuth, catalogueRouter);

export default router;
