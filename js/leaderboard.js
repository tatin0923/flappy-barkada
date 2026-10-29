/**
 * Leaderboard Handler with Supabase Cloud Support
 * Priority: Supabase Cloud DB -> PHP API -> LocalStorage Fallback
 */

class LeaderboardManager {
  constructor() {
    this.apiGet = 'api/get_scores.php';
    this.apiSave = 'api/save_score.php';
    this.localKey = 'flappy_leaderboard_cache';
  }

  async getScores() {
    // 1. Try Supabase Cloud
    if (window.supabaseService && window.supabaseService.isConfigured()) {
      const cloudScores = await window.supabaseService.getScores();
      if (cloudScores && Array.isArray(cloudScores)) {
        localStorage.setItem(this.localKey, JSON.stringify(cloudScores));
        return cloudScores;
      }
    }

    // 2. Try PHP API (if hosted on Apache/XAMPP)
    try {
      const response = await fetch(this.apiGet);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && Array.isArray(data.scores)) {
          localStorage.setItem(this.localKey, JSON.stringify(data.scores));
          return data.scores;
        }
      }
    } catch (e) {}

    // 3. Fallback: local storage
    const cached = localStorage.getItem(this.localKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {}
    }

    return [
      { id: '1', name: 'Boss Master', character_id: 1, score: 28, date: '2026-10-29 20:15' },
      { id: '2', name: 'King Flapper', character_id: 4, score: 21, date: '2026-10-29 21:05' },
      { id: '3', name: 'Legend 7', character_id: 7, score: 16, date: '2026-10-29 22:30' },
      { id: '4', name: 'Tito Gamer', character_id: 6, score: 11, date: '2026-10-29 23:10' },
      { id: '5', name: 'Pipito', character_id: 5, score: 6, date: '2026-10-30 00:01' }
    ];
  }

  async saveScore(name, characterId, score) {
    const payload = {
      name: name || 'Anonymous',
      character_id: characterId || 1,
      score: score || 0
    };

    // 1. Try Supabase Cloud
    if (window.supabaseService && window.supabaseService.isConfigured()) {
      const res = await window.supabaseService.saveScore(payload.name, payload.character_id, payload.score);
      if (res && res.success) {
        const scores = await this.getScores();
        const rank = scores.findIndex(s => s.name === payload.name && s.score === payload.score) + 1;
        return {
          status: 'success',
          message: 'Score saved to Supabase Cloud Database!',
          rank: rank > 0 ? rank : 1,
          entry: res.entry
        };
      }
    }

    // 2. Try PHP API
    try {
      const response = await fetch(this.apiSave, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (e) {}

    // 3. Fallback: Local storage
    let scores = await this.getScores();
    const newEntry = {
      id: 'local_' + Date.now(),
      name: payload.name,
      character_id: payload.character_id,
      score: payload.score,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    scores.push(newEntry);
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 100);
    localStorage.setItem(this.localKey, JSON.stringify(scores));

    const rank = scores.findIndex(s => s.id === newEntry.id) + 1;
    return {
      status: 'success',
      message: 'Score saved locally!',
      rank: rank,
      entry: newEntry
    };
  }

  renderList(containerEl, scores) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    if (!scores || scores.length === 0) {
      containerEl.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8;">Wala pang scores na nakatala. Maging una sa leaderboard!</div>';
      return;
    }

    scores.forEach((entry, idx) => {
      const rank = idx + 1;
      const rankClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';
      const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

      // Resolve character avatar
      let avatarSrc = `assets/characters/char${entry.character_id || 1}.png`;
      if (window.charManager) {
        const charObj = window.charManager.getCharacterById(entry.character_id);
        if (charObj && charObj.image) {
          avatarSrc = charObj.image;
        }
      }

      const dateStr = entry.created_at || entry.date || '';

      const item = document.createElement('div');
      item.className = `leader-item ${rankClass}`;
      item.innerHTML = `
        <div class="rank-badge">${rankEmoji}</div>
        <img class="leader-avatar" src="${avatarSrc}" alt="Avatar" onerror="this.src='assets/characters/char1.png'">
        <div class="leader-details">
          <div class="leader-name">${escapeHtml(entry.name || 'Anonymous')}</div>
          <div class="leader-date">${dateStr ? dateStr.substring(0, 16).replace('T', ' ') : ''}</div>
        </div>
        <div class="leader-score">${entry.score} pts</div>
      `;
      containerEl.appendChild(item);
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.LeaderboardManager = LeaderboardManager;
