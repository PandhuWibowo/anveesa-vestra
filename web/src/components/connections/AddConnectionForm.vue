<template>
  <div class="form-view">
    <div class="form-view__hd">
      <h1 class="form-view__title">{{ editConn ? 'Edit storage' : 'Add storage' }}</h1>
      <p class="form-view__sub">
        {{ editConn ? 'Update the details, then enter your keys again to save.' : 'Connect a bucket from any of these providers. Your keys are encrypted and stay on this device.' }}
      </p>
    </div>

    <!-- 1. Provider -->
    <section class="form-step">
      <h2 class="form-step__title">Provider</h2>
      <div class="provider-grid">
        <button
          v-for="p in PROVIDERS"
          :key="p.id"
          type="button"
          class="provider-card"
          :class="{ 'provider-card--active': provider === p.id }"
          :disabled="!!editConn && provider !== p.id"
          @click="!editConn && (provider = p.id)"
        >
          <div class="provider-card__icon" :class="`provider-card__icon--${p.id}`">
            <ProviderIcon :provider="p.id" :size="18" />
          </div>
          <div class="provider-card__info">
            <span class="provider-card__name">{{ p.name }}</span>
            <span class="provider-card__sub">{{ p.sub }}</span>
          </div>
        </button>
      </div>
    </section>

    <form @submit.prevent="handleSave" class="conn-form">
      <!-- 2. Details -->
      <section class="form-step">
        <h2 class="form-step__title">Details</h2>
        <div class="form-row">
          <label class="field">
            <span class="form-label">Name</span>
            <input class="base-input" v-model="form.name" placeholder="e.g. Product media" required />
          </label>
          <label class="field">
            <span class="form-label">{{ bucketLabel }}</span>
            <input class="base-input" v-model="form.bucket" :placeholder="bucketPlaceholder" required />
          </label>
        </div>
      </section>

      <!-- 3. Access -->
      <section class="form-step">
        <h2 class="form-step__title">Access</h2>

        <!-- Google: service account key file -->
        <template v-if="kind === 'json'">
          <div class="field">
            <div class="details-hd">
              <span class="form-label">
                Service account key
                <span v-if="provider === 'gcp'" class="form-label__opt">(not needed for public buckets)</span>
              </span>
              <label class="link-btn">
                Choose key file…
                <input type="file" accept=".json,application/json" hidden @change="loadKeyFile" />
              </label>
            </div>
            <textarea class="base-textarea" v-model="jsonKey" rows="5" spellcheck="false"
              placeholder='Paste the JSON key, or choose the file you downloaded from Google Cloud'></textarea>
            <span v-if="keyFileName" class="field-hint">Loaded {{ keyFileName }}</span>
          </div>
          <details v-if="provider === 'gdrive'" class="form-help">
            <summary>How to set up Google Drive</summary>
            <ol>
              <li>In Google Cloud Console, enable the <strong>Google Drive API</strong>.</li>
              <li>Create a service account and download its JSON key.</li>
              <li>In Google Drive, create a <strong>Shared drive</strong> (needs Google Workspace).</li>
              <li>Add the service account's <code>client_email</code> to the shared drive as <strong>Contributor</strong>.</li>
              <li>Open the shared drive; the folder ID is the last part of the URL.</li>
            </ol>
          </details>
        </template>

        <!-- Azure: account name + key -->
        <div v-else-if="kind === 'azure'" class="form-row">
          <label class="field">
            <span class="form-label">Storage account</span>
            <input class="base-input" v-model="keys.account_name" placeholder="e.g. mystorageaccount" autocomplete="off" />
          </label>
          <label class="field">
            <span class="form-label">Account key</span>
            <div class="secret-field">
              <input class="base-input" :type="showSecret ? 'text' : 'password'" v-model="keys.account_key" placeholder="From Access keys in the Azure portal" autocomplete="off" />
              <button type="button" class="secret-field__toggle" @click="showSecret = !showSecret">{{ showSecret ? 'Hide' : 'Show' }}</button>
            </div>
          </label>
        </div>

        <!-- S3-style access keys -->
        <template v-else>
          <div class="form-row">
            <label class="field">
              <span class="form-label">Access key ID</span>
              <input class="base-input mono" v-model="keys.access_key_id" autocomplete="off" spellcheck="false" />
            </label>
            <label class="field">
              <span class="form-label">Secret access key</span>
              <div class="secret-field">
                <input class="base-input mono" :type="showSecret ? 'text' : 'password'" v-model="keys.secret_access_key" autocomplete="off" spellcheck="false" />
                <button type="button" class="secret-field__toggle" @click="showSecret = !showSecret">{{ showSecret ? 'Hide' : 'Show' }}</button>
              </div>
            </label>
          </div>
          <div class="form-row">
            <label class="field">
              <span class="form-label">Region</span>
              <input class="base-input" v-model="keys.region" :placeholder="'e.g. ' + hints.region" />
            </label>
            <label class="field">
              <span class="form-label">
                Endpoint
                <span v-if="!endpointRequired" class="form-label__opt">(only for R2 or MinIO)</span>
              </span>
              <input class="base-input" v-model="keys.endpoint" :placeholder="hints.endpoint" />
            </label>
          </div>
        </template>
      </section>

      <StatusNotice :message="error"  type="error"   />
      <StatusNotice :message="notice" type="success" />

      <div class="form-actions">
        <BaseButton type="button" variant="ghost" :loading="testing" @click="handleTest">
          {{ testing ? 'Testing…' : 'Test connection' }}
        </BaseButton>
        <BaseButton type="submit" variant="primary" :loading="saving" :disabled="!formValid || saving">
          {{ saving ? 'Saving…' : (editConn ? 'Save changes' : 'Add storage') }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseButton   from '../ui/BaseButton.vue'
import StatusNotice from '../ui/StatusNotice.vue'
import ProviderIcon from '../ui/ProviderIcon.vue'

const PROVIDERS = [
  { id: 'gcp',          name: 'Google Cloud Storage', sub: 'Buckets' },
  { id: 'aws',          name: 'Amazon S3',            sub: 'Also R2 and MinIO' },
  { id: 'azure',        name: 'Azure Blob Storage',   sub: 'Containers' },
  { id: 'gdrive',       name: 'Google Drive',         sub: 'Shared drives' },
  { id: 'huawei',       name: 'Huawei OBS',           sub: 'Object storage' },
  { id: 'alibaba',      name: 'Alibaba Cloud OSS',    sub: 'Object storage' },
  { id: 'wasabi',       name: 'Wasabi',               sub: 'S3-compatible', backend: 'aws' },
  { id: 'digitalocean', name: 'DigitalOcean Spaces',  sub: 'S3-compatible', backend: 'aws' },
  { id: 'backblaze',    name: 'Backblaze B2',         sub: 'S3-compatible', backend: 'aws' },
]

// Example values per provider, shown as placeholders
const HINTS = {
  aws:          { region: 'us-east-1',   endpoint: 'https://<account>.r2.cloudflarestorage.com' },
  huawei:       { region: 'ap-southeast-4', endpoint: 'https://obs.ap-southeast-4.myhuaweicloud.com' },
  alibaba:      { region: 'cn-hangzhou', endpoint: 'https://oss-cn-hangzhou.aliyuncs.com' },
  wasabi:       { region: 'us-east-1',   endpoint: 'https://s3.us-east-1.wasabisys.com' },
  digitalocean: { region: 'nyc3',        endpoint: 'https://nyc3.digitaloceanspaces.com' },
  backblaze:    { region: 'us-west-004', endpoint: 'https://s3.us-west-004.backblazeb2.com' },
}

const props = defineProps({
  testing:  { type: Boolean, default: false },
  saving:   { type: Boolean, default: false },
  error:    { type: String,  default: '' },
  notice:   { type: String,  default: '' },
  editConn: { type: Object,  default: null }, // null = create mode
})

const emit = defineEmits(['test', 'save'])

const emptyKeys = () => ({ access_key_id: '', secret_access_key: '', region: '', endpoint: '', account_name: '', account_key: '' })

const provider    = ref(props.editConn?.provider ?? 'gcp')
const form        = ref({ name: '', bucket: '' })
const keys        = ref(emptyKeys())
const jsonKey     = ref('')
const keyFileName = ref('')
const showSecret  = ref(false)

// Fill the fields from a connection being edited (its saved credentials, if any)
function load(conn) {
  provider.value = conn?.provider ?? 'gcp'
  form.value = { name: conn?.name ?? '', bucket: conn?.bucket ?? '' }
  keys.value = emptyKeys()
  jsonKey.value = ''
  keyFileName.value = ''
  if (!conn?.credentials) return
  try {
    const parsed = JSON.parse(conn.credentials)
    if (parsed.type || parsed.client_email) jsonKey.value = conn.credentials
    else Object.assign(keys.value, parsed)
  } catch { jsonKey.value = conn.credentials }
}
load(props.editConn)
watch(() => props.editConn, load)
watch(provider, () => { showSecret.value = false })

const kind = computed(() =>
  provider.value === 'gcp' || provider.value === 'gdrive' ? 'json'
  : provider.value === 'azure' ? 'azure' : 'keys')

const hints = computed(() => HINTS[provider.value] ?? HINTS.aws)
const endpointRequired = computed(() => provider.value !== 'aws')

const backendProvider = computed(() => {
  const p = PROVIDERS.find(x => x.id === provider.value)
  return p?.backend || provider.value
})

const bucketLabel = computed(() =>
  provider.value === 'azure' ? 'Container' : provider.value === 'gdrive' ? 'Folder ID' : 'Bucket')

const bucketPlaceholder = computed(() => {
  if (provider.value === 'gdrive') return 'From the shared drive URL'
  if (provider.value === 'azure')  return 'e.g. backups'
  return 'e.g. my-bucket'
})

// The API stores credentials as one JSON string per provider
const credentials = computed(() => {
  if (kind.value === 'json') return jsonKey.value.trim()
  const k = keys.value
  const pick = kind.value === 'azure'
    ? { account_name: k.account_name.trim(), account_key: k.account_key.trim() }
    : { access_key_id: k.access_key_id.trim(), secret_access_key: k.secret_access_key.trim(), region: k.region.trim(), endpoint: k.endpoint.trim() }
  for (const key of Object.keys(pick)) if (!pick[key]) delete pick[key]
  return JSON.stringify(pick)
})

const credentialsComplete = computed(() => {
  const k = keys.value
  if (kind.value === 'json')  return provider.value === 'gcp' || jsonKey.value.trim().length > 0
  if (kind.value === 'azure') return !!(k.account_name.trim() && k.account_key.trim())
  return !!(k.access_key_id.trim() && k.secret_access_key.trim() && (!endpointRequired.value || k.endpoint.trim()))
})

const formValid = computed(() =>
  form.value.name.trim().length > 0 && form.value.bucket.trim().length > 0 && credentialsComplete.value)

async function loadKeyFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  jsonKey.value = (await file.text()).trim()
  keyFileName.value = file.name
}

function handleTest() {
  emit('test', backendProvider.value, form.value.bucket, credentials.value)
}

async function handleSave() {
  const payload = { name: form.value.name, bucket: form.value.bucket, credentials: credentials.value }
  const success = await new Promise(resolve =>
    emit('save', backendProvider.value, payload, resolve, props.editConn?.id ?? null)
  )
  if (success && !props.editConn) load(null)
}
</script>
