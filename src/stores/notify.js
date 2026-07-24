import { defineStore } from 'pinia';

// アプリ全体で使うスナックバー通知
export const useNotifyStore = defineStore('notify', {
  state: () => ({
    visible: false,
    message: '',
    color: 'info',
    timeout: 3000,
  }),
  actions: {
    show(message, color = 'info', timeout = 3000) {
      this.message = message;
      this.color = color;
      this.timeout = timeout;
      this.visible = true;
    },
    success(message) {
      this.show(message, 'success');
    },
    error(message) {
      this.show(message, 'error', 5000);
    },
    warning(message) {
      this.show(message, 'warning', 5000);
    },
  },
});
