import fs from 'fs';
import path from 'path';
import { parseCookies, verifyAuthToken } from '../../../lib/auth';
import { generatePostId } from '../../../lib/posts';
import { createOrUpdateGitHubFile, deleteGitHubFile, getGitHubFile, listGitHubPostFiles } from '../../../lib/github';

const postsDirectory = path.join(process.cwd(), 'data', 'posts');

function requireAuth(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const username = verifyAuthToken(cookies.dp_auth);
  return username;
}

function ensureLocalPostsDirectory() {
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true });
  }
}

function writeLocalPostFile(post) {
  ensureLocalPostsDirectory();
  const id = post.id || generatePostId(post.title);
  const fullPost = {
    ...post,
    id,
    date: post.date || new Date().toISOString(),
  };
  const filePath = path.join(postsDirectory, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(fullPost, null, 2), 'utf8');
  return fullPost;
}

function readLocalPosts() {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory).filter((file) => file.endsWith('.json'));
  return fileNames.map((fileName) => {
    const filePath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  });
}

export default async function handler(req, res) {
  const username = requireAuth(req);
  if (!username) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const useGitHub = Boolean(process.env.GITHUB_TOKEN);

  if (req.method === 'GET') {
    try {
      const posts = useGitHub ? await listGitHubPostFiles() : readLocalPosts();
      return res.status(200).json({ posts: posts.sort((a, b) => new Date(b.date) - new Date(a.date)) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unable to load stories.' });
    }
  }

  if (req.method === 'POST') {
    const post = req.body;
    if (!post || !post.title || !post.description || !post.content) {
      return res.status(400).json({ message: 'Missing required story fields' });
    }

    const newPost = {
      ...post,
      id: post.id || generatePostId(post.title),
      date: post.date || new Date().toISOString(),
    };

    if (useGitHub) {
      try {
        const filePath = `data/posts/${newPost.id}.json`;
        const existing = await getGitHubFile(filePath);
        const message = existing ? `Update story ${newPost.id}` : `Create story ${newPost.id}`;
        const response = await createOrUpdateGitHubFile(filePath, JSON.stringify(newPost, null, 2), message, existing?.sha);
        return res.status(200).json({ post: newPost, github: response.content });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to save story via GitHub API.' });
      }
    }

    try {
      const savedPost = writeLocalPostFile(newPost);
      return res.status(200).json({ post: savedPost });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unable to save story locally.' });
    }
  }

  if (req.method === 'DELETE') {
    const { id, image } = req.body || {};
    if (!id) {
      return res.status(400).json({ message: 'Post id is required' });
    }

    if (useGitHub) {
      try {
        const filePath = `data/posts/${id}.json`;
        const existing = await getGitHubFile(filePath);
        if (!existing) {
          return res.status(404).json({ message: 'Post not found' });
        }
        await deleteGitHubFile(filePath, existing.sha, `Delete story ${id}`);

        if (image && image.startsWith('/uploads/')) {
          const imagePath = `public${image}`;
          const existingImage = await getGitHubFile(imagePath);
          if (existingImage) {
            await deleteGitHubFile(imagePath, existingImage.sha, `Delete image ${image}`);
          }
        }

        return res.status(200).json({ message: 'Deleted' });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to delete story via GitHub API.' });
      }
    }

    const filePath = path.join(postsDirectory, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Post not found' });
    }

    fs.unlinkSync(filePath);
    if (image && image.startsWith('/uploads/')) {
      const imagePath = path.join(process.cwd(), 'public', image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    return res.status(200).json({ message: 'Deleted' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
