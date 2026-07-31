import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createOrUpdateGitHubFile } from './github';

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');
const usersRepoPath = 'data/users.json';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getDefaultUsers() {
  return [
    {
      username: 'masteradmin',
      passwordHash: hashPassword('clashofclans'),
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

function ensureUsersFileExists() {
  if (!fs.existsSync(usersFilePath)) {
    writeLocalUsers(getDefaultUsers());
  }
}

function readLocalUsers() {
  ensureUsersFileExists();

  const fileContents = fs.readFileSync(usersFilePath, 'utf8');
  const parsed = JSON.parse(fileContents);
  if (!parsed || !Array.isArray(parsed.users)) {
    throw new Error('Invalid users file format.');
  }
  return parsed.users;
}

function writeLocalUsers(users) {
  const directory = path.dirname(usersFilePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  fs.writeFileSync(usersFilePath, JSON.stringify({ users }, null, 2), 'utf8');
}

async function syncUsersFileToGitHub(users) {
  if (!process.env.GITHUB_TOKEN) {
    return;
  }
  await createOrUpdateGitHubFile(usersRepoPath, JSON.stringify({ users }, null, 2), 'Update app user list');
}

async function saveUsers(users) {
  writeLocalUsers(users);
  await syncUsersFileToGitHub(users);
}

export function getAllUsers() {
  return readLocalUsers();
}

export function getUserByUsername(username) {
  if (!username) return null;
  return getAllUsers().find((user) => user.username === username) || null;
}

export function verifyUserPassword(username, password) {
  const user = getUserByUsername(username);
  if (!user) {
    return false;
  }
  return user.passwordHash === hashPassword(password);
}

export function getSafeUsers() {
  return getAllUsers().map(({ passwordHash, ...rest }) => rest);
}

export async function createUser(username, password, role = 'editor') {
  const normalizedUsername = username?.trim().toLowerCase();
  if (!normalizedUsername || !password) {
    throw new Error('Username and password are required.');
  }
  if (getUserByUsername(normalizedUsername)) {
    throw new Error('A user with that username already exists.');
  }

  const users = getAllUsers();
  const newUser = {
    username: normalizedUsername,
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await saveUsers(users);
  return newUser;
}

export async function updateUserPassword(username, newPassword) {
  const normalizedUsername = username?.trim().toLowerCase();
  if (!normalizedUsername || !newPassword) {
    throw new Error('Username and new password are required.');
  }

  const users = getAllUsers();
  const userIndex = users.findIndex((user) => user.username === normalizedUsername);
  if (userIndex < 0) {
    throw new Error('User not found.');
  }

  users[userIndex] = {
    ...users[userIndex],
    passwordHash: hashPassword(newPassword),
    updatedAt: new Date().toISOString(),
  };

  await saveUsers(users);
  return users[userIndex];
}

export async function deleteUser(username) {
  const normalizedUsername = username?.trim().toLowerCase();
  if (!normalizedUsername) {
    throw new Error('Username is required.');
  }
  if (normalizedUsername === 'masteradmin') {
    throw new Error('The masteradmin account cannot be deleted.');
  }

  const users = getAllUsers();
  const filtered = users.filter((user) => user.username !== normalizedUsername);
  if (filtered.length === users.length) {
    throw new Error('User not found.');
  }

  await saveUsers(filtered);
  return true;
}
