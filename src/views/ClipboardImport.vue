<template>
  <div class="container mt-5">
    <h1 class="text-center mb-4">Clipboard Import</h1>
    <div class="mb-3">
      <label for="source-domain" class="form-label">Source Domain</label>
      <v-text-field
        id="source-domain"
        v-model="sourceDomain"
        placeholder="Enter source domain"
        outlined
        dense
      ></v-text-field>
    </div>
    <div class="mb-3">
      <label for="emoji-input" class="form-label">Emoji Input</label>
      <v-textarea
        id="emoji-input"
        v-model="emojiInput"
        placeholder="Paste your emoji text here"
        rows="3"
        outlined
      ></v-textarea>
      <v-btn
        color="primary"
        block
        @click="extractEmojis"
        :loading="loading"
        :disabled="!sourceDomain || !emojiInput"
      >
        Extract Emojis
      </v-btn>
    </div>
    <div class="table-container">
      <EmojiList 
        :emojis="emojis" 
        :searchTerm="searchTerm" 
        :selectedEmojis="selectedEmojis" 
        @update:selectedEmojis="updateSelectedEmojis" 
      />
    </div>
    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-title>Folder Options</v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-switch v-model="createFolder" label="Create folder for upload"></v-switch>
          <v-switch 
            v-if="createFolder" 
            v-model="useCategoryAsFolder" 
            label="Use emoji category as folder name"
          ></v-switch>
          <v-text-field
            v-if="createFolder && !useCategoryAsFolder"
            v-model="folderName"
            label="Folder Name"
            placeholder="Enter folder name"
          ></v-text-field>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <div class="text-center my-3">
      <v-btn 
        color="success" 
        block 
        @click="importEmojis" 
        :loading="loading" 
        :disabled="selectedEmojis.length === 0"
      >
        {{ loading ? 'Importing...' : `Import ${selectedEmojis.length} Selected Emojis` }}
      </v-btn>
    </div>
    <div class="request-log mt-4" ref="logContainer">
      <h5>Request Logs</h5>
      <v-list dense>
        <v-list-item v-for="log in requestLogs" :key="log.url + log.method + log.timestamp">
          <v-list-item-title>
            <strong>{{ log.method }}</strong> {{ log.url }} - 
            <span :class="getStatusClass(log.status)">{{ log.status }}</span>
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </div>
    <StyleNotification
      :message="notificationMessage"
      :color="notificationColor"
      :icon="notificationIcon"
      @close="resetNotification"
    />
  </div>
</template>

<script>
import EmojiList from '../components/EmojiList.vue';
import StyleNotification from '../components/StyleNotification.vue';
import axios from 'axios';
import * as utils from '../utils';
import { mapState } from 'vuex';
import { ref, watch } from 'vue';
import { useStore } from 'vuex';

const axiosInstance = axios.create({
  headers: {
    'X-Custom-User-Agent': 'Emoji-Manager/1.0',
  }
});

let app;

axiosInstance.interceptors.request.use(request => {
  if (app) {
    app.$data.requestLogs.push({
      method: request.method.toUpperCase(),
      url: request.url,
      status: 'Pending',
      timestamp: new Date().toISOString(),
    });
    utils.scrollToBottom(app);
  }
  return request;
});

axiosInstance.interceptors.response.use(
  response => {
    if (app) {
      const log = app.$data.requestLogs.find(log => log.url === response.config.url && log.method === response.config.method.toUpperCase() && log.status === 'Pending');
      if (log) {
        log.status = response.status;
      }
      utils.scrollToBottom(app);
    }
    return response;
  },
  error => {
    if (app) {
      const log = app.$data.requestLogs.find(log => log.url === error.config.url && log.method === error.config.method.toUpperCase() && log.status === 'Pending');
      if (log) {
        log.status = error.response ? error.response.status : 'Error';
      }
      utils.scrollToBottom(app);
    }
    return Promise.reject(error);
  }
);

