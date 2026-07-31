import { parseCookies, verifyAuthToken } from '../../../lib/auth';
import { getAllUsers, getUserByUsername, createUser, updateUserPassword, deleteUser } from '../../../lib/users';

function requireAuth(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return verifyAuthToken(cookies.dp_auth);
}

export default async function handler(req, res) {
  const username = requireAuth(req);
  if (!username) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const me = getUserByUsername(username);
  if (!me) {
    return res.status(401).json({ message: 'User not found' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ users: getAllUsers().map(({ passwordHash, ...rest }) => rest) });
  }

  if (req.method === 'POST') {
    const { username: newUsername, password, role } = req.body || {};
    if (!newUsername || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }
    if (!['editor', 'master'].includes(role || 'editor')) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    if (role === 'master' && me.role !== 'master') {
      return res.status(403).json({ message: 'Only masteradmin can create master users.' });
    }

    try {
      const created = await createUser(newUsername, password, role || 'editor');
      return res.status(201).json({ user: { username: created.username, role: created.role, createdAt: created.createdAt } });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  if (req.method === 'PATCH') {
    const { username: targetUsername, newPassword } = req.body || {};
    if (!targetUsername || !newPassword) {
      return res.status(400).json({ message: 'Target username and new password are required.' });
    }

    if (me.username !== targetUsername && me.role !== 'master') {
      return res.status(403).json({ message: 'Only masteradmin can reset other users.' });
    }

    try {
      const updated = await updateUserPassword(targetUsername, newPassword);
      return res.status(200).json({ user: { username: updated.username, role: updated.role } });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const { username: targetUsername } = req.body || {};
    if (!targetUsername) {
      return res.status(400).json({ message: 'Target username is required.' });
    }

    if (me.role !== 'master') {
      return res.status(403).json({ message: 'Only masteradmin can delete users.' });
    }
    if (targetUsername === 'masteradmin') {
      return res.status(403).json({ message: 'masteradmin cannot be deleted.' });
    }

    try {
      await deleteUser(targetUsername);
      return res.status(200).json({ message: 'User deleted.' });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
