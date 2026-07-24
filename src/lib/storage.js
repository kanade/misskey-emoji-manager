// 設定・トークンの永続化（localStorage）
// 旧バージョンのキー（settings_*, tokens_*, lastSelectedDomain, sourceDomain）は
// 初回読み込み時に単一キーへ自動移行する。

const STORAGE_KEY = 'emoji-manager:settings';

const defaultState = () => ({
  // 最後に選択したインポート先ドメイン
  lastDomain: '',
  // 最後に使用したインポート元ドメイン
  sourceDomain: '',
  // テーマ（'light' | 'dark'）
  theme: 'light',
  // ドメインごとのトークン { [domain]: { emojiApiToken, driveApiToken } }
  domains: {},
});

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// 旧キーからの移行。旧キー自体は安全のため残す（絵文字キャッシュは emojiCache 側で移行・削除する）
function migrateLegacy(state) {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    keys.push(localStorage.key(i));
  }

  // 設定モーダルが保存していた settings_{domain}
  for (const key of keys) {
    if (!key || !key.startsWith('settings_')) continue;
    const domain = key.slice('settings_'.length);
    const saved = safeParse(localStorage.getItem(key));
    if (saved && domain) {
      state.domains[domain] = {
        emojiApiToken: saved.emojiApiToken || '',
        driveApiToken: saved.driveApiToken || '',
      };
    }
  }

  // インポート成功時に保存していた tokens_{domain}（settings_ 側がなければ採用）
  for (const key of keys) {
    if (!key || !key.startsWith('tokens_')) continue;
    const domain = key.slice('tokens_'.length);
    const saved = safeParse(localStorage.getItem(key));
    if (saved && domain && !state.domains[domain]) {
      state.domains[domain] = {
        emojiApiToken: saved.emojiApiToken || '',
        driveApiToken: saved.driveApiToken || '',
      };
    }
  }

  const lastSelectedDomain = localStorage.getItem('lastSelectedDomain');
  if (lastSelectedDomain && state.domains[lastSelectedDomain]) {
    state.lastDomain = lastSelectedDomain;
  } else {
    state.lastDomain = Object.keys(state.domains)[0] || '';
  }

  state.sourceDomain = localStorage.getItem('sourceDomain') || '';
  return state;
}

export function loadSettings() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeParse(raw) : null;
  if (parsed) {
    return { ...defaultState(), ...parsed };
  }
  const state = migrateLegacy(defaultState());
  saveSettings(state);
  return state;
}

export function saveSettings(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
