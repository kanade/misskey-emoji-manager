<template>
  <div id="app">
    <v-app>
      <v-app-bar app>
        <v-toolbar-title @click="goHome" style="cursor: pointer;">Emoji Manager</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn text @click="showSettingsDialog = true">設定</v-btn>
        <v-btn to="/bulk-import" text>Bulk Import</v-btn>
        <v-btn to="/clipboard-import" text>Clipboard Import</v-btn>
      </v-app-bar>
      <v-main>
        <router-view></router-view>
      </v-main>
    </v-app>
    <SettingsModal v-model:dialogVisible="showSettingsDialog" />
  </div>
</template>

<script>
import SettingsModal from './components/SettingsModal.vue';
import { mapState, mapMutations } from 'vuex';

export default {
  name: 'App',
  components: {
    SettingsModal,
  },
  data() {
    return {
      showSettingsDialog: false,
    };
  },
  computed: {
    ...mapState(['destinationDomain', 'emojiApiToken', 'driveApiToken']),
  },
  methods: {
    ...mapMutations(['setDestinationDomain', 'setEmojiApiToken', 'setDriveApiToken']),
    goHome() {
      this.$router.push('/');
    },
    loadTokens() {
      const tokens = JSON.parse(localStorage.getItem('tokens'));
      if (tokens) {
        this.setDestinationDomain(tokens.destinationDomain);
        this.setEmojiApiToken(tokens.emojiApiToken);
        this.setDriveApiToken(tokens.driveApiToken);
      }
    },
  },
  mounted() {
    this.loadTokens();
  },
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.v-toolbar-title {
  cursor: pointer;
}
</style>