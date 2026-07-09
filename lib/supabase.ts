import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  plan: 'free' | 'pro' | 'studio';
  created_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  bpm: number;
  key_signature: string;
  time_signature: string;
  color: string;
  cover_url: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type Track = {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  type: 'audio' | 'vocal' | 'midi';
  color: string;
  volume: number;
  pan: number;
  is_muted: boolean;
  is_solo: boolean;
  position: number;
  created_at: string;
};

export type VocalTake = {
  id: string;
  user_id: string;
  track_id: string | null;
  name: string;
  duration: number;
  file_url: string | null;
  created_at: string;
};

export type Clip = {
  id: string;
  track_id: string;
  project_id: string;
  user_id: string;
  label: string;
  file_path: string | null;
  start_bar: number;
  duration_bars: number;
  duration_ms: number;
  waveform_data: number[];
  color: string | null;
  source_type: 'audio' | 'vocal' | 'midi' | 'loop';
  created_at: string;
};
