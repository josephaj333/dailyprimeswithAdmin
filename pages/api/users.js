import crypto from 'crypto';
import { supabase } from '../../lib/supabaseClient';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Supabase GET users error:', error);
      return res.status(500).json({ message: 'Unable to load users.' });
    }
    return res.status(200).json({ users: data || [] });
  }

  if (req.method === 'POST') {
    const { username, password, role } = req.body || {};
    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Username, password, and role are required.' });
    }

    const password_hash = hashPassword(password);
    const { data, error } = await supabase.from('users').insert([
      { username, password_hash, role },
    ]);

    if (error) {
      console.error('Supabase POST users error:', error);
      return res.status(500).json({ message: error.message || 'Unable to create user.' });
    }

    return res.status(200).json({ user: data?.[0] || null });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
