import { parseCookies, verifyAuthToken } from '../../../lib/auth';
import { getGitHubFile, createOrUpdateGitHubBinaryFile, deleteGitHubFile } from '../../../lib/github';
import { put, remove } from '@vercel/blob';
import path from 'path';

function requireAuth(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return verifyAuthToken(cookies.dp_auth);
}

function sanitizeFileName(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
}

function isUrl(str) {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  const username = requireAuth(req);
  if (!username) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { fileName, contentBase64 } = req.body || {};
    if (!fileName || !contentBase64) {
      return res.status(400).json({ message: 'Missing fileName or file data.' });
    }

    const safeFileName = sanitizeFileName(fileName);
    const buffer = Buffer.from(contentBase64, 'base64');

    try {
      const blob = await put(`uploads/${safeFileName}`, buffer, { access: 'public' });
      const publicUrl = blob.url || blob?.href || blob?.downloadUrl;
      return res.status(200).json({ url: publicUrl });
    } catch (error) {
      console.error('Vercel Blob upload failed:', error);
      return res.status(500).json({ message: 'Failed to upload image.' });
    }
  }

  if (req.method === 'DELETE') {
    const { imagePath } = req.body || {};
    if (!imagePath) {
      return res.status(400).json({ message: 'Invalid image path.' });
    }

    try {
      if (isUrl(imagePath)) {
        // try to extract filename from URL
        const url = new URL(imagePath);
        const fileName = path.basename(url.pathname);
        await remove({ name: fileName }).catch(async (err) => {
          if (process.env.GITHUB_TOKEN) {
            const repoPath = `public/uploads/${fileName}`;
            const existing = await getGitHubFile(repoPath);
            if (existing) await deleteGitHubFile(repoPath, existing.sha, `Delete image ${repoPath}`);
          } else {
            // nothing else we can do
          }
        });
      } else {
        // imagePath may be a repo path like /uploads/name
        const fileName = path.basename(imagePath);
        await remove({ name: fileName }).catch(async (err) => {
          if (process.env.GITHUB_TOKEN) {
            const repoPath = `public/uploads/${fileName}`;
            const existing = await getGitHubFile(repoPath);
            if (existing) await deleteGitHubFile(repoPath, existing.sha, `Delete image ${repoPath}`);
          }
        });
      }

      return res.status(200).json({});
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to delete image.' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
