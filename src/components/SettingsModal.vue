<template>
  <v-dialog v-model="internalDialogVisible" max-width="500px">
    <v-card>
      <v-card-title class="headline">設定</v-card-title>
      <v-card-text>
        <div class="mb-3">
          <label for="destination-domain" class="form-label">インポート先のドメイン</label>
          <input id="destination-domain" v-model="localDestinationDomain" class="form-control" placeholder="" />
        </div>
        <div class="mb-3">
          <label for="emoji-token" class="form-label">絵文字の操作と閲覧権限のあるAPIトークン</label>
          <input id="emoji-token" v-model="localEmojiApiToken" class="form-control" placeholder="" />
        </div>
        <div class="mb-3">
          <label for="drive-token" class="form-label">ドライブの操作と閲覧権限のあるAPIトークン</label>
          <input id="drive-token" v-model="localDriveApiToken" class="form-control" placeholder="" />
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
import { mapState, mapMutations } from 'vuex';

export default {
  name: 'SettingsModal',
  props: {
    dialogVisible: Boolean,
  },
  data() {
    return {
      internalDialogVisible: this.dialogVisible,
      localDestinationDomain: '',
      localEmojiApiToken: '',
      localDriveApiToken: '',
    };
  },
  computed: {
    ...mapState(['destinationDomain', 'emojiApiToken', 'driveApiToken']),
  },
  watch: {
    dialogVisible(newValue) {
      this.internalDialogVisible = newValue;
      if (newValue) {
        this.loadLocalData();
      }
    },
    internalDialogVisible(newValue) {
      this.$emit('update:dialogVisible', newValue);
    },
    destinationDomain(newValue) {
      this.localDestinationDomain = newValue;
    },
    emojiApiToken(newValue) {
      this.localEmojiApiToken = newValue;
    },
    driveApiToken(newValue) {
      this.localDriveApiToken = newValue;
    },
  },
  methods: {
    ...mapMutations(['setDestinationDomain', 'setEmojiApiToken', 'setDriveApiToken']),
    saveSettings() {
      this.setDestinationDomain(this.localDestinationDomain);
      this.setEmojiApiToken(this.localEmojiApiToken);
      this.setDriveApiToken(this.localDriveApiToken);
      const tokens = {
        destinationDomain: this.localDestinationDomain,
        emojiApiToken: this.localEmojiApiToken,
        driveApiToken: this.localDriveApiToken,
      };
      localStorage.setItem('tokens', JSON.stringify(tokens));
      console.log("Saved tokens to localStorage: ", tokens);
      this.closeDialog();
    },
    closeDialog() {
      this.internalDialogVisible = false;
    },
    loadLocalData() {
      const tokens = JSON.parse(localStorage.getItem('tokens'));
      if (tokens) {
        this.localDestinationDomain = tokens.destinationDomain;
        this.localEmojiApiToken = tokens.emojiApiToken;
        this.localDriveApiToken = tokens.driveApiToken;
      }
    },
  },
  mounted() {
    this.loadLocalData();
  },
};
</script>

<style scoped>
.form-label {
  font-weight: bold;
}
</style>