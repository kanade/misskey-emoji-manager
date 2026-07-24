// 絵文字リストのキャッシュ（IndexedDB）
// 一覧データはサイズが大きいため localStorage ではなく IndexedDB に保存する。
// 旧バージョンの localStorage キー emojis_{domain} は初回に移行し、移行後に削除する。

const DB_NAME = 'emoji-manager';
const STORE_NAME = 'emoji-lists';
const DB_VERSION = 1;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'domain' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// domain をキーに絵文字リストを保存する
export async function saveEmojiList(domain, emojis) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  // リアクティブプロキシは structured clone できないためプレーンな値に変換する
  const record = {
    domain,
    emojis: JSON.parse(JSON.stringify(emojis)),
    updatedAt: new Date().toISOString(),
  };
  await requestToPromise(tx.objectStore(STORE_NAME).put(record));
  return record;
}

// 保存済みリストを取得する（なければ null）
export async function loadEmojiList(domain) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const record = await requestToPromise(tx.objectStore(STORE_NAME).get(domain));
  return record || null;
}

// 旧バージョンが localStorage に保存していた emojis_{domain} を IndexedDB へ移行する
export async function migrateLegacyEmojiCaches() {
  const legacyKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('emojis_')) {
      legacyKeys.push(key);
    }
  }
  if (legacyKeys.length === 0) return;

  for (const key of legacyKeys) {
    const domain = key.slice('emojis_'.length);
    try {
      const emojis = JSON.parse(localStorage.getItem(key));
      if (domain && Array.isArray(emojis)) {
        const existing = await loadEmojiList(domain);
        if (!existing) {
          await saveEmojiList(domain, emojis);
        }
      }
      // 移行済みデータは localStorage の容量を圧迫するため削除する
      localStorage.removeItem(key);
      console.log(`絵文字キャッシュを IndexedDB へ移行しました: ${domain}`);
    } catch (error) {
      console.error(`絵文字キャッシュの移行に失敗しました: ${key}`, error);
    }
  }
}
