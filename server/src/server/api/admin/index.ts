import express from 'express';

import adminTenantRouter from './tenant';

const adminRouter = express.Router();

adminRouter.use('/tenant', adminTenantRouter);

export default adminRouter;
