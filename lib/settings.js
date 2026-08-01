import { supabase } from './supabaseClient';

const DEFAULT_IMAGE_PATH = '/images/defaultfootball.png';
const SETTINGS_ID = 'default';

export async function getSettings() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('default_image_url')
      .eq('id', SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error('Supabase getSettings error:', error);
      return { defaultStoryImage: DEFAULT_IMAGE_PATH };
    }

    return {
      defaultStoryImage: data?.default_image_url || DEFAULT_IMAGE_PATH,
    };
  } catch (error) {
    console.error('Failed to load settings from Supabase:', error);
    return { defaultStoryImage: DEFAULT_IMAGE_PATH };
  }
}

export async function saveSettings(defaultImageUrl) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .upsert(
        {
          id: SETTINGS_ID,
          default_image_url: defaultImageUrl || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase saveSettings error:', error);
      throw error;
    }

    return {
      defaultStoryImage: data?.default_image_url || DEFAULT_IMAGE_PATH,
    };
  } catch (error) {
    console.error('Failed to save settings to Supabase:', error);
    throw error;
  }
}
