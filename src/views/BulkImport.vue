<template>
  <div class="container mt-5">
    <h1 class="text-center mb-4">Bulk Import</h1>
    <div class="mb-3">
      <label for="source-domain" class="form-label">Source Domain</label>
      <input id="source-domain" v-model="sourceDomain" class="form-control w-100" placeholder="Enter source domain" />
    </div>
    <div class="d-flex mb-3">
      <button class="btn btn-primary w-100 me-2" @click="loadFromLocalStorage">
        <v-icon left>mdi-book-open-variant</v-icon> Load from LocalStorage
      </button>
      <button class="btn btn-danger w-100" @click="fetchEmojis">
        <v-icon left>mdi-cloud-download</v-icon> Fetch Emojis
      </button>
    </div>
    <div class="table-container">
      <EmojiList :emojis="emojis" :searchTerm="searchTerm" :selectedEmojis="selectedEmojis" @update:selectedEmojis="updateSelectedEmojis" />
    </div>

    <v-card class="mb-4">
      <v-card-title>フォルダ設定</v-card-title>
      <v-card-text>
        <v-switch
          v-model="createFolder"
          label="フォルダを作成してアップロード"
          color="primary"
        ></v-switch>
        <v-switch
          v-if="createFolder"
          v-model="useCategoryAsFolder"
          label="カテゴリ名をフォルダ名に使用する"
          color="secondary"
        ></v-switch>
        <v-text-field
          v-if="createFolder && !useCategoryAsFolder"
          v-model="folderName"
          label="フォルダ名"
          placeholder="フォルダ名を入力してください"
          :rules="[v => !!v || 'フォルダ名は必須です']"
          required
        ></v-text-field>
      </v-card-text>
    </v-card>

    <div class="text-center mb-3">
      <button class="btn btn-success w-100" @click="importEmojis">Import Selected Emojis</button>
    </div>
    <div class="request-log mt-4" ref="logContainer">
      <h5>Request Logs</h5>
      <ul>
        <li v-for="log in requestLogs" :key="log.url + log.method + log.timestamp">
          <strong>{{ log.method }}</strong> {{ log.url }} - <span :class="getStatusClass(log.status)">{{ log.status }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import EmojiList from '../components/EmojiList.vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import * as utils from '../utils';
import { mapState } from 'vuex';

const axiosInstance = axios.create({
  headers: {
    'X-Custom-User-Agent': 'MyCustomUserAgent/1.0',
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
  name: 'BulkImport',
  components: {
    EmojiList,
  },
  data() {
    return {
      sourceDomain: '',
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
    ...mapState(['destinationDomain', 'emojiApiToken', 'driveApiToken']),
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
    async loadFromLocalStorage() {
      const storedEmojis = localStorage.getItem(`emojis_${this.sourceDomain}`);
      if (storedEmojis) {
        this.emojis = JSON.parse(storedEmojis);
        console.log('Emojis loaded from local storage:', this.emojis);
      } else {
        const result = await Swal.fire({
          title: 'ローカルストレージに絵文字データが見つかりません',
          text: 'リモートから取得しますか？',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'リモートから取得',
          cancelButtonText: 'キャンセル'
        });
        if (result.isConfirmed) {
          this.fetchEmojis();
        }
      }
    },
    async fetchEmojis() {
      this.loading = true;
      try {
        let sourceDomain = this.sourceDomain;
        if (!sourceDomain.startsWith('http://') && !sourceDomain.startsWith('https://')) {
          sourceDomain = `https://${sourceDomain}`;
        }
        const url = `${sourceDomain}/api/emojis`;
        console.log(`Fetching emojis from ${url}`);
        const instanceType = await this.detectInstanceType(sourceDomain);
        const response = await axiosInstance({
          method: instanceType === 'Firefish' ? 'post' : 'get',
          url,
        });
        const emojis = response.data.emojis;
        const detailedEmojis = await this.fetchEmojisInBatches(emojis, sourceDomain);
        this.emojis = detailedEmojis;
        console.log('Emojis fetched successfully:', detailedEmojis);

        localStorage.setItem(`emojis_${this.sourceDomain}`, JSON.stringify(detailedEmojis));
        localStorage.setItem('sourceDomain', this.sourceDomain);
      } catch (error) {
        console.error('Error fetching emojis:', error);
      } finally {
        this.loading = false;
      }
    },
    async fetchEmojisInBatches(emojis, sourceDomain, batchSize = 10) {
      const detailedEmojis = [];
      for (let i = 0; i < emojis.length; i += batchSize) {
        const batch = emojis.slice(i, i + batchSize);
        const detailedBatch = await Promise.all(batch.map(emoji => this.fetchEmojiDetails(emoji, sourceDomain)));
        detailedEmojis.push(...detailedBatch);
      }
      return detailedEmojis;
    },
    async fetchEmojiDetails(emoji, sourceDomain) {
      try {
        const url = `${sourceDomain}/api/emoji?name=${emoji.name}`;
        const response = await axiosInstance.get(url);
        return { ...emoji, license: response.data.license || 'N/A' };
      } catch (error) {
        console.error(`Error fetching details for emoji ${emoji.name}:`, error);
        return { ...emoji, license: 'N/A' };
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
      this.selectedEmojis = newSelectedEmojis.filter(emoji => !emoji.localOnly);
    },
    async importEmojis() {
      this.loading = true;
      try {
        let destinationDomain = this.destinationDomain;
        if (!destinationDomain.startsWith('http://') && !destinationDomain.startsWith('https://')) {
          destinationDomain = `https://${destinationDomain}`;
        }

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
              localOnly: false,
              roleIdsThatCanBeUsedThisEmojiAsReaction: [],
              fileId: fileId,
            });
            console.log(`Emoji ${emoji.name} imported successfully:`, response.data);
          } catch (error) {
            console.error(`Error importing emoji ${emoji.name}:`, error.response ? error.response.data : error.message);
          }
        }
        console.log('All emojis import attempt completed');

        utils.setToken(this.destinationDomain, this.emojiApiToken, this.driveApiToken);
      } catch (error) {
        console.error('Error during the import process:', error);
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

<style>
body {
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
  margin: 0;
  padding: 20px;
}

.request-log {
  max-height: 150px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ddd;
  padding: 10px;
  margin-top: 20px;
}

.request-log ul {
  list-style-type: none;
  padding: 0;
}

.request-log li {
  margin-bottom: 5px;
}

.text-success {
  color: green;
}

.text-warning {
  color: orange;
}

.text-danger {
  color: red;
}
</style>