import { parseCookies, verifyAuthToken } from '../../../lib/auth';
import { generatePostId } from '../../../lib/posts';
import { getSettings } from '../../../lib/settings';
import { supabase } from '../../../lib/supabaseClient';
import { del } from '@vercel/blob';

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
    image: row.image_url || '/images/defaultfootball.png',
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
    const defaultImage = settings.defaultStoryImage || '/images/defaultfootball.png';
    const storyId = incomingId || generatePostId(title);
    const createdAt = post.created_at || new Date().toISOString();
    const imageUrl = image && image !== '/images/defaultfootball.png' ? image : defaultImage;

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
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'Post id is required' });
    }

    try {
      const { data: story, error: fetchError } = await supabase
        .from('stories')
        .select('image_url')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        console.error('Supabase fetch story image error:', fetchError);
        return res.status(500).json({ message: 'Unable to load story image.' });
      }

      const imageUrl = story?.image_url;

      if (imageUrl && imageUrl.includes('blob.vercel.com') && !imageUrl.startsWith('/')) {
        try {
          const blobName = new URL(imageUrl).pathname.split('/').pop();
          if (blobName) {
            await del({ name: blobName });
          }
        } catch (deleteError) {
          console.error('Failed to delete Vercel Blob image:', deleteError);
          console.error('Failed blob URL:', imageUrl);
        }
      }

      const { data, error } = await supabase.from('stories').delete().eq('id', id).select();
      if (error) {
        console.error('Supabase DELETE story error:', error);
        return res.status(500).json({ message: 'Unable to delete story.' });
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return res.status(404).json({ message: 'Post not found' });
      }

      return res.status(200).json({ message: 'Deleted' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unable to delete story.' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
