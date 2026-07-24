import { http } from './http';

// Misskey / Firefish 系インスタンスへの API アクセスを一元化するモジュール

// ドメイン入力を https:// 付きのオリジンに正規化する
export function normalizeOrigin(domain) {
  const trimmed = (domain || '').trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new Error('ドメインが入力されていません');
  }
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

// Misskey API のエラーからユーザー向けメッセージを取り出す
export function apiErrorMessage(error) {
  const apiError = error?.response?.data?.error;
  if (apiError?.message) return apiError.message;
  if (error?.response?.status) return `HTTP ${error.response.status}`;
  return error?.message || '不明なエラー';
}

const instanceTypeCache = new Map();

// インスタンス種別（misskey / firefish / その他）を判定する
export async function detectInstanceType(origin) {
  if (instanceTypeCache.has(origin)) {
    return instanceTypeCache.get(origin);
  }
  let type = 'unknown';

  try {
    const res = await http.post(`${origin}/api/meta`, { detail: false });
    const repositoryUrl = res.data.repositoryUrl || '';
    if (repositoryUrl.includes('firefish')) {
      type = 'firefish';
    } else if (repositoryUrl.includes('misskey')) {
      type = 'misskey';
    }
  } catch (error) {
    console.warn('メタ情報の取得に失敗しました:', error);
  }

  if (type === 'unknown') {
    try {
      const res = await http.get(`${origin}/.well-known/nodeinfo`);
      const link = res.data?.links?.find((l) => l.rel?.includes('nodeinfo'));
      if (link) {
        const details = await http.get(link.href);
        const name = details.data?.software?.name;
        if (name) {
          type = String(name).toLowerCase();
        }
      }
    } catch (error) {
      console.warn('nodeinfo の取得に失敗しました:', error);
    }
  }

  instanceTypeCache.set(origin, type);
  return type;
}

// 絵文字オブジェクトをアプリ内部の共通形式に揃える
function normalizeEmoji(raw) {
  return {
    name: raw.name,
    url: raw.url || '',
    category: raw.category ?? null,
    aliases: Array.isArray(raw.aliases) ? raw.aliases.filter(Boolean) : [],
    license: raw.license ?? null,
    isSensitive: raw.isSensitive ?? false,
    localOnly: raw.localOnly ?? false,
    // /api/emojis の一覧にはライセンスが含まれないため、詳細取得済みかを持つ
    detailFetched: 'license' in raw,
  };
}

