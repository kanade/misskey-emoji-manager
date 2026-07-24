<template>
  <v-snackbar v-model="notify.visible" :color="notify.color" :timeout="notify.timeout" location="bottom">
    {{ notify.message }}
    <template #actions>
      <v-btn variant="text" @click="notify.visible = false">閉じる</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { useNotifyStore } from '@/stores/notify';

const notify = useNotifyStore();
</script>
