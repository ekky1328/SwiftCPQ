import express from 'express';

import { requireAuth, requirePermission } from '../middlewares';
import { PERMISSIONS } from '../helpers/permissions';
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
router.use('/system', requireAuth, requirePermission(PERMISSIONS.SYSTEM_MANAGE), systemRouter);
router.use('/user', requireAuth, requirePermission(PERMISSIONS.USERS_MANAGE), userRouter);
router.use('/customer', requireAuth, customerRouter);
router.use('/role', requireAuth, requirePermission(PERMISSIONS.ROLES_MANAGE), roleRouter);
router.use('/catalogue', requireAuth, catalogueRouter);

export default router;