export default {
  name: 'ClipboardImport',
  components: {
    EmojiList,
    StyleNotification,
  },
  setup() {
    const store = useStore();
    const selectedDomain = ref('');
    const emojiApiToken = ref('');
    const driveApiToken = ref('');

    const loadSelectedDomain = () => {
      const lastSelectedDomain = localStorage.getItem('lastSelectedDomain');
      if (lastSelectedDomain) {
        selectedDomain.value = lastSelectedDomain;
        const savedSettings = localStorage.getItem(`settings_${lastSelectedDomain}`);
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          emojiApiToken.value = settings.emojiApiToken;
          driveApiToken.value = settings.driveApiToken;
        }
      }
    };

    watch(() => store.state.destinationDomain, (newDomain) => {
      if (newDomain) {
        selectedDomain.value = newDomain;
        const savedSettings = localStorage.getItem(`settings_${newDomain}`);
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          emojiApiToken.value = settings.emojiApiToken;
          driveApiToken.value = settings.driveApiToken;
        }
      }
    });

    const notificationMessage = ref('');
    const notificationColor = ref('success');
    const notificationIcon = ref('mdi-check-circle');

    const showNotification = (message, color = 'success', icon = 'mdi-check-circle') => {
      notificationMessage.value = message;
      notificationColor.value = color;
      notificationIcon.value = icon;
    };

    const resetNotification = () => {
      notificationMessage.value = '';
    };

    loadSelectedDomain();

    return {
      selectedDomain,
      emojiApiToken,
      driveApiToken,
      notificationMessage,
      notificationColor,
      notificationIcon,
      showNotification,
      resetNotification,
    };
  },
  data() {
    return {
      sourceDomain: '',
      emojiInput: '',
      emojis: [],
      selectedEmojis: [],
      searchTerm: '',
      loading: false,
      requestLogs: [],
      instanceType: 'Unknown',
      createFolder: false,
      useCategoryAsFolder: false,
      folderName: '',
      folderIds: {},
    };
  },
  computed: {
    ...mapState(['destinationDomain']),
    currentDestinationDomain() {
      return this.selectedDomain || this.destinationDomain;
    },
  },
  created() {
    app = this;
    this.loadLocalStorage();
  },
  methods: {
    loadLocalStorage() {
      this.sourceDomain = localStorage.getItem('sourceDomain') || '';
    },
    getStatusClass(status) {
      return utils.getStatusClass(status);
    },
    async extractEmojis() {
      this.loading = true;
      try {
        const regex = /:(\w+):/g;
        const matches = [...this.emojiInput.matchAll(regex)];
        const emojiNames = [...new Set(matches.map(match => match[1]))];
        this.emojis = await this.fetchEmojisDetails(emojiNames);
        this.showNotification(`${this.emojis.length}個の絵文字を抽出しました`, 'success', 'mdi-emoticon');
      } catch (error) {
        console.error('Error extracting emojis:', error);
        this.showNotification('絵文字の抽出中にエラーが発生しました', 'error', 'mdi-alert-circle');
      } finally {
        this.loading = false;
      }
    },
    async fetchEmojisDetails(emojiNames) {
      const detailedEmojis = [];
      for (const name of emojiNames) {
        const emojiDetails = await this.fetchEmojiDetails(name);
        detailedEmojis.push(emojiDetails);
      }
      return detailedEmojis.sort((a, b) => a.name.localeCompare(b.name));
    },
    async fetchEmojiDetails(name) {
      try {
        let sourceDomain = this.sourceDomain;
        if (!sourceDomain.startsWith('http://') && !sourceDomain.startsWith('https://')) {
          sourceDomain = `https://${sourceDomain}`;
        }
        this.instanceType = await this.detectInstanceType(sourceDomain);
        let response;
        const url = `${sourceDomain}/api/emoji?name=${name}`;
        if (this.instanceType === 'Firefish') {
          response = await axiosInstance.post(url, { name });
        } else {
          response = await axiosInstance.get(url);
        }
        return {
          name,
          url: response.data.url,
          category: response.data.category || 'N/A',
          aliases: response.data.aliases || [],
          license: response.data.license || 'N/A',
          localOnly: response.data.localOnly || false,
        };
      } catch (error) {
        console.error(`Error fetching details for emoji ${name}:`, error);
        return {
          name,
          url: '',
          category: 'N/A',
          aliases: [],
          license: 'N/A',
          localOnly: false,
        };
      }
    },
    async detectInstanceType(domain) {
      try {
        const metaUrl = `${domain}/api/meta`;
        const metaResponse = await axiosInstance.post(metaUrl, { detail: false });
        const repositoryUrl = metaResponse.data.repositoryUrl || '';
        if (repositoryUrl.includes('misskey')) {
          return 'Misskey';
        }
        if (repositoryUrl.includes('firefish')) {
          return 'Firefish';
        }
      } catch (error) {
        console.warn('Error fetching meta info:', error);
      }

      try {
        const nodeInfoUrl = `${domain}/.well-known/nodeinfo`;
        const nodeInfoResponse = await axiosInstance.get(nodeInfoUrl);
        if (nodeInfoResponse.data && nodeInfoResponse.data.links) {
          const nodeInfo = nodeInfoResponse.data.links.find(link => link.rel.includes('nodeinfo'));
          if (nodeInfo) {
            const nodeInfoDetails = await axiosInstance.get(nodeInfo.href);
            if (nodeInfoDetails.data && nodeInfoDetails.data.software) {
              return nodeInfoDetails.data.software.name;
            }
          }
        }
      } catch (error) {
        console.warn('Error fetching nodeinfo:', error);
      }

      return 'Unknown';
    },
    updateSelectedEmojis(newSelectedEmojis) {
      this.selectedEmojis = newSelectedEmojis;
    },
    async importEmojis() {
      this.loading = true;
      try {
        if (!this.currentDestinationDomain) {
          throw new Error('宛先ドメインが設定されていません');
        }
        if (!this.emojiApiToken || !this.driveApiToken) {
          throw new Error('APIトークンが設定されていません');
        }

        let destinationDomain = this.currentDestinationDomain;
        if (!destinationDomain.startsWith('http://') && !destinationDomain.startsWith('https://')) {
          destinationDomain = `https://${destinationDomain}`;
        }

        let importedCount = 0;
        let errorCount = 0;

        for (const emoji of this.selectedEmojis) {
          try {
            const exists = await this.checkEmojiExists(emoji.name, destinationDomain);
            if (exists) {
              const errorMessage = `Error: :${emoji.name}: already exists.`;
              console.error(errorMessage);
              this.requestLogs.push({
                method: 'POST',
                url: `${destinationDomain}/api/emoji?name=${emoji.name}`,
                status: errorMessage,
                timestamp: new Date().toISOString(),
              });
              utils.scrollToBottom(app);
              errorCount++;
              continue;
            }

            let folderId = null;
            if (this.createFolder) {
              if (this.useCategoryAsFolder) {
                const category = emoji.category || 'Uncategorized';
                folderId = await this.ensureFolder(destinationDomain, category);
              } else {
                folderId = await this.ensureFolder(destinationDomain, this.folderName);
              }
            }

            const fileId = await this.uploadEmojiFile(emoji.url, destinationDomain, this.driveApiToken, folderId);
            if (!fileId) {
              throw new Error(`Failed to upload file for emoji ${emoji.name}`);
            }
            const response = await axiosInstance.post(`${destinationDomain}/api/admin/emoji/add`, {
              i: this.emojiApiToken,
              name: emoji.name,
              category: emoji.category,
              aliases: emoji.aliases,
              license: emoji.license,
              isSensitive: false,
              localOnly: emoji.localOnly,
              roleIdsThatCanBeUsedThisEmojiAsReaction: [],
              fileId: fileId,
            });
            console.log(`Emoji ${emoji.name} imported successfully:`, response.data);
            importedCount++;
          } catch (error) {
            console.error(`Error importing emoji ${emoji.name}:`, error.response ? error.response.data : error.message);
            errorCount++;
          }
        }

        if (errorCount === 0) {
          this.showNotification(`${importedCount}個の絵文字をインポートしました`, 'success', 'mdi-emoticon');
        } else {
          this.showNotification(`${importedCount}個の絵文字をインポートしました（${errorCount}個のエラー）`, 'warning', 'mdi-alert-circle');
        }
      } catch (error) {
        console.error('Error during the import process:', error);
        this.showNotification(`インポート中にエラーが発生しました: ${error.message}`, 'error', 'mdi-alert-circle');
      } finally {
        this.loading = false;
        this.folderIds = {};
      }
    },
    async checkEmojiExists(name, domain) {
      try {
        const url = `${domain}/api/emoji?name=${name}`;
        const response = await axiosInstance.get(url);
        return response.data && response.data.url;
      } catch (error) {
        console.error(`Error checking if emoji ${name} exists on ${domain}:`, error);
        return false;
      }
    },
    async ensureFolder(destinationDomain, folderName) {
      if (this.folderIds[folderName]) {
        return this.folderIds[folderName];
      }
      
      try {
        const findResponse = await axiosInstance.post(`${destinationDomain}/api/drive/folders/find`, {
          i: this.driveApiToken,
          name: folderName
        });
        
        if (findResponse.data && findResponse.data.length > 0) {
          this.folderIds[folderName] = findResponse.data[0].id;
          console.log(`Existing folder found for ${folderName} with id: ${this.folderIds[folderName]}`);
        } else {
          const createResponse = await axiosInstance.post(`${destinationDomain}/api/drive/folders/create`, {
            i: this.driveApiToken,
            name: folderName
          });
          this.folderIds[folderName] = createResponse.data.id;
          console.log(`New folder created for ${folderName} with id: ${this.folderIds[folderName]}`);
        }
        return this.folderIds[folderName];
      } catch (error) {
        console.error(`Error ensuring folder for ${folderName}:`, error);
        return null;
      }
    },
    async uploadEmojiFile(emojiUrl, destinationDomain, apiToken, folderId) {
      try {
        const uploadParams = {
          i: apiToken,
          url: emojiUrl,
        };
        if (folderId) {
          uploadParams.folderId = folderId;
        }
        await axiosInstance.post(
          `${destinationDomain}/api/drive/files/upload-from-url`,
          uploadParams
        );
        console.log(`File uploaded successfully for ${emojiUrl}`);

        await new Promise(resolve => setTimeout(resolve, 2000));

        const filesResponse = await axiosInstance.post(
          `${destinationDomain}/api/drive/files`,
          {
            i: apiToken,
            limit: 1,
            ...(folderId && { folderId: folderId }),
          }
        );
        if (filesResponse.data.length > 0) {
          return filesResponse.data[0].id;
        } else {
          throw new Error(`Failed to retrieve uploaded file ID for ${emojiUrl}`);
        }
      } catch (error) {
        console.error('Error uploading emoji file:', error.response ? error.response.data : error.message);
        return null;
      }
    },
  },
};
</script>

<style scoped>
.container {
  /* max-width: 960px; */
  margin: 0 auto;
}

.table-container {
  max-height: 60vh;
  overflow-y: auto;
  margin-bottom: 20px;
}

.request-log {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px;
  background-color: #f5f5f5;
}

.request-log h5 {
  margin-top: 0;
  margin-bottom: 10px;
}

.request-log ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.request-log li {
  margin-bottom: 5px;
  font-size: 0.9em;
}

.text-success {
  color: #4caf50;
}

.text-warning {
  color: #ff9800;
}

.text-danger {
  color: #f44336;
}

.v-btn {
  text-transform: none;
}

.v-expansion-panel {
  margin-bottom: 20px;
}

.v-expansion-panel-title {
  font-weight: bold;
}

.v-switch {
  margin-bottom: 10px;
}

.v-text-field {
  margin-top: 10px;
}

.emoji-input {
  min-height: 100px;
  resize: vertical;
}
</style>
