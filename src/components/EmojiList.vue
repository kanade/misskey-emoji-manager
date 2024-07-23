<template>
  <div>
    <h2 class="mb-3">絵文字リスト</h2>
    <input type="text" class="form-control mb-3" placeholder="絵文字を検索..." v-model="localSearchTerm" @input="updateSearchTerm" />
    <div class="table-container">
      <table class="table table-bordered">
        <thead class="table-light">
          <tr>
            <th>選択</th>
            <th>画像</th>
            <th @click="sortBy('name')">名前 <span v-if="sortKey === 'name'">{{ sortOrders.name > 0 ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('category')">カテゴリ <span v-if="sortKey === 'category'">{{ sortOrders.category > 0 ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('localOnly')">LocalOnly <span v-if="sortKey === 'localOnly'">{{ sortOrders.localOnly > 0 ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('aliases')">エイリアス <span v-if="sortKey === 'aliases'">{{ sortOrders.aliases > 0 ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('license')">ライセンス <span v-if="sortKey === 'license'">{{ sortOrders.license > 0 ? '▲' : '▼' }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="emoji in filteredEmojis" :key="`${emoji.name}-${emoji.url}`">
            <td>
              <input type="checkbox" :value="emoji" v-model="localSelectedEmojis" @change="updateSelectedEmojis" :disabled="emoji.localOnly" />
            </td>
            <td>
              <img :src="emoji.url" alt="emoji" class="emoji-image" />
            </td>
            <td>{{ emoji.name }}</td>
            <td>{{ emoji.category }}</td>
            <td>{{ emoji.localOnly ? '✔' : '' }}</td>
            <td>{{ emoji.aliases.join(', ') }}</td>
            <td>{{ emoji.license }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmojiList',
  props: {
    emojis: Array,
    searchTerm: String,
    selectedEmojis: Array,
  },
  data() {
    return {
      localSearchTerm: this.searchTerm,
      localSelectedEmojis: this.selectedEmojis,
      sortKey: 'name',
      sortOrders: {
        name: 1,
        category: 1,
        localOnly: 1,
        aliases: 1,
        license: 1,
      },
    };
  },
  computed: {
    filteredEmojis() {
      const filtered = this.emojis.filter(emoji => 
        emoji.name.includes(this.localSearchTerm) || 
        (emoji.aliases && emoji.aliases.some(alias => alias.includes(this.localSearchTerm))) ||
        (emoji.category && emoji.category.includes(this.localSearchTerm))
      );
      const sortKey = this.sortKey;
      const order = this.sortOrders[sortKey];
      return filtered.sort((a, b) => {
        const result = a[sortKey] > b[sortKey] ? 1 : -1;
        return result * order;
      });
    },
  },
  methods: {
    updateSearchTerm() {
      this.$emit('update:searchTerm', this.localSearchTerm);
    },
    updateSelectedEmojis() {
      this.$emit('update:selectedEmojis', this.localSelectedEmojis);
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrders[key] = this.sortOrders[key] * -1;
      } else {
        this.sortKey = key;
      }
    },
  },
  watch: {
    searchTerm(newSearchTerm) {
      this.localSearchTerm = newSearchTerm;
    },
    selectedEmojis(newSelectedEmojis) {
      this.localSelectedEmojis = newSelectedEmojis;
    },
  },
};
</script>

<style scoped>
.table-container {
  max-height: 48vh;
  overflow-y: auto;
}

th {
  cursor: pointer;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.emoji-image {
  width: 30px;
  height: 30px;
  object-fit: contain;
}
</style>