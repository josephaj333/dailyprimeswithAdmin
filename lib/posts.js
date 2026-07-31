import fs from 'fs';
import path from 'path';

const postsDirectory = path.join(process.cwd(), 'data', 'posts');

export function getPostFilePaths() {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  return fs.readdirSync(postsDirectory).filter((file) => file.endsWith('.json'));
}

export function getAllPosts() {
  const fileNames = getPostFilePaths();

  const posts = fileNames.map((fileName) => {
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    try {
      return JSON.parse(fileContents);
    } catch (error) {
      console.error(`Failed to parse post file ${fileName}:`, error);
      return null;
    }
  }).filter(Boolean);

  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getPostById(id) {
  const filePath = path.join(postsDirectory, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export function generatePostId(title) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${slug}-${Date.now()}`;
}
