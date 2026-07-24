import { defineStore } from 'pinia';
import { normalizeOrigin, apiErrorMessage, checkEmojiExists, fetchEmojiDetail, ensureFolder, uploadEmojiFile, addEmoji } from '@/api/misskey';
import { useSettingsStore } from '@/stores/settings';

// 絵文字を1件ずつ処理する間のウェイト（宛先サーバーへの負荷軽減）
const INTERVAL_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// インポート処理の実行・進捗・中断を管理するストア
export const useImporterStore = defineStore('importer', {
  state: () => ({
    running: false,
    cancelRequested: false,
    total: 0,
    done: 0,
    currentName: '',
    // { name, status: 'success' | 'skipped' | 'error', message } の配列
    results: [],
  }),
  getters: {
    progressPercent: (state) => (state.total === 0 ? 0 : Math.round((state.done / state.total) * 100)),
    successCount: (state) => state.results.filter((r) => r.status === 'success').length,
    skippedCount: (state) => state.results.filter((r) => r.status === 'skipped').length,
    errorCount: (state) => state.results.filter((r) => r.status === 'error').length,
  },
  actions: {
    // 前回の実行結果・進捗をクリアする（実行中は何もしない）
    reset() {
      if (this.running) return;
      this.cancelRequested = false;
      this.total = 0;
      this.done = 0;
      this.currentName = '';
      this.results = [];
    },
    cancel() {
      if (this.running) {
        this.cancelRequested = true;
      }
    },
    // 選択された絵文字をインポートする
    // options: { sourceDomain, folderMode: 'none'|'fixed'|'category', folderName }
    async run(emojis, options) {
      if (this.running) {
        throw new Error('インポート処理が既に実行中です');
      }
      const settings = useSettingsStore();
      if (!settings.isConfigured) {
        throw new Error('設定画面でインポート先のドメインとAPIトークンを設定してください');
      }

      const origin = normalizeOrigin(settings.lastDomain);
      const { emojiApiToken, driveApiToken } = settings.currentTokens;
      const sourceOrigin = options.sourceDomain ? normalizeOrigin(options.sourceDomain) : null;

      this.running = true;
      this.cancelRequested = false;
      this.total = emojis.length;
      this.done = 0;
      this.currentName = '';
      this.results = [];

      // フォルダ名 → ID のキャッシュ（実行単位）
      const folderIds = new Map();

      try {
        for (const emoji of emojis) {
          if (this.cancelRequested) break;
          this.currentName = emoji.name;

          try {
            // ローカル限定の絵文字はインポート対象外（選択 UI とは別にここでも弾く）
            if (emoji.localOnly) {
              this.results.push({
                name: emoji.name,
                status: 'skipped',
                message: 'ローカル限定のためインポート対象外です',
              });
              continue;
            }

            // 同名絵文字が既にあればスキップ
            if (await checkEmojiExists(origin, emoji.name)) {
              this.results.push({
                name: emoji.name,
                status: 'skipped',
                message: '同名の絵文字が既に存在します',
              });
              continue;
            }

            // 一覧取得のみでライセンス未取得の場合、インポート時に詳細を補完する
            let target = emoji;
            if (!emoji.detailFetched && sourceOrigin) {
              try {
                target = await fetchEmojiDetail(sourceOrigin, emoji.name);
              } catch (error) {
                console.warn(`絵文字 ${emoji.name} の詳細取得に失敗したため一覧の情報で続行します`, error);
              }
            }

            // フォルダオプションの解決
            let folderId = null;
            if (options.folderMode !== 'none') {
              const folderName = options.folderMode === 'category' ? target.category || '未分類' : options.folderName;
              if (folderName) {
                if (!folderIds.has(folderName)) {
                  folderIds.set(folderName, await ensureFolder(origin, driveApiToken, folderName));
                }
                folderId = folderIds.get(folderName);
              }
            }

            const fileId = await uploadEmojiFile(origin, driveApiToken, target.url, folderId);
            await addEmoji(origin, emojiApiToken, target, fileId);
            this.results.push({ name: emoji.name, status: 'success', message: '' });
          } catch (error) {
            console.error(`絵文字 ${emoji.name} のインポートに失敗しました:`, error);
            this.results.push({
              name: emoji.name,
              status: 'error',
              message: apiErrorMessage(error),
            });
          } finally {
            this.done++;
          }

          await sleep(INTERVAL_MS);
        }
      } finally {
        this.running = false;
        this.currentName = '';
      }

      return {
        cancelled: this.cancelRequested,
        success: this.successCount,
        skipped: this.skippedCount,
        errors: this.errorCount,
      };
    },
  },
});
