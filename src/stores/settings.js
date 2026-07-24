import { defineStore } from 'pinia';
import { loadSettings, saveSettings } from '@/lib/storage';

// 宛先ドメイン・APIトークン・テーマなどの設定
export const useSettingsStore = defineStore('settings', {
  state: () => loadSettings(),
  getters: {
    // 保存済みドメインの一覧
    savedDomains: (state) => Object.keys(state.domains),
    // 現在選択中ドメインのトークン
    currentTokens: (state) => state.domains[state.lastDomain] || { emojiApiToken: '', driveApiToken: '' },
    // インポートに必要な設定が揃っているか
    isConfigured() {
      return Boolean(this.lastDomain && this.currentTokens.emojiApiToken && this.currentTokens.driveApiToken);
    },
  },
  actions: {
    persist() {
      saveSettings(this.$state);
    },
    // ドメインとトークンを保存して選択状態にする
    saveDomain(domain, emojiApiToken, driveApiToken) {
      this.domains[domain] = { emojiApiToken, driveApiToken };
      this.lastDomain = domain;
      this.persist();
    },
    selectDomain(domain) {
      if (this.domains[domain]) {
        this.lastDomain = domain;
        this.persist();
      }
    },
    removeDomain(domain) {
      delete this.domains[domain];
      if (this.lastDomain === domain) {
        this.lastDomain = Object.keys(this.domains)[0] || '';
      }
      this.persist();
    },
    setSourceDomain(domain) {
      this.sourceDomain = domain;
      this.persist();
    },
    setTheme(theme) {
      this.theme = theme;
      this.persist();
    },
  },
});
