import express from 'express';
import fs from 'fs';

import proposalRouter from './proposal';
import systemRouter from './system';

const router = express.Router();

router.use('/proposal', proposalRouter)
router.use('/system', systemRouter)

export default router;
