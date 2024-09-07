<template>
  <div>
    <h2 class="mb-3">絵文字リスト</h2>
    <input
      type="text"
      class="form-control mb-3"
      placeholder="絵文字を検索..."
      v-model="localSearchTerm"
      @input="updateSearchTerm"
    />
    <div class="table-container">
      <table class="table table-bordered">
        <thead class="table-light">
          <tr>
            <th class="select-column">選択</th>
            <th class="image-column">画像</th>
            <th @click="sortBy('name')">
              名前
              <span v-if="sortKey === 'name'">{{
                sortOrders.name > 0 ? "▲" : "▼"
              }}</span>
            </th>
            <th @click="sortBy('category')">
              カテゴリ
              <span v-if="sortKey === 'category'">{{
                sortOrders.category > 0 ? "▲" : "▼"
              }}</span>
            </th>
            <th class="local-only-column" @click="sortBy('localOnly')">
              Local
              <span v-if="sortKey === 'localOnly'">{{
                sortOrders.localOnly > 0 ? "▲" : "▼"
              }}</span>
            </th>
            <th @click="sortBy('aliases')">
              エイリアス
              <span v-if="sortKey === 'aliases'">{{
                sortOrders.aliases > 0 ? "▲" : "▼"
              }}</span>
            </th>
            <th @click="sortBy('license')">
              ライセンス
              <span v-if="sortKey === 'license'">{{
                sortOrders.license > 0 ? "▲" : "▼"
              }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="emoji in filteredEmojis"
            :key="`${emoji.name}-${emoji.url}`"
          >
            <td
              class="select-column"
              @click="toggleSelection(emoji)"
              :class="{ disabled: emoji.localOnly }"
            >
              <input
                type="checkbox"
                :value="emoji"
                v-model="localSelectedEmojis"
                @change="updateSelectedEmojis"
                :disabled="emoji.localOnly"
              />
            </td>
            <td class="image-column">
              <img
                :src="emoji.url"
                alt="emoji"
                class="emoji-image"
                @click="$emit('showLightbox', emoji.url)"
              />
            </td>
            <td>{{ emoji.name }}</td>
            <td>{{ emoji.category }}</td>
            <td class="local-only-column">{{ emoji.localOnly ? "✔" : "" }}</td>
            <td>{{ emoji.aliases.join(", ") }}</td>
            <td>{{ emoji.license }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "EmojiList",
  props: {
    emojis: Array,
    searchTerm: String,
    selectedEmojis: Array,
  },
  data() {
    return {
      localSearchTerm: this.searchTerm,
      localSelectedEmojis: this.selectedEmojis,
      sortKey: "name",
      sortOrders: {
        name: 1,
        category: 1,
        localOnly: 1,
        aliases: 1,
        license: 1,
      },
    };
  },
  emits: ["update:selectedEmojis", "showLightbox"],
  computed: {
    filteredEmojis() {
      const filtered = this.emojis.filter(
        (emoji) =>
          emoji.name.includes(this.localSearchTerm) ||
          (emoji.aliases &&
            emoji.aliases.some((alias) =>
              alias.includes(this.localSearchTerm)
            )) ||
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
      this.$emit("update:searchTerm", this.localSearchTerm);
    },
    updateSelectedEmojis() {
      this.$emit("update:selectedEmojis", this.localSelectedEmojis);
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrders[key] = this.sortOrders[key] * -1;
      } else {
        this.sortKey = key;
      }
    },
    showLightbox(url) {
      this.$emit("showLightbox", url);
    },
    toggleSelection(emoji) {
      if (!emoji.localOnly) {
        const index = this.localSelectedEmojis.findIndex(
          (e) => e.name === emoji.name
        );
        if (index > -1) {
          this.localSelectedEmojis.splice(index, 1);
        } else {
          this.localSelectedEmojis.push(emoji);
        }
        this.updateSelectedEmojis();
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

table {
  table-layout: fixed;
  width: 100%;
}

th {
  cursor: pointer;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

td {
  vertical-align: middle;
  word-break: break-word;
}

.select-column {
  width: 50px;
  text-align: center;
  cursor: pointer;
}

.select-column.disabled {
  cursor: not-allowed;
}

.image-column {
  width: 70px;
  text-align: center;
}

.local-only-column {
  width: 80px;
  text-align: center;
}

.emoji-image {
  width: 60px;
  height: 60px;
  object-fit: contain;
  cursor: pointer;
}
</style>
