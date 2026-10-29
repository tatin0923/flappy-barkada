/**
 * Dynamic Characters Manager with Supabase Cloud Sync
 */

const DEFAULT_CHARACTERS = [
  { id: 1, name: "Character 1", image: "assets/characters/char1.png", isCustom: false },
  { id: 2, name: "Character 2", image: "assets/characters/char2.png", isCustom: false },
  { id: 3, name: "Character 3", image: "assets/characters/char3.png", isCustom: false },
  { id: 4, name: "Character 4", image: "assets/characters/char4.png", isCustom: false },
  { id: 5, name: "Character 5", image: "assets/characters/char5.png", isCustom: false },
  { id: 6, name: "Character 6", image: "assets/characters/char6.png", isCustom: false },
  { id: 7, name: "Character 7", image: "assets/characters/char7.png", isCustom: false },
  { id: 8, name: "Character 8", image: "assets/characters/char8.png", isCustom: false },
  { id: 9, name: "Character 9", image: "assets/characters/char9.png", isCustom: false }
];

class CharacterManager {
  constructor() {
    this.storageKey = 'flappy_dynamic_characters';
  }

  getCharacters() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading characters from storage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CHARACTERS));
  }

  async syncWithCloud() {
    if (window.supabaseService && window.supabaseService.isConfigured()) {
      const cloudChars = await window.supabaseService.getCharacters();
      if (cloudChars && Array.isArray(cloudChars) && cloudChars.length > 0) {
        this.saveCharacters(cloudChars);
        return cloudChars;
      }
    }
    return this.getCharacters();
  }

  getCharacterById(id) {
    const list = this.getCharacters();
    const found = list.find(c => c.id === parseInt(id, 10));
    return found || list[0];
  }

  saveCharacters(chars) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(chars));
      return true;
    } catch (e) {
      console.error('Error saving characters:', e);
      return false;
    }
  }

  addCharacter(name, imageDataUrl) {
    const chars = this.getCharacters();
    const nextId = chars.length > 0 ? Math.max(...chars.map(c => c.id)) + 1 : 1;
    const defaultPlaceholder = "assets/characters/char1.png";

    const newChar = {
      id: nextId,
      name: (name && name.trim()) ? name.trim() : `Character ${nextId}`,
      image: imageDataUrl || defaultPlaceholder,
      isCustom: true
    };

    chars.push(newChar);
    this.saveCharacters(chars);

    if (window.supabaseService && window.supabaseService.isConfigured()) {
      window.supabaseService.upsertCharacter(newChar);
    }

    return newChar;
  }

  updateCharacter(id, newName, newImageDataUrl) {
    const chars = this.getCharacters();
    const index = chars.findIndex(c => c.id === parseInt(id, 10));
    if (index !== -1) {
      if (newName) {
        chars[index].name = newName.trim();
      }
      if (newImageDataUrl) {
        chars[index].image = newImageDataUrl;
        chars[index].isCustom = true;
      }
      this.saveCharacters(chars);

      if (window.supabaseService && window.supabaseService.isConfigured()) {
        window.supabaseService.upsertCharacter(chars[index]);
      }

      return chars[index];
    }
    return null;
  }

  deleteCharacter(id) {
    let chars = this.getCharacters();
    if (chars.length <= 1) {
      return { success: false, message: "Kailangang may kahit isang character na matira!" };
    }
    const filtered = chars.filter(c => c.id !== parseInt(id, 10));
    this.saveCharacters(filtered);

    if (window.supabaseService && window.supabaseService.isConfigured()) {
      window.supabaseService.deleteCharacter(id);
    }

    return { success: true, count: filtered.length };
  }

  resetToDefault() {
    localStorage.removeItem(this.storageKey);
    return JSON.parse(JSON.stringify(DEFAULT_CHARACTERS));
  }
}

window.CharacterManager = CharacterManager;
