import { parseCookies, verifyAuthToken } from '../../../lib/auth';
import { generatePostId } from '../../../lib/posts';
import { getSettings } from '../../../lib/settings';
import { supabase } from '../../../lib/supabaseClient';

function requireAuth(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const username = verifyAuthToken(cookies.dp_auth);
  return username;
}

function mapStoryRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    image: row.image_url || '/images/profilepic.jpg',
    youtubeVideoUrl: row.youtube_url || '',
    date: row.created_at || new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  const username = requireAuth(req);
  if (!username) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase.from('stories').select('*');
      if (error) {
        console.error('Supabase GET stories error:', error);
        return res.status(500).json({ message: 'Unable to load stories.' });
      }

      const stories = (Array.isArray(data) ? data : [])
        .map(mapStoryRow)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.status(200).json({ posts: stories });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unable to load stories.' });
    }
  }

  if (req.method === 'POST') {
    const post = req.body || {};
    const { title, description, content, image, youtubeVideoUrl, id: incomingId } = post;

    if (!title || !description || !content) {
      return res.status(400).json({ message: 'Missing required story fields' });
    }

    const settings = await getSettings();
    const defaultImage = settings.defaultStoryImage || '/images/profilepic.jpg';
    const storyId = incomingId || generatePostId(title);
    const createdAt = post.created_at || new Date().toISOString();
    const imageUrl = image && image !== '/images/profilepic.jpg' ? image : defaultImage;

    try {
      const { data, error } = await supabase
        .from('stories')
        .upsert(
          {
            id: storyId,
            title,
            description,
            content,
            image_url: imageUrl,
            youtube_url: youtubeVideoUrl || '',
            created_at: createdAt,
          },
          { onConflict: 'id' }
        )
        .select();

      if (error) {
        console.error('Supabase POST story error:', error);
        return res.status(500).json({ message: 'Unable to create story.' });
      }

      const saved = Array.isArray(data) ? data[0] : data;
      return res.status(200).json({ post: mapStoryRow(saved) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unable to create story.' });
    }
  }

  if (req.method === 'DELETE') {
    const { id, image } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'Post id is required' });
    }

    try {
      const { data, error } = await supabase.from('stories').delete().eq('id', id).select();
      if (error) {
        console.error('Supabase DELETE story error:', error);
        return res.status(500).json({ message: 'Unable to delete story.' });
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return res.status(404).json({ message: 'Post not found' });
      }

      if (image) {
        try {
          const origin = req.headers.origin || `http://${req.headers.host}`;
          await fetch(`${origin}/api/media`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imagePath: image }),
          });
        } catch (e) {
          console.error('Failed to delete associated image:', e);
        }
      }

      return res.status(200).json({ message: 'Deleted' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unable to delete story.' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
