import { parseCookies, verifyAuthToken } from '../../lib/auth';
import { getSettings, saveSettings } from '../../lib/settings';
import { getUserByUsername } from '../../lib/users';
import { deleteGitHubFile, getGitHubFile } from '../../lib/github';
import fs from 'fs';
import path from 'path';

function requireAuth(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return verifyAuthToken(cookies.dp_auth);
}

function getImagePath(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') {
    return null;
  }
  return imagePath.startsWith('/uploads/') || imagePath.startsWith('/images/') ? imagePath : null;
}

export default async function handler(req, res) {
  const username = requireAuth(req);
  if (!username) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const settings = await getSettings();
      return res.status(200).json(settings);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unable to load settings.' });
    }
  }

  if (req.method === 'PATCH') {
    const me = await getUserByUsername(username);
    if (!me || me.role !== 'master') {
      return res.status(403).json({ message: 'Only masteradmin can update settings.' });
    }

    const { defaultStoryImage } = req.body || {};
    if (!defaultStoryImage) {
      return res.status(400).json({ message: 'Default story image is required.' });
    }

    try {
      const oldSettings = await getSettings();
      const oldImage = getImagePath(oldSettings.defaultStoryImage);
      const newImage = getImagePath(defaultStoryImage);

      await saveSettings({ defaultStoryImage: newImage });

      if (oldImage && oldImage !== newImage) {
        try {
          const origin = req.headers.origin || `http://${req.headers.host}`;
          await fetch(`${origin}/api/media`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imagePath: oldImage }),
          });
        } catch (e) {
          console.error('Failed to delete previous default image', e);
        }
      }

      return res.status(200).json({ defaultStoryImage: newImage });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unable to update settings.' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
