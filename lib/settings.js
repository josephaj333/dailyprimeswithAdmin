import fs from 'fs';
import path from 'path';
import { getGitHubFile, createOrUpdateGitHubFile } from './github';

const settingsFilePath = path.join(process.cwd(), 'data', 'settings.json');
const settingsRepoPath = 'data/settings.json';
const DEFAULT_IMAGE_PATH = '/images/profilepic.jpg';

function ensureLocalSettingsFile() {
  const directory = path.dirname(settingsFilePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!fs.existsSync(settingsFilePath)) {
    fs.writeFileSync(settingsFilePath, JSON.stringify({ defaultStoryImage: DEFAULT_IMAGE_PATH }, null, 2), 'utf8');
  }
}

export function readLocalSettings() {
  ensureLocalSettingsFile();
  const fileContents = fs.readFileSync(settingsFilePath, 'utf8');
  const parsed = JSON.parse(fileContents);
  return {
    defaultStoryImage: parsed?.defaultStoryImage || DEFAULT_IMAGE_PATH,
  };
}

export function writeLocalSettings(settings) {
  ensureLocalSettingsFile();
  fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf8');
}

export async function getSettings() {
  if (process.env.GITHUB_TOKEN) {
    try {
      const file = await getGitHubFile(settingsRepoPath);
      if (!file) {
        return readLocalSettings();
      }
      const parsed = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
      return {
        defaultStoryImage: parsed?.defaultStoryImage || DEFAULT_IMAGE_PATH,
      };
    } catch (error) {
      return readLocalSettings();
    }
  }

  return readLocalSettings();
}

export async function saveSettings(settings) {
  writeLocalSettings(settings);

  if (!process.env.GITHUB_TOKEN) {
    return settings;
  }

  const existing = await getGitHubFile(settingsRepoPath).catch(() => null);
  await createOrUpdateGitHubFile(
    settingsRepoPath,
    JSON.stringify(settings, null, 2),
    'Update settings',
    existing?.sha
  );
  return settings;
}
