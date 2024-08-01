<!-- src/views/Notice.vue -->
<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">注意書き</h2>
    <div class="text-left">
      <p>このアプリケーションは絵文字をインポートするためのツールです。使用方法については以下の注意事項をご確認ください。</p>
      <ul>
        <li>トークンなどはブラウザのローカルストレージに保存されます。サーバーには保存されません。</li>
        <li>通信量が多いため相手サーバーに負荷をかけるような使い方をしないでください。<br>（Fetch Emojisの繰り返しなど）</li>
        <li>削除動作はしませんが事前に絵文字全体のバックアップをお取りください。</li>
        <li>充分に動作確認はしているつもりですが、すべて自己責任でのご利用をお願いいたします。</li>
        <li>詳しい使い方は<a href="https://github.com/kanade/misskey-emoji-manager" target="_blank">GitHub</a>をご確認ください。</li>
      </ul>
    </div>

    <h2 class="text-center mb-4">設定</h2>
    <div class="text-left">
      <p>インポートに際しての設定です。<br>
        <ul>
          <li>【インポート先のドメイン】<br>インポート先のドメインを指定します</li>
          <li>【絵文字の操作と閲覧権限のあるAPIトークン】<br>管理者権限の「絵文字を操作する」「絵文字を見る」を付与したトークン</li>
          <li>【ドライブの操作と閲覧権限のあるAPIトークン】<br>一般権限の「ドライブを見る」「ドライブを操作する」を付与したトークン</li>
      </ul>
        現在のMisskeyでは絵文字のリソースはユーザーに依存するドライブに保存されるため、絶対に消さない専用アカウントの利用をお勧めします。権限さえ適切に付与されていれば、どちらも同じトークンの指定もできます。
      </p>
    </div>

    <h2 class="text-center mb-4">使い方</h2>
    <div class="text-left">
      <p>右上のメニューより選択してください。</p>
      <p>【BULK IMPORT】<br>指定サーバーの絵文字一覧を取得し、その中から選択的にインポートします。</p>
      <p>【CLIPBOARD IMPORT】<br>貼り付けた文字列に含まれる絵文字コードを指定サーバーから取得し、選択的にインポートします。</p>
    </div>

    <h2 class="text-center mb-4">今後の展望</h2>
    <div class="text-left">
      <p>今後のアップデートでやりたいこと</p>
      <ul>
        <li><s>フォーク（FirefishやIceshrimpなど）への対応</s> → Firefish対応しました</li>
        <li>絵文字取得やインポートの途中停止</li>
        <li><s>インポート完了時の通知</s> → たぶん通知出るはず</li>
      </ul>
    </div>

  </div>


</template>

<script>
export default {
  name: 'NoticePage',
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
}
.text-left {
  text-align: left;
}
</style>
