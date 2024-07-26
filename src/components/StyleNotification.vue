<template>
  <v-snackbar v-model="snackbar" :timeout="timeout" :color="color">
    {{ message }}
  </v-snackbar>
</template>

<script>
export default {
  data() {
    return {
      snackbar: false,
      message: '',
      color: 'info',
      timeout: 3000,
    };
  },
  methods: {
    showMessage(msg, color = 'info', timeout = 3000) {
      this.message = msg;
      this.color = color;
      this.timeout = timeout;
      this.snackbar = true;
    },
  },
};
</script>

<style scoped>
</style>
