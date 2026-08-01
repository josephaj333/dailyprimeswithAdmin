import { signAuthToken } from '../../../lib/auth';
import { verifyUserPassword, getUserByUsername } from '../../../lib/users';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  // Special handling for masteradmin: compare against env var
  if (username === 'masteradmin') {
    const masterPass = process.env.MASTER_ADMIN_PASSWORD;
    if (!masterPass || password !== masterPass) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } else {
    const user = await getUserByUsername(username);
    if (!user || !(await verifyUserPassword(username, password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  }

  const token = signAuthToken(username);
  res.setHeader('Set-Cookie', `dp_auth=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}`);
  return res.status(200).json({ message: 'Logged in' });
}
