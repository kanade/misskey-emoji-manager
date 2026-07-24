<template>
  <v-container style="max-width: 800px">
    <h1 class="text-h5 mb-4">支援について</h1>
    <v-card variant="outlined">
      <v-card-text>
        <p class="mb-4">お役に立てましたら、ご支援もお待ちしています。</p>
        <div v-if="qrAvailable" class="text-center">
          <img :src="qrSrc" alt="Kyash QRコード" class="kyash-qr" @error="qrAvailable = false" />
          <p class="text-caption text-medium-emphasis mt-2"> Kyash アプリで QR コードを読み取ってください </p>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';

// QR コード画像は public/kyash-qr.png に配置する（未配置の場合は表示しない）
const qrSrc = `${import.meta.env.BASE_URL}kyash-qr.png`;
const qrAvailable = ref(true);
</script>

<style scoped>
.kyash-qr {
  max-width: 240px;
  width: 100%;
}
</style>
