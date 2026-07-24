<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center flex-wrap text-subtitle-1">
      絵文字リスト
      <span class="text-medium-emphasis text-body-2 ms-2">
        全 {{ emojis.length }} 件<template v-if="isFiltered">（絞り込み {{ filteredRows.length }} 件）</template> / 選択 {{ selectedNames.length }} 件<template v-if="hasLocalOnly"
          >（ローカル限定を除く）</template
        >
      </span>
      <v-spacer />
      <v-btn size="small" variant="text" :disabled="selectedNames.length === 0" @click="selectedNames = []"> 選択解除 </v-btn>
    </v-card-title>
    <v-card-text>
      <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="名前・カテゴリ・エイリアスで検索" density="comfortable" clearable hide-details class="mb-3" />
      <!-- 検索は自前でフィルタし、絞り込み後の行だけを渡す
           （ヘッダーの全選択が絞り込み結果のみを対象にするため） -->
      <v-data-table
        v-model="selectedNames"
        :headers="headers"
        :items="filteredRows"
        item-value="name"
        item-selectable="selectable"
        show-select
        select-strategy="all"
        :items-per-page="50"
        :items-per-page-options="[25, 50, 100, { value: -1, title: '全件' }]"
        density="comfortable"
        hover
        class="emoji-table"
        @click:row="onRowClick"
      >
        <template #[`item.url`]="{ item }">
          <img v-if="item.url" :src="item.url" :alt="item.name" class="emoji-image" loading="lazy" @click.stop="openLightbox(item)" />
          <v-icon v-else icon="mdi-image-off-outline" class="text-medium-emphasis" />
        </template>
        <template #[`item.category`]="{ item }">
          {{ item.category || '—' }}
        </template>
        <template #[`item.localOnly`]="{ item }">
          <v-icon v-if="item.localOnly" icon="mdi-check" size="small" />
        </template>
        <template #[`item.aliases`]="{ item }">
          {{ item.aliases.join(', ') }}
        </template>
        <template #[`item.license`]="{ item }">
          <span v-if="item.license">{{ item.license }}</span>
          <span v-else-if="item.detailFetched" class="text-medium-emphasis">—</span>
          <span v-else class="text-medium-emphasis">未取得</span>
        </template>
        <template #no-data>
          <div class="text-medium-emphasis pa-4">絵文字データがありません</div>
        </template>
      </v-data-table>
    </v-card-text>

    <!-- 画像プレビュー -->
    <v-dialog v-model="lightbox.visible" max-width="600">
      <v-card>
        <v-card-title class="text-subtitle-1">:{{ lightbox.name }}:</v-card-title>
        <v-card-text class="text-center">
          <img :src="lightbox.src" :alt="lightbox.name" class="lightbox-image" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="lightbox.visible = false">閉じる</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  emojis: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:selected']);

const search = ref('');
// 選択状態は絵文字名（文字列）で保持する（大量選択時にオブジェクト比較を発生させない）
const selectedNames = ref([]);
const lightbox = ref({ visible: false, src: '', name: '' });

const headers = [
  { title: '画像', key: 'url', sortable: false, width: 80 },
  { title: '名前', key: 'name' },
  { title: 'カテゴリ', key: 'category' },
  { title: 'ローカル限定', key: 'localOnly', width: 110 },
  { title: 'エイリアス', key: 'aliases', sortable: false },
  { title: 'ライセンス', key: 'license' },
];

// ローカル限定の絵文字はインポート対象外のため選択不可にする
const rows = computed(() =>
  props.emojis.map((emoji) => ({
    ...emoji,
    selectable: !emoji.localOnly,
  })),
);

const rowByName = computed(() => new Map(rows.value.map((row) => [row.name, row])));

const isFiltered = computed(() => Boolean((search.value || '').trim()));

const hasLocalOnly = computed(() => props.emojis.some((emoji) => emoji.localOnly));

// 名前・カテゴリ・エイリアス・ライセンスの部分一致（大文字小文字区別なし）
const filteredRows = computed(() => {
  const query = (search.value || '').trim().toLowerCase();
  if (!query) return rows.value;
  return rows.value.filter(
    (row) =>
      row.name.toLowerCase().includes(query) ||
      (row.category || '').toLowerCase().includes(query) ||
      row.aliases.some((alias) => alias.toLowerCase().includes(query)) ||
      (row.license || '').toLowerCase().includes(query),
  );
});

// 一覧が入れ替わったら選択をリセットする
watch(
  () => props.emojis,
  () => {
    selectedNames.value = [];
  },
);

watch(selectedNames, (names) => {
  const selected = names.map((name) => rowByName.value.get(name)).filter((row) => row && row.selectable);
  emit('update:selected', selected);
});

// 行のどこをクリックしても選択をトグルする（選択不可の行は無視）
function onRowClick(event, { internalItem, toggleSelect }) {
  if (internalItem.selectable === false) return;
  toggleSelect(internalItem);
}

function openLightbox(item) {
  lightbox.value = { visible: true, src: item.url, name: item.name };
}
</script>

<style scoped>
/* 画面幅が狭いときは列を潰さず横スクロールさせる */
.emoji-table :deep(table) {
  min-width: 720px;
}

/* フッターの表示件数セレクトが 3 桁で見切れないよう幅を確保する */
.emoji-table :deep(.v-data-table-footer__items-per-page .v-select) {
  width: 110px;
}

.emoji-table :deep(tbody tr) {
  cursor: pointer;
}

.emoji-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
  cursor: zoom-in;
  vertical-align: middle;
}

.lightbox-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
}
</style>
