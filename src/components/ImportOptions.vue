<template>
  <div class="import-options">
    <div class="mb-3">
      <label for="destination-domain" class="form-label">Destination Domain</label>
      <input id="destination-domain" v-model="localDestinationDomain" class="form-control" placeholder="Enter destination domain" />
    </div>
    <div class="mb-3">
      <label for="api-token" class="form-label">API Token</label>
      <input id="api-token" v-model="localApiToken" type="password" class="form-control" placeholder="Enter API token" />
    </div>
    <div class="text-center">
      <button class="btn btn-success" @click="handleImport">Import Selected Emojis</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImportOptions',
  props: {
    selectedEmojis: Array,
  },
  data() {
    return {
      localDestinationDomain: '',
      localApiToken: '',
    };
  },
  methods: {
    handleImport() {
      this.$emit('importEmojis', {
        destinationDomain: this.localDestinationDomain,
        apiToken: this.localApiToken,
      });
    },
  },
};
</script>

<style scoped>
.import-options {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>
