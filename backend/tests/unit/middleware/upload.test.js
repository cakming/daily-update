import { describe, it, expect, afterEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { uploadAvatar, deleteAvatarFile } from '../../../middleware/upload.js';

const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');

const makeApp = () => {
  const app = express();
  app.post(
    '/upload',
    (req, res, next) => {
      req.user = { _id: 'user123' };
      next();
    },
    uploadAvatar.single('avatar'),
    (req, res) => {
      res.json({ success: true, filename: req.file ? req.file.filename : null });
    }
  );
  // Error handler to surface multer/fileFilter errors
  app.use((err, req, res, next) => {
    res.status(400).json({ success: false, message: err.message });
  });
  return app;
};

describe('Upload Middleware', () => {
  const createdFiles = [];

  afterEach(() => {
    while (createdFiles.length) {
      const f = createdFiles.pop();
      const p = path.join(uploadsDir, f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  });

  describe('uploadAvatar', () => {
    it('should expose a multer instance with a single() method', () => {
      expect(typeof uploadAvatar.single).toBe('function');
    });

    it('should accept a valid image upload and store it with a generated name', async () => {
      const res = await request(makeApp())
        .post('/upload')
        .attach('avatar', Buffer.from('fake-image-bytes'), {
          filename: 'photo.png',
          contentType: 'image/png',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.filename).toMatch(/^user123-\d+\.png$/);
      createdFiles.push(res.body.filename);
      expect(fs.existsSync(path.join(uploadsDir, res.body.filename))).toBe(true);
    });

    it('should reject a non-image file', async () => {
      const res = await request(makeApp())
        .post('/upload')
        .attach('avatar', Buffer.from('hello world'), {
          filename: 'notes.txt',
          contentType: 'text/plain',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('image files');
    });
  });

  describe('deleteAvatarFile', () => {
    it('should delete an existing file', () => {
      const filename = 'to-delete-test.png';
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, 'x');
      expect(fs.existsSync(filePath)).toBe(true);

      deleteAvatarFile(filename);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should do nothing when given no filename', () => {
      expect(() => deleteAvatarFile(undefined)).not.toThrow();
      expect(() => deleteAvatarFile(null)).not.toThrow();
    });

    it('should not throw when the file does not exist', () => {
      expect(() => deleteAvatarFile('does-not-exist-xyz.png')).not.toThrow();
    });
  });
});
