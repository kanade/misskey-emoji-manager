import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import { migrateLegacyEmojiCaches } from './lib/emojiCache';
import '@mdi/font/css/materialdesignicons.css';

// 旧バージョンの localStorage 絵文字キャッシュを IndexedDB へ移行（バックグラウンドで実行）
migrateLegacyEmojiCaches().catch((error) => {
  console.error('絵文字キャッシュの移行処理でエラーが発生しました:', error);
});

createApp(App).use(createPinia()).use(router).use(vuetify).mount('#app');
