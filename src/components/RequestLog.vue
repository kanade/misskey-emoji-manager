<template>
  <v-card variant="outlined" class="mt-4">
    <v-card-title class="d-flex align-center text-subtitle-1">
      通信ログ
      <v-spacer />
      <v-btn v-if="logs.entries.length > displayLimit" size="small" variant="text" @click="displayLimit += PAGE_SIZE"> 過去分を表示 </v-btn>
      <v-btn size="small" variant="text" :disabled="logs.entries.length === 0" @click="clear"> クリア </v-btn>
    </v-card-title>
    <!-- 描画負荷を抑えるため、行単位の DOM ではなく単一のテキストノードで表示する -->
    <div class="log-container">
      <pre class="log-text">{{ logText }}</pre>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDisplay } from 'vuetify';
import { useLogStore } from '@/stores/logs';

const logs = useLogStore();
const { smAndUp } = useDisplay();

// 直近 PAGE_SIZE 件を表示し、「過去分を表示」で PAGE_SIZE 件ずつ増やす
const PAGE_SIZE = 100;
const displayLimit = ref(PAGE_SIZE);

const logText = computed(() => {
  if (logs.entries.length === 0) {
    return '通信が発生するとここにログが表示されます';
  }
  return logs.entries
    .slice(-displayLimit.value)
    .map((entry) => `${entry.method} ${displayUrl(entry.url)} - ${entry.status}`)
    .join('\n');
});

function clear() {
  logs.clear();
  displayLimit.value = PAGE_SIZE;
}

// 幅が充分（sm 以上）ならフル URL、狭い画面ではパス以降のみ表示する（記録はフル URL）
function displayUrl(url) {
  if (smAndUp.value) return url;
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}
</script>

<style scoped>
.log-container {
  max-height: 200px;
  overflow-y: auto;
  padding: 0 12px 12px;
  /* scrollTop 0 が下端になり、追記時も最新行が下端に固定される */
  display: flex;
  flex-direction: column-reverse;
}

.log-text {
  margin: 0;
  font-family: monospace;
  font-size: 0.85em;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
