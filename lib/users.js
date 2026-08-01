import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';
import { createOrUpdateGitHubFile } from './github';

const usersRepoPath = 'data/users.json';
const localUsersPath = path.join(process.cwd(), 'data', 'users.json');

function usingKV() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function readLocalUsers() {
  try {
    if (!fs.existsSync(localUsersPath)) return null;
    const raw = fs.readFileSync(localUsersPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.users) ? parsed.users : parsed;
  } catch (e) {
    console.error('Failed to read local users.json', e);
    return null;
  }
}

function writeLocalUsers(users) {
  try {
    const payload = { users };
    fs.writeFileSync(localUsersPath, JSON.stringify(payload, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write local users.json', e);
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getDefaultUsers() {
  const masterPass = process.env.MASTER_ADMIN_PASSWORD || 'clashofclans';
  return [
    {
      username: 'masteradmin',
      passwordHash: hashPassword(masterPass),
      role: 'master',
      createdAt: new Date().toISOString(),
    },
    {
      username: 'admin',
      passwordHash: hashPassword('password123'),
      role: 'editor',
      createdAt: new Date().toISOString(),
    },
  ];
}

async function syncUsersToGitHub(users) {
  if (!process.env.GITHUB_TOKEN) return;
  await createOrUpdateGitHubFile(usersRepoPath, JSON.stringify({ users }, null, 2), 'Update app user list');
}

export async function getAllUsers() {
  if (usingKV()) {
    try {
      let users = await kv.get('users');
      if (!users) {
        users = getDefaultUsers();
        await kv.set('users', users);
        await syncUsersToGitHub(users).catch(() => {});
      }
      return users;
    } catch (e) {
      console.error('KV access failed, falling back to local file:', e);
      const local = readLocalUsers();
      if (local) return local;
      const defaults = getDefaultUsers();
      writeLocalUsers(defaults);
      return defaults;
    }
  }

  // fallback to local file storage for dev
  const local = readLocalUsers();
  if (local) return local;
  const defaults = getDefaultUsers();
  writeLocalUsers(defaults);
  return defaults;
}

export async function getUserByUsername(username) {
  if (!username) return null;
  const normalized = username.trim().toLowerCase();
  const users = await getAllUsers();
  return users.find((u) => u.username === normalized) || null;
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
  const normalizedUsername = username?.trim().toLowerCase();
  if (!normalizedUsername || !password) {
    throw new Error('Username and password are required.');
  }
  const existing = await getUserByUsername(normalizedUsername);
  if (existing) throw new Error('A user with that username already exists.');

  const users = await getAllUsers();
  const newUser = {
    username: normalizedUsername,
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  if (usingKV()) {
    await kv.set('users', users);
  } else {
    writeLocalUsers(users);
  }
  await syncUsersToGitHub(users).catch(() => {});
  return newUser;
}

export async function updateUserPassword(username, newPassword) {
  const normalizedUsername = username?.trim().toLowerCase();
  if (!normalizedUsername || !newPassword) {
    throw new Error('Username and new password are required.');
  }
  const users = await getAllUsers();
  const idx = users.findIndex((u) => u.username === normalizedUsername);
  if (idx < 0) throw new Error('User not found.');
  users[idx] = {
    ...users[idx],
    passwordHash: hashPassword(newPassword),
    updatedAt: new Date().toISOString(),
  };
  if (usingKV()) {
    await kv.set('users', users);
  } else {
    writeLocalUsers(users);
  }
  await syncUsersToGitHub(users).catch(() => {});
  return users[idx];
}

export async function deleteUser(username) {
  const normalizedUsername = username?.trim().toLowerCase();
  if (!normalizedUsername) throw new Error('Username is required.');
  if (normalizedUsername === 'masteradmin') throw new Error('The masteradmin account cannot be deleted.');
  const users = await getAllUsers();
  const filtered = users.filter((u) => u.username !== normalizedUsername);
  if (filtered.length === users.length) throw new Error('User not found.');
  if (usingKV()) {
    await kv.set('users', filtered);
  } else {
    writeLocalUsers(filtered);
  }
  await syncUsersToGitHub(filtered).catch(() => {});
  return true;
}
