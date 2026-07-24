<template>
  <v-dialog v-model="visible" max-width="560">
    <v-card>
      <v-card-title>設定</v-card-title>
      <v-card-text>
        <v-select v-model="selectedDomain" :items="domainItems" item-title="title" item-value="value" label="保存済みドメイン" density="comfortable" @update:model-value="onDomainChange" />
        <v-text-field
          v-model="form.domain"
          label="インポート先のドメイン"
          placeholder="example.com"
          density="comfortable"
          :disabled="selectedDomain !== NEW_DOMAIN"
          :error-messages="showWarning && !form.domain ? ['この項目は必須です'] : []"
        />
        <v-text-field
          v-model="form.emojiApiToken"
          label="絵文字の操作と閲覧権限のあるAPIトークン"
          type="password"
          density="comfortable"
          :error-messages="showWarning && !form.emojiApiToken ? ['この項目は必須です'] : []"
        />
        <v-text-field
          v-model="form.driveApiToken"
          label="ドライブの操作と閲覧権限のあるAPIトークン"
          type="password"
          density="comfortable"
          :error-messages="showWarning && !form.driveApiToken ? ['この項目は必須です'] : []"
        />
        <v-alert type="info" variant="tonal" density="compact" class="mt-2"> トークンはこのブラウザの localStorage にのみ保存されます。サーバーには送信されません。 </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn v-if="selectedDomain !== NEW_DOMAIN" color="error" variant="text" @click="confirmingDelete = true"> このドメインを削除 </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="close">キャンセル</v-btn>
        <v-btn color="primary" variant="flat" @click="save">保存</v-btn>
      </v-card-actions>
    </v-card>

    <!-- 削除確認 -->
    <v-dialog v-model="confirmingDelete" max-width="400">
      <v-card>
        <v-card-title>削除の確認</v-card-title>
        <v-card-text> 「{{ selectedDomain }}」の設定（トークン含む）を削除します。よろしいですか？ </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmingDelete = false">キャンセル</v-btn>
          <v-btn color="error" variant="flat" @click="removeDomain">削除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useNotifyStore } from '@/stores/notify';

const NEW_DOMAIN = '__new__';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const settings = useSettingsStore();
const notify = useNotifyStore();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const selectedDomain = ref(NEW_DOMAIN);
const showWarning = ref(false);
const confirmingDelete = ref(false);
const form = ref({ domain: '', emojiApiToken: '', driveApiToken: '' });

const domainItems = computed(() => [...settings.savedDomains.map((d) => ({ title: d, value: d })), { title: '＋ 新規ドメイン登録', value: NEW_DOMAIN }]);

function loadForm() {
  if (selectedDomain.value === NEW_DOMAIN) {
    form.value = { domain: '', emojiApiToken: '', driveApiToken: '' };
  } else {
    const tokens = settings.domains[selectedDomain.value] || {};
    form.value = {
      domain: selectedDomain.value,
      emojiApiToken: tokens.emojiApiToken || '',
      driveApiToken: tokens.driveApiToken || '',
    };
  }
  showWarning.value = false;
}

function onDomainChange() {
  loadForm();
}

// ダイアログを開いたとき、現在の選択状態を反映する
watch(visible, (open) => {
  if (open) {
    selectedDomain.value = settings.lastDomain || NEW_DOMAIN;
    loadForm();
  }
});

function save() {
  const domain = form.value.domain.trim();
  if (!domain || !form.value.emojiApiToken || !form.value.driveApiToken) {
    showWarning.value = true;
    return;
  }
  settings.saveDomain(domain, form.value.emojiApiToken, form.value.driveApiToken);
  notify.success(`「${domain}」の設定を保存しました`);
  visible.value = false;
}

function removeDomain() {
  const domain = selectedDomain.value;
  settings.removeDomain(domain);
  notify.success(`「${domain}」の設定を削除しました`);
  confirmingDelete.value = false;
  selectedDomain.value = settings.lastDomain || NEW_DOMAIN;
  loadForm();
}

function close() {
  visible.value = false;
}
</script>
