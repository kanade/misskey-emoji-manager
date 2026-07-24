<template>
  <v-container fluid>
    <h1 class="text-h5 mb-4">一括インポート</h1>
    <p class="text-body-2 text-medium-emphasis mb-4">
      インポート元サーバーの絵文字一覧をライセンス情報付きで取得し、内容を確認しながら選択してインポートします。
      ライセンスは絵文字1件ずつの取得が必要なため、絵文字数や通信環境によっては取得に長い時間がかかります。
    </p>

    <v-text-field v-model="sourceDomain" label="インポート元のドメイン" placeholder="example.com" prepend-inner-icon="mdi-server" density="comfortable" />

    <div class="d-flex flex-column flex-sm-row ga-2 mb-2">
      <v-btn color="primary" class="flex-grow-1" :disabled="loading || !sourceDomain" prepend-icon="mdi-database" @click="loadFromCache"> 保存済みデータを読み込む </v-btn>
      <v-btn color="error" variant="tonal" class="flex-grow-1" :disabled="loading || !sourceDomain" prepend-icon="mdi-cloud-download" @click="fetchFromRemote">
        {{ loading ? '取得中…' : 'サーバーから取得' }}
      </v-btn>
    </div>
    <div v-if="detailTotal > 0" class="d-flex align-center ga-2 mb-4">
      <v-progress-linear :model-value="Math.round((detailDone / detailTotal) * 100)" color="primary" height="20" rounded>
        <span class="text-caption">ライセンス情報を取得中 {{ detailDone }} / {{ detailTotal }}</span>
      </v-progress-linear>
      <v-btn color="error" size="small" variant="tonal" prepend-icon="mdi-stop" @click="detailStop = true"> 停止 </v-btn>
    </div>
    <p v-if="updatedAt" class="text-caption text-medium-emphasis mb-4"> 最終取得: {{ formatDate(updatedAt) }}（取得済みデータはこのブラウザに保存されています） </p>
    <p v-else class="text-caption text-medium-emphasis mb-4"> 「サーバーから取得」は相手サーバーに負荷をかけるため、短時間に繰り返さないでください。 </p>

    <EmojiTable :emojis="emojis" @update:selected="selected = $event" />

    <ImportPanel :selected-emojis="selected" :source-domain="sourceDomain" />

    <RequestLog />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import EmojiTable from '@/components/EmojiTable.vue';
import ImportPanel from '@/components/ImportPanel.vue';
import RequestLog from '@/components/RequestLog.vue';
import { normalizeOrigin, fetchEmojiList, fetchEmojiDetails, apiErrorMessage } from '@/api/misskey';
import { loadEmojiList, saveEmojiList } from '@/lib/emojiCache';
import { useSettingsStore } from '@/stores/settings';
import { useImporterStore } from '@/stores/importer';
import { useNotifyStore } from '@/stores/notify';

const settings = useSettingsStore();
const importer = useImporterStore();
const notify = useNotifyStore();

const sourceDomain = ref(settings.sourceDomain);
const emojis = ref([]);
const selected = ref([]);
const loading = ref(false);
const updatedAt = ref('');
const detailDone = ref(0);
const detailTotal = ref(0);
const detailStop = ref(false);

onMounted(async () => {
  // 前回使ったドメインの保存済みデータがあれば自動表示する
  if (sourceDomain.value) {
    const cached = await loadEmojiList(sourceDomain.value.trim());
    if (cached) {
      emojis.value = cached.emojis;
      updatedAt.value = cached.updatedAt;
    }
  }
});

async function loadFromCache() {
  loading.value = true;
  importer.reset();
  try {
    const cached = await loadEmojiList(sourceDomain.value.trim());
    if (cached) {
      emojis.value = cached.emojis;
      updatedAt.value = cached.updatedAt;
      notify.success(`保存済みデータを読み込みました（${cached.emojis.length} 件）`);
    } else {
      notify.warning('保存済みデータがありません。「サーバーから取得」を実行してください。');
    }
  } catch (error) {
    console.error('保存済みデータの読み込みに失敗しました:', error);
    notify.error('保存済みデータの読み込みに失敗しました');
  } finally {
    loading.value = false;
  }
}

async function fetchFromRemote() {
  loading.value = true;
  importer.reset();
  detailDone.value = 0;
  detailTotal.value = 0;
  try {
    const domain = sourceDomain.value.trim();
    const origin = normalizeOrigin(domain);
    const list = await fetchEmojiList(origin);
    settings.setSourceDomain(domain);

    // まず一覧（詳細なし）を保存し、途中で中断してもデータが残るようにする
    await saveEmojiList(domain, list);

    // ライセンスは一覧 API に含まれないため、全絵文字の詳細を取得する。
    // 取得中は 100 件ごとに IndexedDB へ部分保存する
    detailStop.value = false;
    detailTotal.value = list.length;
    let lastSavedCount = 0;
    let partialSaving = false;
    const savePartial = (detailedSoFar) => {
      if (partialSaving) return;
      partialSaving = true;
      const snapshot = [...detailedSoFar, ...list.slice(detailedSoFar.length)];
      saveEmojiList(domain, snapshot)
        .catch((error) => console.error('絵文字キャッシュの部分保存に失敗しました:', error))
        .finally(() => {
          partialSaving = false;
        });
    };
    const detailed = await fetchEmojiDetails(origin, list, {
      onProgress: (done, total, detailedSoFar) => {
        detailDone.value = done;
        if (done - lastSavedCount >= 100) {
          lastSavedCount = done;
          savePartial(detailedSoFar);
        }
      },
      shouldStop: () => detailStop.value,
    });

    emojis.value = detailed;
    const record = await saveEmojiList(domain, detailed);
    updatedAt.value = record.updatedAt;
    if (detailStop.value) {
      notify.warning(`取得を停止しました（${detailDone.value} / ${list.length} 件取得済み。未取得分のライセンスはインポート時に取得されます）`);
    } else {
      notify.success(`絵文字一覧を取得しました（${detailed.length} 件）`);
    }
  } catch (error) {
    console.error('絵文字一覧の取得に失敗しました:', error);
    notify.error(`絵文字一覧の取得に失敗しました: ${apiErrorMessage(error)}`);
  } finally {
    loading.value = false;
    detailTotal.value = 0;
  }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('ja-JP');
  } catch {
    return iso;
  }
}
</script>
