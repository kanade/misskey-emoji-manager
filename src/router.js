import { createRouter, createWebHistory } from 'vue-router';
import BulkImport from '@/views/BulkImport.vue';
import ClipboardImport from '@/views/ClipboardImport.vue';
import NoticePage from '@/views/NoticePage.vue';

const routes = [
  {
    path: '/',
    name: 'NoticePage',
    component: NoticePage,
  },
  {
    path: '/bulk-import',
    name: 'BulkImport',
    component: BulkImport,
  },
  {
    path: '/clipboard-import',
    name: 'ClipboardImport',
    component: ClipboardImport,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
