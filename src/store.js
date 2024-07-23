import { createStore } from 'vuex';
import axios from 'axios';

export default createStore({
  state: {
    sourceDomain: '',
    destinationDomain: '',
    apiToken: '',
    emojis: [],
    selectedEmojis: [],
    searchTerm: '',
    emojiApiToken: '',
    driveApiToken: '',
  },
  mutations: {
    setSourceDomain(state, domain) {
      state.sourceDomain = domain;
    },
    setDestinationDomain(state, domain) {
      state.destinationDomain = domain;
    },
    setApiToken(state, token) {
      state.apiToken = token;
    },
    setEmojis(state, emojis) {
      state.emojis = emojis;
    },
    setSelectedEmojis(state, selectedEmojis) {
      state.selectedEmojis = selectedEmojis;
    },
    setSearchTerm(state, searchTerm) {
      state.searchTerm = searchTerm;
    },
    setEmojiApiToken(state, token) {
      state.emojiApiToken = token;
    },
    setDriveApiToken(state, token) {
      state.driveApiToken = token;
    },
  },
  actions: {
    async fetchEmojis({ state, commit }) {
      try {
        let sourceDomain = state.sourceDomain;
        if (!sourceDomain.startsWith('http://') && !sourceDomain.startsWith('https://')) {
          sourceDomain = `https://${sourceDomain}`;
        }
        const url = `${sourceDomain}/api/emojis`;
        console.log(`Fetching emojis from ${url}`);
        const response = await axios.get(url);
        const emojis = response.data.emojis;
        const uniqueEmojis = Array.from(new Set(emojis.map(emoji => JSON.stringify(emoji)))).map(e => JSON.parse(e));
        commit('setEmojis', uniqueEmojis);
        console.log('Emojis fetched successfully:', uniqueEmojis);
      } catch (error) {
        console.error('Error fetching emojis:', error);
      }
    },
    async importAllEmojis({ state }) {
      try {
        for (const emoji of state.selectedEmojis) {
          await axios.post(`${state.destinationDomain}/api/admin/emoji/add`, {
            i: state.apiToken,
            name: emoji.name,
            url: emoji.url,
            category: emoji.category,
            aliases: emoji.aliases,
          });
        }
        alert('All emojis imported successfully!');
      } catch (error) {
        console.error('Error importing all emojis:', error);
        alert('Failed to import some or all emojis.');
      }
    },
    async importSelectedEmoji({ state }) {
      try {
        const emoji = state.selectedEmojis[0]; // 例として最初の選択された絵文字をインポート
        await axios.post(`${state.destinationDomain}/api/admin/emoji/add`, {
          i: state.apiToken,
          name: emoji.name,
          url: emoji.url,
          category: emoji.category,
          aliases: emoji.aliases,
        });
        alert(`Emoji "${emoji.name}" imported successfully!`);
      } catch (error) {
        console.error('Error importing selected emoji:', error);
        alert('Failed to import the selected emoji.');
      }
    },
  },
});
