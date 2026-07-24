import { defineStore } from 'pinia';

// リクエストログ（画面下部の通信ログ表示用）
// 取得処理中は大量のリクエストが発生するため、記録はストアを介さず
// 非リアクティブなバッファに行い、一定間隔でまとめてストアへ反映する。
const MAX_LOGS = 1000;
const FLUSH_INTERVAL_MS = 500;

const buffer = [];
let nextId = 1;
let flushTimer = null;

export const useLogStore = defineStore('logs', {
  state: () => ({
    entries: [],
  }),
  actions: {
    clear() {
      buffer.length = 0;
      this.entries = [];
    },
  },
});

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    const store = useLogStore();
    store.$patch((state) => {
      state.entries = buffer.map((e) => ({ ...e }));
    });
  }, FLUSH_INTERVAL_MS);
}

// リクエスト開始時に登録し、ログ ID を返す
export function beginLog(method, url) {
  const id = nextId++;
  buffer.push({
    id,
    method,
    url,
    status: '通信中',
    timestamp: new Date().toISOString(),
  });
  if (buffer.length > MAX_LOGS) {
    buffer.splice(0, buffer.length - MAX_LOGS);
  }
  scheduleFlush();
  return id;
}

// レスポンス受信時にステータスを更新する
export function finishLog(id, status) {
  for (let i = buffer.length - 1; i >= 0; i--) {
    if (buffer[i].id === id) {
      buffer[i].status = status;
      break;
    }
  }
  scheduleFlush();
}
