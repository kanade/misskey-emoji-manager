import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import { loadSettings } from '@/lib/storage';

// 初期テーマは保存済み設定から反映する（起動時のちらつき防止）
const { theme } = loadSettings();

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: theme === 'dark' ? 'dark' : 'light',
  },
});