// インスタンスの絵文字一覧を取得する（詳細は含まれない）
export async function fetchEmojiList(origin) {
  const type = await detectInstanceType(origin);
  const res = await http.request({
    method: type === 'firefish' ? 'post' : 'get',
    url: `${origin}/api/emojis`,
  });
  const emojis = res.data?.emojis || [];
  const seen = new Set();
  return emojis
    .filter((e) => {
      const key = `${e.name} ${e.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(normalizeEmoji);
}

// 絵文字1件の詳細（ライセンス等）を取得する
export async function fetchEmojiDetail(origin, name) {
  const type = await detectInstanceType(origin);
  const url = `${origin}/api/emoji`;
  const res = type === 'firefish' ? await http.post(url, { name }) : await http.get(url, { params: { name } });
  return { ...normalizeEmoji(res.data), name, detailFetched: true };
}

// 一覧の各絵文字についてライセンス等の詳細を取得する。
// 一覧 API（/api/emojis）にはライセンスが含まれないため1件ずつ取得する。
// 相手サーバーへの負荷を抑えるため、少数ずつ・間隔を空けて取得する。
export async function fetchEmojiDetails(origin, emojis, { batchSize = 10, intervalMs = 300, onProgress, shouldStop } = {}) {
  const detailed = [];
  for (let i = 0; i < emojis.length; i += batchSize) {
    // 途中停止が要求されたら残りは未取得のまま返す
    if (shouldStop && shouldStop()) {
      detailed.push(...emojis.slice(i));
      break;
    }
    const batch = emojis.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (emoji) => {
        try {
          const detail = await fetchEmojiDetail(origin, emoji.name);
          return { ...emoji, ...detail };
        } catch (error) {
          console.warn(`絵文字 ${emoji.name} の詳細取得に失敗しました:`, error);
          return emoji;
        }
      }),
    );
    detailed.push(...results);
    if (onProgress) {
      onProgress(detailed.length, emojis.length, detailed);
    }
    if (i + batchSize < emojis.length) {
      await sleep(intervalMs);
    }
  }
  return detailed;
}

// 宛先に同名の絵文字が存在するか確認する
export async function checkEmojiExists(origin, name) {
  try {
    const res = await http.get(`${origin}/api/emoji`, { params: { name } });
    return Boolean(res.data && res.data.url);
  } catch {
    // 未登録の場合は 404 が返る
    return false;
  }
}

// 指定名のドライブフォルダを検索し、なければ作成して ID を返す。
// フォルダ ID を返すまでアップロードには進まないため、格納先の実在が保証される。
// ID が確認できない場合は例外を投げる（ルートへの意図しない保存を防ぐ）。
export async function ensureFolder(origin, driveToken, folderName) {
  const findFolderId = async () => {
    const res = await http.post(`${origin}/api/drive/folders/find`, {
      i: driveToken,
      name: folderName,
    });
    return Array.isArray(res.data) && res.data.length > 0 ? res.data[0].id : null;
  };

  const existingId = await findFolderId();
  if (existingId) return existingId;

  const createRes = await http.post(`${origin}/api/drive/folders/create`, {
    i: driveToken,
    name: folderName,
  });
  if (createRes.data && createRes.data.id) {
    return createRes.data.id;
  }

  // 204（空レスポンス）を返す実装では作成結果から ID が取れないため、find で実在確認する
  for (let i = 0; i < 5; i++) {
    await sleep(500);
    const id = await findFolderId();
    if (id) return id;
  }
  throw new Error(`フォルダ「${folderName}」の作成を確認できませんでした`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 絵文字画像を URL からドライブへアップロードし、ファイル ID を返す。
// upload-from-url は非同期処理のため、アップロード前の最新ファイル ID を記録しておき、
// 新しいファイルが現れたらそれを採用する（ファイル名による照合は行わない。
// 処理は1件ずつ直列のため、新規に現れた最新ファイルが対象ファイルとなる）
export async function uploadEmojiFile(origin, driveToken, emojiUrl, folderId = null) {
  const latestFileId = async () => {
    const res = await http.post(`${origin}/api/drive/files`, {
      i: driveToken,
      limit: 1,
      ...(folderId && { folderId }),
    });
    return Array.isArray(res.data) && res.data.length > 0 ? res.data[0].id : null;
  };

  const beforeId = await latestFileId();

  await http.post(`${origin}/api/drive/files/upload-from-url`, {
    i: driveToken,
    url: emojiUrl,
    ...(folderId && { folderId }),
  });

  const deadline = Date.now() + 20000;
  let interval = 1000;
  while (Date.now() < deadline) {
    await sleep(interval);
    interval = Math.min(interval * 1.5, 4000);
    const currentId = await latestFileId();
    if (currentId && currentId !== beforeId) {
      return currentId;
    }
  }

  throw new Error('アップロードしたファイルを確認できませんでした');
}

// 絵文字を宛先インスタンスに登録する
export async function addEmoji(origin, emojiToken, emoji, fileId) {
  const res = await http.post(`${origin}/api/admin/emoji/add`, {
    i: emojiToken,
    name: emoji.name,
    category: emoji.category ?? null,
    aliases: emoji.aliases ?? [],
    license: emoji.license ?? null,
    isSensitive: emoji.isSensitive ?? false,
    localOnly: false,
    roleIdsThatCanBeUsedThisEmojiAsReaction: [],
    fileId,
  });
  return res.data;
}
