import { Router } from 'express';
import multer from 'multer';
import cloudinary from '@config/cloudinary';
import { authenticate } from '@middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/image',
  authenticate,
  upload.single('image'),
  async (req, res, next) => {
    try {
      const file = (req as any).file;

      if (!file) {
        return res
          .status(400)
          .json({ success: false, message: 'No file uploaded' });
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'merosathi/healing',
        },
        (error: any, result: any) => {
          if (error || !result) {
            return next(error);
          }

          return res.json({
            success: true,
            data: {
              url: result.secure_url,
            },
          });
        }
      );

      // Using any cast above; ensure buffer exists at runtime
      uploadStream.end(file.buffer);
    } catch (error) {
      next(error);
    }
  }
);

export default router;