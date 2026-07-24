<template>
  <v-container style="max-width: 800px">
    <h1 class="text-h5 mb-4">Emoji Manager について</h1>
    <p class="text-body-1 mb-4">
      Misskeyなどのインスタンス間で、カスタム絵文字をタグ・ライセンスを確認しながらインポートするための補助ツールです。<br />
      善意による提供なので苦情などが生じた場合は予告なく取り下げる可能性があります。
    </p>

    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1"> <v-icon icon="mdi-alert-circle-outline" class="me-2" />ご利用上の注意 </v-card-title>
      <v-card-text>
        <ul class="notice-list">
          <li> APIトークンはこのブラウザ内（localStorage）にのみ保存されます。サーバーには保存されません。 </li>
          <li>絵文字一覧のデータはブラウザ内（IndexedDB）に保存されます。</li>
          <li> 一覧取得は相手サーバーへの通信を伴います。「サーバーから取得」を短時間に繰り返すなど、負荷をかける使い方はしないでください。 </li>
          <li> 削除操作は行いませんが事前に絵文字全体のバックアップを取ることをおすすめします。 </li>
          <li> 動作確認はしていますがご利用はすべて自己責任でお願いします。 </li>
          <li>
            詳しい使い方は
            <a href="https://github.com/kanade/misskey-emoji-manager" target="_blank" rel="noopener noreferrer">GitHub</a>
            をご覧ください。
          </li>
        </ul>
      </v-card-text>
    </v-card>

    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1"> <v-icon icon="mdi-cog-outline" class="me-2" />設定 </v-card-title>
      <v-card-text>
        <p class="mb-2">右上の「設定」からインポート先の情報を登録します。</p>
        <ul class="notice-list">
          <li>【インポート先のドメイン】インポート先インスタンスのドメイン</li>
          <li> 【絵文字用APIトークン】管理者権限の「絵文字を操作する」「絵文字を見る」を付与したトークン </li>
          <li> 【ドライブ用APIトークン】「ドライブを見る」「ドライブを操作する」を付与したトークン </li>
        </ul>
        <p class="mt-2 mb-0">
          現在のMisskeyでは絵文字の画像はアップロードしたユーザーのドライブに保存されるため、削除しない絵文字管理専用アカウントの利用をおすすめします。権限が適切に付与されていれば両方に同じトークンを指定することもできます。Sharkeyについては絵文字登録に成功するとシステムアカウントのドライブに移動されます。
        </p>
      </v-card-text>
    </v-card>

    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1"> <v-icon icon="mdi-book-open-variant" class="me-2" />使い方 </v-card-title>
      <v-card-text>
        <p class="mb-2"><strong>一括インポート</strong></p>
        <p class="mb-4">
          指定サーバーの絵文字一覧を取得し「検索」や「絞り込み」をしながら選択してインポートします。取得した一覧はブラウザに保存され、次回からは「保存済みデータを読み込む」で通信せずに表示できます。
        </p>
        <p class="mb-2"><strong>クリップボードインポート</strong></p>
        <p class="mb-0"> 貼り付けたテキストに含まれる絵文字コード（:emoji_name: 形式）を抽出し、指定サーバーから情報を取得して選択的にインポートします。 </p>
      </v-card-text>
    </v-card>

    <v-card variant="outlined">
      <v-card-title class="text-subtitle-1"> <v-icon icon="mdi-check-decagram-outline" class="me-2" />対応状況 </v-card-title>
      <v-card-text>
        <p class="mb-2"> 動作確認環境（2026/07/24 現在の各最新版において確認） </p>
        <ul class="notice-list">
          <li>Misskey / Sharkey / Firefish（開発終了）</li>
        </ul>
        <p class="mb-2 mt-3">要検証</p>
        <ul class="notice-list">
          <li>Iceshrimp（非.NET版）、Iceshrimp（.NET版）</li>
        </ul>
        <p class="mt-3 mb-0"> 非対応サーバーでエラーになる場合は @kanade@mfmf.club までご連絡ください（相手サーバーの管理者への問い合わせはご遠慮ください）。 </p>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup></script>

<style scoped>
.notice-list {
  padding-left: 1.2em;
}

.notice-list li {
  margin-bottom: 4px;
}
</style>
