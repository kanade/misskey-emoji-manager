<template>
    <v-snackbar
      v-model="show"
      :color="color"
      :timeout="timeout"
      :location="location"
      elevation="24"
      rounded="pill"
    >
      <div class="d-flex align-center">
        <v-icon :icon="icon" class="me-3" />
        <span>{{ message }}</span>
      </div>
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="show = false"
        >
          閉じる
        </v-btn>
      </template>
    </v-snackbar>
  </template>
  
  <script>
  import { ref, watch } from 'vue';
  
  export default {
    name: 'StyleNotification',
    props: {
      message: {
        type: String,
        required: true
      },
      color: {
        type: String,
        default: 'success'
      },
      icon: {
        type: String,
        default: 'mdi-check-circle'
      },
      timeout: {
        type: Number,
        default: 5000
      },
      location: {
        type: String,
        default: 'bottom'
      }
    },
    setup(props, { emit }) {
      const show = ref(false);
  
      watch(show, (newValue) => {
        if (!newValue) {
          emit('close');
        }
      });
  
      return {
        show
      };
    }
  };
  </script>