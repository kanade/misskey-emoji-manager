<template>
  <v-dialog v-model="internalDialogVisible" max-width="500px" @click:outside="resetSettings">
    <v-card>
      <v-card-title class="headline">設定</v-card-title>
      <v-card-text>
        <v-select
          v-if="domainItems.length > 0"
          v-model="selectedDomain"
          :items="domainItems"
          label="ドメインを選択"
          item-title="text"
          item-value="value"
          return-object
          @update:model-value="onDomainChange"
        >
          <template v-slot:item="{ item, props }">
            <v-list-item v-bind="props" :title="item.raw.text">
              <template v-slot:append v-if="item.raw.value === 'new'">
                <v-icon color="primary">mdi-plus</v-icon>
              </template>
            </v-list-item>
          </template>
        </v-select>
        <div class="mb-3">
          <label for="destination-domain" class="form-label">インポート先のドメイン</label>
          <input id="destination-domain" v-model="localDestinationDomain" class="form-control" placeholder="" :disabled="selectedDomain.value !== 'new'" />
          <span v-if="showWarning && !localDestinationDomain" class="text-danger">この項目は必須です</span>
        </div>
        <div class="mb-3">
          <label for="emoji-token" class="form-label">絵文字の操作と閲覧権限のあるAPIトークン</label>
          <input id="emoji-token" v-model="localEmojiApiToken" class="form-control" placeholder="" />
          <span v-if="showWarning && !localEmojiApiToken" class="text-danger">この項目は必須です</span>
        </div>
        <div class="mb-3">
          <label for="drive-token" class="form-label">ドライブの操作と閲覧権限のあるAPIトークン</label>
          <input id="drive-token" v-model="localDriveApiToken" class="form-control" placeholder="" />
          <span v-if="showWarning && !localDriveApiToken" class="text-danger">この項目は必須です</span>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="saveSettings">保存</v-btn>
        <v-btn color="secondary" text @click="closeDialog">キャンセル</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'SettingsModal',
  props: {
    dialogVisible: Boolean,
  },
  emits: ['update:dialogVisible'],
  setup(props, { emit }) {
    const store = useStore();
    const internalDialogVisible = ref(props.dialogVisible);
    const selectedDomain = ref({ text: '新規ドメイン登録', value: 'new' });
    const localDestinationDomain = ref('');
    const localEmojiApiToken = ref('');
    const localDriveApiToken = ref('');
    const savedDomains = ref([]);
    const showWarning = ref(false);
    let initialDomain = ref(null);

    const domainItems = computed(() => {
      const items = savedDomains.value.map(domain => ({
        text: domain,
        value: domain,
      }));
      items.push({ text: '新規ドメイン登録', value: 'new' });
      return items;
    });

    const loadSavedDomains = () => {
      const domains = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('settings_')) {
          domains.push(key.replace('settings_', ''));
        }
      }
      savedDomains.value = domains;

      // 前回選択されたドメインを読み込む
      const lastSelectedDomain = localStorage.getItem('lastSelectedDomain');
      if (lastSelectedDomain && domains.includes(lastSelectedDomain)) {
        selectedDomain.value = { text: lastSelectedDomain, value: lastSelectedDomain };
      } else if (domains.length > 0) {
        selectedDomain.value = { text: domains[0], value: domains[0] };
      } else {
        selectedDomain.value = { text: '新規ドメイン登録', value: 'new' };
      }

      loadLocalData();
      initialDomain.value = selectedDomain.value; // 初期選択状態を保存
    };

    const loadLocalData = () => {
      if (selectedDomain.value && selectedDomain.value.value !== 'new') {
        const savedSettings = localStorage.getItem(`settings_${selectedDomain.value.value}`);
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          localDestinationDomain.value = settings.destinationDomain;
          localEmojiApiToken.value = settings.emojiApiToken;
          localDriveApiToken.value = settings.driveApiToken;
        }
      } else {
        resetForm();
      }
    };

    const resetForm = () => {
      localDestinationDomain.value = '';
      localEmojiApiToken.value = '';
      localDriveApiToken.value = '';
    };

    const onDomainChange = (value) => {
      selectedDomain.value = value;
      if (value.value === 'new') {
        resetForm();
      } else {
        loadLocalData();
      }
    };

    const saveSettings = () => {
      if (!localDestinationDomain.value || !localEmojiApiToken.value || !localDriveApiToken.value) {
        showWarning.value = true;
        return;
      }

      const domainKey = selectedDomain.value.value === 'new' ? localDestinationDomain.value : selectedDomain.value.value;
      const settings = {
        destinationDomain: domainKey,
        emojiApiToken: localEmojiApiToken.value,
        driveApiToken: localDriveApiToken.value,
      };

      localStorage.setItem(`settings_${domainKey}`, JSON.stringify(settings));

      store.commit('setDestinationDomain', settings.destinationDomain);
      store.commit('setEmojiApiToken', settings.emojiApiToken);
      store.commit('setDriveApiToken', settings.driveApiToken);

      // 保存したドメインを現在の選択として保存
      localStorage.setItem('lastSelectedDomain', domainKey);

      console.log("Saved settings for domain:", domainKey);
      loadSavedDomains();
      closeDialog();
    };

    const closeDialog = () => {
      internalDialogVisible.value = false;
      emit('update:dialogVisible', false);
    };

    const resetSettings = () => {
      selectedDomain.value = initialDomain.value; // 初期選択状態にリセット
      loadLocalData(); // 初期選択状態のデータを再読み込み
      showWarning.value = false; // 警告メッセージをリセット
    };

    watch(() => props.dialogVisible, (newValue) => {
      internalDialogVisible.value = newValue;
      if (newValue) {
        loadSavedDomains();
      }
    });

    watch(internalDialogVisible, (newValue) => {
      emit('update:dialogVisible', newValue);
      if (!newValue) {
        resetSettings(); // ダイアログが閉じられた時に設定をリセット
      }
    });

    onMounted(() => {
      loadSavedDomains();
    });

    return {
      internalDialogVisible,
      selectedDomain,
      localDestinationDomain,
      localEmojiApiToken,
      localDriveApiToken,
      domainItems,
      onDomainChange,
      saveSettings,
      closeDialog,
      resetSettings,
      showWarning,
    };
  },
};
</script>

<style scoped>
.text-danger {
  color: red;
}
.mb-3 {
  margin-bottom: 1rem;
}
</style>
