<template>
  <v-card variant="outlined" class="mt-4">
    <v-card-title class="text-subtitle-1">インポート</v-card-title>
    <v-card-text>
      <v-alert v-if="settings.savedDomains.length === 0" type="warning" variant="tonal" class="mb-4"> 「設定」からインポート先のドメインとAPIトークンを設定してください。 </v-alert>
      <v-select
        v-else
        :model-value="settings.lastDomain"
        :items="settings.savedDomains"
        label="インポート先"
        prepend-inner-icon="mdi-server"
        density="comfortable"
        :disabled="importer.running"
        class="mb-2"
        @update:model-value="settings.selectDomain($event)"
      />

      <v-expansion-panels class="mb-4">
        <v-expansion-panel title="フォルダオプション">
          <v-expansion-panel-text>
            <v-radio-group v-model="folderMode" hide-details>
              <v-radio label="フォルダを作成しない（ルートに保存）" value="none" />
              <v-radio label="指定した名前のフォルダに保存" value="fixed" />
              <v-radio label="絵文字のカテゴリ名のフォルダに保存" value="category" />
            </v-radio-group>
            <v-text-field v-if="folderMode === 'fixed'" v-model="folderName" label="フォルダ名" placeholder="例: 絵文字" density="comfortable" class="mt-3" />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <div class="d-flex ga-2">
        <v-btn color="success" class="flex-grow-1" size="large" :disabled="!canStart" prepend-icon="mdi-import" @click="start">
          {{ importer.running ? 'インポート中…' : `選択した ${selectedEmojis.length} 件をインポート` }}
        </v-btn>
        <v-btn v-if="importer.running" color="error" size="large" variant="tonal" prepend-icon="mdi-stop" @click="importer.cancel()"> 停止 </v-btn>
      </div>

      <!-- 進捗表示 -->
      <div v-if="importer.running || importer.results.length > 0" class="mt-4">
        <v-progress-linear :model-value="importer.progressPercent" :color="importer.running ? 'primary' : importer.errorCount > 0 ? 'warning' : 'success'" height="20" rounded>
          <span class="text-caption">{{ importer.done }} / {{ importer.total }}</span>
        </v-progress-linear>
        <div v-if="importer.running" class="text-body-2 text-medium-emphasis mt-2"> 処理中: :{{ importer.currentName }}: </div>
        <div v-else class="text-body-2 mt-2"> 成功 {{ importer.successCount }} 件 / スキップ {{ importer.skippedCount }} 件 / エラー {{ importer.errorCount }} 件 </div>
        <!-- 通信ログと同じ方式（単一テキストノード・最下部固定・高さ制限） -->
        <div v-if="problemResults.length > 0" class="result-log mt-2">
          <pre class="result-text">{{ resultText }}</pre>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.result-log {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  padding: 8px 12px;
  /* scrollTop 0 が下端になり、追記時も最新行が下端に固定される */
  display: flex;
  flex-direction: column-reverse;
}

.result-text {
  margin: 0;
  font-family: monospace;
  font-size: 0.85em;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useImporterStore } from '@/stores/importer';
import { useNotifyStore } from '@/stores/notify';

const props = defineProps({
  selectedEmojis: { type: Array, default: () => [] },
  // ライセンス未取得時の詳細補完に使うインポート元ドメイン
  sourceDomain: { type: String, default: '' },
});

const settings = useSettingsStore();
const importer = useImporterStore();
const notify = useNotifyStore();

const folderMode = ref('none');
const folderName = ref('');

// 別ビューでの前回実行結果を持ち越さない（実行中の場合は表示を維持）
onMounted(() => {
  importer.reset();
});

const canStart = computed(() => settings.isConfigured && props.selectedEmojis.length > 0 && !importer.running && !(folderMode.value === 'fixed' && !folderName.value.trim()));

const problemResults = computed(() => importer.results.filter((r) => r.status !== 'success'));

const resultText = computed(() => problemResults.value.map((r) => `[${r.status === 'skipped' ? 'スキップ' : 'エラー'}] :${r.name}: ${r.message}`).join('\n'));

async function start() {
  try {
    const summary = await importer.run(props.selectedEmojis, {
      sourceDomain: props.sourceDomain,
      folderMode: folderMode.value,
      folderName: folderName.value.trim(),
    });
    if (summary.cancelled) {
      notify.warning(`インポートを停止しました（成功 ${summary.success} 件）`);
    } else if (summary.errors > 0 || summary.skipped > 0) {
      notify.warning(`インポート完了: 成功 ${summary.success} 件 / スキップ ${summary.skipped} 件 / エラー ${summary.errors} 件`);
    } else {
      notify.success(`${summary.success} 件の絵文字をインポートしました`);
    }
  } catch (error) {
    notify.error(error.message);
  }
}
</script>
