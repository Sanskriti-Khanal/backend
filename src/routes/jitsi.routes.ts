import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { validate } from '@middleware/validation.middleware';
import { JitsiController } from '@controllers/jitsi.controller';
import { createJitsiTokenSchema } from '@validators/jitsi.validator';

const router = Router();
const jitsiController = new JitsiController();

router.use(authenticate);
router.post('/token', validate(createJitsiTokenSchema), jitsiController.createToken);

export default router;
