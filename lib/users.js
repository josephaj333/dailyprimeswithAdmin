import crypto from 'crypto';
import { supabase } from './supabaseClient';

function normalizeUsername(username) {
  return username?.trim().toLowerCase() || null;
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function mapUserRow(row) {
  return {
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

function getMasterAdminUser() {
  if (!process.env.MASTER_ADMIN_PASSWORD) return null;
  return {
    username: 'masteradmin',
    passwordHash: hashPassword(process.env.MASTER_ADMIN_PASSWORD),
    role: 'master',
    createdAt: new Date().toISOString(),
  };
}

export async function getAllUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Supabase GET users error:', error);
    throw new Error('Unable to load users.');
  }

  const users = Array.isArray(data) ? data.map(mapUserRow) : [];
  const master = getMasterAdminUser();
  if (master && !users.some((user) => user.username === 'masteradmin')) {
    return [master, ...users];
  }
  return users;
}

export async function getUserByUsername(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  if (normalized === 'masteradmin') {
    return getMasterAdminUser();
  }

  const { data, error } = await supabase.from('users').select('*').eq('username', normalized).maybeSingle();
  if (error) {
    console.error('Supabase getUserByUsername error:', error);
    throw new Error('Unable to load user.');
  }
  if (!data) return null;
  return mapUserRow(data);
}

export async function verifyUserPassword(username, password) {
  const user = await getUserByUsername(username);
  if (!user) return false;
  return user.passwordHash === hashPassword(password);
}

export async function getSafeUsers() {
  const users = await getAllUsers();
  return users.map(({ passwordHash, ...rest }) => rest);
}

export async function createUser(username, password, role = 'editor') {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername || !password) {
    throw new Error('Username and password are required.');
  }
  if (normalizedUsername === 'masteradmin') {
    throw new Error('Cannot create or overwrite the masteradmin account here.');
  }

  const existing = await getUserByUsername(normalizedUsername);
  if (existing) throw new Error('A user with that username already exists.');

  const password_hash = hashPassword(password);
  const { data, error } = await supabase
    .from('users')
    .insert([{ username: normalizedUsername, password_hash, role }])
    .select();

  if (error) {
    console.error('Supabase createUser error:', error);
    throw new Error(error.message || 'Unable to create user.');
  }

  const created = Array.isArray(data) ? data[0] : data;
  return mapUserRow(created);
}

export async function updateUserPassword(username, newPassword) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername || !newPassword) {
    throw new Error('Username and new password are required.');
  }
  if (normalizedUsername === 'masteradmin') {
    throw new Error('Use MASTER_ADMIN_PASSWORD to update masteradmin password.');
  }

  const password_hash = hashPassword(newPassword);
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash })
    .eq('username', normalizedUsername)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Supabase updateUserPassword error:', error);
    throw new Error(error.message || 'Unable to update password.');
  }
  if (!data) throw new Error('User not found.');

  return mapUserRow(data);
}

export async function deleteUser(username) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) throw new Error('Username is required.');
  if (normalizedUsername === 'masteradmin') throw new Error('The masteradmin account cannot be deleted.');

  const { data, error } = await supabase.from('users').delete().eq('username', normalizedUsername).select();
  if (error) {
    console.error('Supabase deleteUser error:', error);
    throw new Error(error.message || 'Unable to delete user.');
  }
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('User not found.');
  }

  return true;
}
