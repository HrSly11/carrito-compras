import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  changePassword,
  requestPasswordReset,
  resetPassword,
} from '../controllers/index.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate(), logout);
router.post('/refresh', refreshToken);
router.get('/me', authenticate(), getMe);
router.post('/change-password', authenticate(), changePassword);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

export default router;