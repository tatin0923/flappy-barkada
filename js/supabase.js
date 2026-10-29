/**
 * Supabase Database Integration for Flappy Barkada
 * Handles global real-time leaderboards and dynamic characters in cloud database.
 */

// I-paste dito ang iyong Supabase Project URL at Anon Public Key,
// O maaari mo ring i-save ito nang direkta sa Admin Panel (admin.html)!
const DEFAULT_SUPABASE_URL = "https://trppztayllblopelnqdo.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycHB6dGF5bGxibG9wZWxucWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyOTAxNDcsImV4cCI6MjEwODg2NjE0N30.C221RTERdr6yFQbf35fCyqiSkBMh85uuuU0a30h4t74";

class SupabaseService {
  constructor() {
    this.client = null;
    this.init();
  }

  init() {
    const url = localStorage.getItem('https://trppztayllblopelnqdo.supabase.co') || DEFAULT_SUPABASE_URL;
    const key = localStorage.getItem('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycHB6dGF5bGxibG9wZWxucWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyOTAxNDcsImV4cCI6MjEwODg2NjE0N30.C221RTERdr6yFQbf35fCyqiSkBMh85uuuU0a30h4t74') || DEFAULT_SUPABASE_ANON_KEY;

    if (url && key && window.supabase) {
      try {
        this.client = window.supabase.createClient(url.trim(), key.trim());
        this.url = url.trim();
        this.key = key.trim();
      } catch (e) {
        console.warn('Failed to initialize Supabase client:', e);
        this.client = null;
      }
    }
  }

  isConfigured() {
    return !!this.client;
  }

  saveCredentials(url, key) {
    if (url && key) {
      localStorage.setItem('flappy_supabase_url', url.trim());
      localStorage.setItem('flappy_supabase_anon_key', key.trim());
      this.init();
      return true;
    }
    return false;
  }

  clearCredentials() {
    localStorage.removeItem('flappy_supabase_url');
    localStorage.removeItem('flappy_supabase_anon_key');
    this.client = null;
  }

  // --- LEADERBOARD SCORES ---
  async getScores() {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase getScores error:', e);
      return null;
    }
  }

  async saveScore(name, characterId, score) {
    if (!this.client) return null;
    try {
      const payload = {
        name: name || 'Player',
        character_id: parseInt(characterId, 10) || 1,
        score: parseInt(score, 10) || 0
      };

      const { data, error } = await this.client
        .from('scores')
        .insert([payload])
        .select();

      if (error) throw error;
      return { success: true, entry: data ? data[0] : payload };
    } catch (e) {
      console.warn('Supabase saveScore error:', e);
      return null;
    }
  }

  // --- CHARACTERS ---
  async getCharacters() {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('characters')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase getCharacters error:', e);
    }
    return null;
  }

  async upsertCharacter(char) {
    if (!this.client) return null;
    try {
      const payload = {
        id: char.id,
        name: char.name,
        image: char.image,
        is_custom: !!char.isCustom
      };

      const { data, error } = await this.client
        .from('characters')
        .upsert(payload)
        .select();

      if (error) throw error;
      return data ? data[0] : null;
    } catch (e) {
      console.warn('Supabase upsertCharacter error:', e);
      return null;
    }
  }

  async deleteCharacter(id) {
    if (!this.client) return false;
    try {
      const { error } = await this.client
        .from('characters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase deleteCharacter error:', e);
      return false;
    }
  }
}

window.supabaseService = new SupabaseService();
