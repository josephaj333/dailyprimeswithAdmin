import fs from 'fs';
import path from 'path';
import { parseCookies, verifyAuthToken } from '../../../lib/auth';
import { getGitHubFile, createOrUpdateGitHubBinaryFile, deleteGitHubFile } from '../../../lib/github';

const uploadDirectory = path.join(process.cwd(), 'public', 'uploads');

function requireAuth(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return verifyAuthToken(cookies.dp_auth);
}

function ensureUploadDirectory() {
  if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
  }
}

function sanitizeFileName(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
}

function managedImagePath(imagePath) {
  return typeof imagePath === 'string' && imagePath.startsWith('/uploads/');
}

export default async function handler(req, res) {
  const username = requireAuth(req);
  if (!username) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const useGitHub = Boolean(process.env.GITHUB_TOKEN);

  if (req.method === 'POST') {
    const { fileName, contentBase64 } = req.body || {};
    if (!fileName || !contentBase64) {
      return res.status(400).json({ message: 'Missing fileName or file data.' });
    }

    const safeFileName = sanitizeFileName(fileName);
    const repoPath = `public/uploads/${safeFileName}`;
    const publicPath = `/uploads/${safeFileName}`;

    try {
      if (useGitHub) {
        await createOrUpdateGitHubBinaryFile(repoPath, contentBase64, `Upload image ${safeFileName}`);
      } else {
        ensureUploadDirectory();
        fs.writeFileSync(path.join(uploadDirectory, safeFileName), Buffer.from(contentBase64, 'base64'));
      }
      return res.status(200).json({ path: publicPath });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to upload image.' });
    }
  }

  if (req.method === 'DELETE') {
    const { imagePath } = req.body || {};
    if (!imagePath || !managedImagePath(imagePath)) {
      return res.status(400).json({ message: 'Invalid image path.' });
    }

    const repoPath = `public${imagePath}`;

    try {
      if (useGitHub) {
        const existing = await getGitHubFile(repoPath);
        if (existing) {
          await deleteGitHubFile(repoPath, existing.sha, `Delete image ${repoPath}`);
        }
      } else {
        const localPath = path.join(process.cwd(), 'public', imagePath);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
      return res.status(200).json({});
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to delete image.' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
