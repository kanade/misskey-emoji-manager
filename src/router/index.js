import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import BulkImportView from '@/views/BulkImportView.vue';
import ClipboardImportView from '@/views/ClipboardImportView.vue';
import SupportView from '@/views/SupportView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/bulk-import',
    name: 'bulk-import',
    component: BulkImportView,
  },
  {
    path: '/clipboard-import',
    name: 'clipboard-import',
    component: ClipboardImportView,
  },
  {
    path: '/support',
    name: 'support',
    component: SupportView,
  },
];

// 静的ホスティングでもリロード・直リンクが 404 にならないようハッシュモードを使う
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
