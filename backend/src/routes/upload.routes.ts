import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { uploadProductImage } from '../middlewares/upload.middleware.js';
import { sendSuccess, sendBadRequest } from '../utils/response.util.js';

const router = Router();

// POST /api/v1/uploads/productos — Upload product image, returns URL
router.post(
  '/productos',
  authenticate(),
  requireRole('ADMIN'),
  (req: Request, res: Response) => {
    uploadProductImage(req, res, (err) => {
      if (err) {
        return sendBadRequest(res, err.message || 'Error al subir imagen');
      }
      if (!req.file) {
        return sendBadRequest(res, 'No se recibió ningún archivo');
      }
      // Build public URL — served via Express static
      const url = `/uploads/productos/${req.file.filename}`;
      return sendSuccess(res, { url, filename: req.file.filename }, 'Imagen subida correctamente');
    });
  }
);

export default router;
