import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store'; // Vuexストアをインポート
import 'bootstrap/dist/css/bootstrap.min.css';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
});

createApp(App).use(router).use(store).use(vuetify).mount('#app');
