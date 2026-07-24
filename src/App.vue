<template>
  <v-app>
    <v-app-bar density="comfortable">
      <v-app-bar-nav-icon class="d-md-none" @click="drawer = !drawer" />
      <v-app-bar-title style="cursor: pointer" @click="$router.push('/')"> <v-icon icon="mdi-emoticon-outline" class="me-2" />Emoji Manager </v-app-bar-title>
      <!-- md 以上はボタンを並べ、それ未満はドロワーに集約する -->
      <template v-if="mdAndUp">
        <v-spacer />
        <v-btn to="/bulk-import" variant="text" prepend-icon="mdi-cloud-download"> 一括インポート </v-btn>
        <v-btn to="/clipboard-import" variant="text" prepend-icon="mdi-clipboard-text"> クリップボード </v-btn>
        <v-btn variant="text" prepend-icon="mdi-cog" @click="settingsOpen = true">設定</v-btn>
        <v-btn to="/support" icon="mdi-heart-outline" variant="text" title="支援について" />
        <v-btn :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'" variant="text" :title="isDark ? 'ライトモードに切替' : 'ダークモードに切替'" @click="toggleTheme" />
      </template>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary>
      <v-list nav>
        <v-list-item to="/" prepend-icon="mdi-home-outline" title="ホーム" />
        <v-list-item to="/bulk-import" prepend-icon="mdi-cloud-download" title="一括インポート" />
        <v-list-item to="/clipboard-import" prepend-icon="mdi-clipboard-text" title="クリップボードインポート" />
        <v-list-item prepend-icon="mdi-cog" title="設定" @click="openSettings" />
        <v-list-item to="/support" prepend-icon="mdi-heart-outline" title="支援について" />
        <v-divider class="my-2" />
        <v-list-item :prepend-icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'" :title="isDark ? 'ライトモードに切替' : 'ダークモードに切替'" @click="toggleTheme" />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>

    <SettingsDialog v-model="settingsOpen" />
    <AppSnackbar />
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTheme, useDisplay } from 'vuetify';
import SettingsDialog from '@/components/SettingsDialog.vue';
import AppSnackbar from '@/components/AppSnackbar.vue';
import { useSettingsStore } from '@/stores/settings';

const settings = useSettingsStore();
const theme = useTheme();
const { mdAndUp } = useDisplay();
const settingsOpen = ref(false);
const drawer = ref(false);

const isDark = computed(() => settings.theme === 'dark');

function toggleTheme() {
  const next = isDark.value ? 'light' : 'dark';
  settings.setTheme(next);
  theme.global.name.value = next;
}

function openSettings() {
  drawer.value = false;
  settingsOpen.value = true;
}
</script>
