<template>
  <v-container fluid>
    <h1 class="text-h5 mb-4">クリップボードインポート</h1>
    <p class="text-body-2 text-medium-emphasis mb-4"> 貼り付けたテキストに含まれる絵文字コード（:emoji_name: 形式）を抽出し、 インポート元サーバーから情報を取得して選択的にインポートします。 </p>

    <v-text-field v-model="sourceDomain" label="インポート元のドメイン" placeholder="example.com" prepend-inner-icon="mdi-server" density="comfortable" />
    <v-textarea v-model="emojiInput" label="絵文字コードを含むテキスト" placeholder=":emoji_a: :emoji_b: のようなテキストを貼り付けてください" rows="3" auto-grow />
    <div class="d-flex ga-2 mb-4">
      <v-btn color="primary" class="flex-grow-1" :disabled="loading || !sourceDomain || !emojiInput" prepend-icon="mdi-text-search" @click="extractEmojis">
        {{ loading ? '抽出中…' : '絵文字を抽出' }}
      </v-btn>
      <v-btn v-if="loading" color="error" variant="tonal" prepend-icon="mdi-stop" @click="extractStop = true"> 停止 </v-btn>
    </div>

    <EmojiTable :emojis="emojis" @update:selected="selected = $event" />

    <ImportPanel :selected-emojis="selected" :source-domain="sourceDomain" />

    <RequestLog />
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import EmojiTable from '@/components/EmojiTable.vue';
import ImportPanel from '@/components/ImportPanel.vue';
import RequestLog from '@/components/RequestLog.vue';
import { normalizeOrigin, fetchEmojiDetails } from '@/api/misskey';
import { loadEmojiList, saveEmojiList } from '@/lib/emojiCache';
import { useSettingsStore } from '@/stores/settings';
import { useImporterStore } from '@/stores/importer';
import { useNotifyStore } from '@/stores/notify';

const settings = useSettingsStore();
const importer = useImporterStore();
const notify = useNotifyStore();

const sourceDomain = ref(settings.sourceDomain);
const emojiInput = ref('');
const emojis = ref([]);
const selected = ref([]);
const loading = ref(false);
const extractStop = ref(false);

// :name: 形式から絵文字名を抽出する
// 文字クラスは Misskey の絵文字名の仕様（admin/emoji/add の pattern ^[a-zA-Z0-9_]+$）に合わせる
// :name@host: 形式はインポート対象外のため抽出しない
function extractEmojiNames(text) {
  const regex = /:([a-zA-Z0-9_]+):/g;
  const names = [...text.matchAll(regex)].map((match) => match[1]);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

async function extractEmojis() {
  loading.value = true;
  extractStop.value = false;
  importer.reset();
  try {
    const names = extractEmojiNames(emojiInput.value);
    if (names.length === 0) {
      notify.warning('絵文字コードが見つかりませんでした');
      emojis.value = [];
      return;
    }

    const domain = sourceDomain.value.trim();
    const origin = normalizeOrigin(domain);
    settings.setSourceDomain(domain);

    // IndexedDB のキャッシュを先に引き、詳細取得済みのものはサーバーへ問い合わせない
    const cached = await loadEmojiList(domain);
    const cacheMap = new Map((cached?.emojis || []).map((e) => [e.name, e]));
    const fromCache = [];
    const namesToFetch = [];
    for (const name of names) {
      const hit = cacheMap.get(name);
      if (hit && hit.detailFetched) {
        fromCache.push(hit);
      } else {
        namesToFetch.push(name);
      }
    }

    // キャッシュにない絵文字のみ、サーバー負荷を抑えつつ取得する
    let fetched = [];
    if (namesToFetch.length > 0) {
      fetched = (
        await fetchEmojiDetails(
          origin,
          namesToFetch.map((name) => ({ name })),
          {
            batchSize: 5,
            shouldStop: () => extractStop.value,
          },
        )
      ).filter((emoji) => emoji.detailFetched);
    }

    const results = [...fromCache, ...fetched].sort((a, b) => a.name.localeCompare(b.name));
    emojis.value = results;

    // 新規に取得した詳細は既存キャッシュへマージして書き戻す
    // （キャッシュがないドメインには作らない。一括インポートの「保存済みデータ」が
    //   全件リストであることを維持するため）
    if (cached && fetched.length > 0) {
      for (const emoji of fetched) {
        cacheMap.set(emoji.name, emoji);
      }
      await saveEmojiList(domain, [...cacheMap.values()]);
    }

    if (extractStop.value) {
      notify.warning(`抽出を停止しました（${results.length} / ${names.length} 件処理済み）`);
      return;
    }
    const failed = names.length - results.length;
    const detail = `キャッシュ ${fromCache.length} 件 / 取得 ${fetched.length} 件`;
    if (failed > 0) {
      notify.warning(`${results.length} 件を抽出しました（${detail}、${failed} 件は取得できませんでした）`);
    } else {
      notify.success(`${results.length} 件の絵文字を抽出しました（${detail}）`);
    }
  } catch (error) {
    console.error('絵文字の抽出中にエラーが発生しました:', error);
    notify.error(`絵文字の抽出中にエラーが発生しました: ${error.message}`);
  } finally {
    loading.value = false;
  }
}
</script>
