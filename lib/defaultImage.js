import { getSettings } from './settings';

export async function getDefaultStoryImage() {
  const settings = await getSettings();
  return settings.defaultStoryImage || '/images/defaultfootball.png';
}
