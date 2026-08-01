import { parseCookies, verifyAuthToken } from '../../lib/auth';
import { supabase } from '../../lib/supabaseClient';
import { getUserByUsername } from '../../lib/users';

function requireAuth(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return verifyAuthToken(cookies.dp_auth);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('default_image_url')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Supabase GET settings error:', error);
        return res.status(500).json({ message: 'Unable to load settings.' });
      }

      return res.status(200).json({ default_image_url: data?.default_image_url || '' });
    } catch (error) {
      console.error('Failed to load settings:', error);
      return res.status(500).json({ message: 'Unable to load settings.' });
    }
  }

  if (req.method === 'POST') {
    const username = requireAuth(req);
    if (!username) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const me = await getUserByUsername(username);
    if (!me || me.role !== 'master') {
      return res.status(403).json({ message: 'Only master admin can update settings.' });
    }

    const { default_image_url } = req.body || {};
    if (typeof default_image_url !== 'string') {
      return res.status(400).json({ message: 'default_image_url is required.' });
    }

    try {
      const { data, error } = await supabase
        .from('settings')
        .upsert(
          {
            id: 'default',
            default_image_url,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) {
        console.error('Supabase POST settings error:', error);
        return res.status(500).json({ message: 'Unable to save settings.' });
      }

      return res.status(200).json({ default_image_url: data?.default_image_url || '' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      return res.status(500).json({ message: 'Unable to save settings.' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
