<template>
  <div class="form-view">
    <div class="form-view__hd">
      <h1 class="form-view__title">{{ editConn ? 'Edit Connection' : 'New Connection' }}</h1>
      <p class="form-view__sub">
        {{ editConn ? 'Update the connection details below.' : 'Test and save a cloud bucket to start browsing files.' }}
      </p>
    </div>

    <!-- Provider grid (disabled in edit mode) -->
    <div class="provider-grid">
      <button
        v-for="p in PROVIDERS"
        :key="p.id"
        class="provider-card"
        :class="[`provider-card--${p.id}`, { 'provider-card--active': provider === p.id }]"
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

    <form @submit.prevent="handleSave" class="conn-form">
      <div class="form-group">
        <label class="form-label" for="conn-name">Name</label>
        <BaseInput v-model="form.name" id="conn-name" placeholder="e.g. Production Storage" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="conn-bucket">{{ provider === 'azure' ? 'Container' : provider === 'gdrive' ? 'Folder ID' : 'Bucket' }}</label>
        <BaseInput v-model="form.bucket" id="conn-bucket" :placeholder="bucketPlaceholder" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="conn-creds">
          {{ credentialsLabel }}
          <span class="form-label-optional" v-if="provider === 'gcp'">(optional for public buckets)</span>
        </label>
        <textarea
          id="conn-creds"
          class="base-textarea"
          v-model="form.credentials"
          rows="6"
          :placeholder="credentialsPlaceholder"
        ></textarea>
        <p v-if="provider === 'gcp'" class="form-hint">
          Leave empty to connect to a publicly accessible GCS bucket.
        </p>
        <p v-else-if="provider === 'huawei'" class="form-hint">
          The <code style="font-family:var(--mono);font-size:11px">"endpoint"</code> field is required, e.g. <code style="font-family:var(--mono);font-size:11px">https://obs.cn-north-4.myhuaweicloud.com</code>.
        </p>
        <p v-else-if="provider === 'alibaba'" class="form-hint">
          The <code style="font-family:var(--mono);font-size:11px">"endpoint"</code> field is required, e.g. <code style="font-family:var(--mono);font-size:11px">https://oss-cn-hangzhou.aliyuncs.com</code>.
        </p>
        <p v-else-if="provider === 'azure'" class="form-hint">
          "Container" is the Azure Blob container name. The <code style="font-family:var(--mono);font-size:11px">"account_key"</code> is the base64 key from the Azure portal → Storage account → Access keys.
        </p>
        <p v-else-if="provider === 'gdrive'" class="form-hint">
          Enter the Google Drive <strong>Folder ID</strong> from the URL (e.g. <code style="font-family:var(--mono);font-size:11px">1A2B3C...</code>). Share the folder with the service account email.
        </p>
        <p v-else-if="provider === 'wasabi'" class="form-hint">
          Region examples: <code style="font-family:var(--mono);font-size:11px">us-east-1</code>, <code style="font-family:var(--mono);font-size:11px">eu-central-1</code>, <code style="font-family:var(--mono);font-size:11px">ap-northeast-1</code>. Match the endpoint to your region.
        </p>
        <p v-else-if="provider === 'digitalocean'" class="form-hint">
          Replace <code style="font-family:var(--mono);font-size:11px">nyc3</code> with your region (sfo3, ams3, sgp1, etc.) in both <code style="font-family:var(--mono);font-size:11px">region</code> and <code style="font-family:var(--mono);font-size:11px">endpoint</code>.
        </p>
        <p v-else-if="provider === 'backblaze'" class="form-hint">
          Use the S3-Compatible API keys from B2 Cloud Storage → App Keys. The endpoint region must match your bucket region.
        </p>
        <p v-else class="form-hint">
          For Cloudflare R2 or MinIO, include an <code style="font-family:var(--mono);font-size:11px">"endpoint"</code> key pointing to your custom S3-compatible URL.
        </p>
      </div>

      <StatusNotice :message="error"  type="error"   />
      <StatusNotice :message="notice" type="success" />

      <div class="form-actions">
        <BaseButton type="button" variant="ghost" :loading="testing" @click="handleTest">
          {{ testing ? 'Testing…' : 'Test connection' }}
        </BaseButton>
        <BaseButton type="submit" variant="primary" :loading="saving" :disabled="!formValid || saving">
          {{ saving ? 'Saving…' : (editConn ? 'Update' : 'Save') }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseInput    from '../ui/BaseInput.vue'
import BaseButton   from '../ui/BaseButton.vue'
import StatusNotice from '../ui/StatusNotice.vue'
import ProviderIcon from '../ui/ProviderIcon.vue'

const PROVIDERS = [
  { id: 'gcp',          name: 'Google Cloud Storage', sub: 'GCS' },
  { id: 'aws',          name: 'AWS S3',                sub: 'S3 · R2 · MinIO' },
  { id: 'gdrive',       name: 'Google Drive',          sub: 'Drive API v3' },
  { id: 'huawei',       name: 'Huawei OBS',            sub: 'Object Storage' },
  { id: 'alibaba',      name: 'Alibaba Cloud OSS',     sub: 'Object Storage' },
  { id: 'azure',        name: 'Azure Blob Storage',    sub: 'Blob Storage' },
  { id: 'wasabi',       name: 'Wasabi',                sub: 'S3-compatible',  backend: 'aws' },
  { id: 'digitalocean', name: 'DigitalOcean Spaces',   sub: 'S3-compatible',  backend: 'aws' },
  { id: 'backblaze',    name: 'Backblaze B2',          sub: 'S3-compatible',  backend: 'aws' },
]

const props = defineProps({
  testing:  { type: Boolean, default: false },
  saving:   { type: Boolean, default: false },
  error:    { type: String,  default: '' },
  notice:   { type: String,  default: '' },
  editConn: { type: Object,  default: null }, // null = create mode
})

const emit = defineEmits(['test', 'save'])

const provider = ref(props.editConn?.provider ?? 'gcp')
const form     = ref({
  name:        props.editConn?.name        ?? '',
  bucket:      props.editConn?.bucket      ?? '',
  credentials: props.editConn?.credentials ?? '',
})

// Re-sync when editConn changes (e.g. switching which connection to edit)
watch(() => props.editConn, conn => {
  provider.value = conn?.provider ?? 'gcp'
  form.value = {
    name:        conn?.name        ?? '',
    bucket:      conn?.bucket      ?? '',
    credentials: conn?.credentials ?? '',
  }
})

const backendProvider = computed(() => {
  const p = PROVIDERS.find(x => x.id === provider.value)
  return p?.backend || provider.value
})

const bucketPlaceholder = computed(() => {
  if (provider.value === 'gcp')     return 'my-bucket-name'
  if (provider.value === 'gdrive')  return '1A2B3C_folderIdFromURL'
  if (provider.value === 'huawei')  return 'my-obs-bucket'
  if (provider.value === 'alibaba') return 'my-oss-bucket'
  if (provider.value === 'azure')   return 'my-container'
  return 'my-s3-bucket'
})

const credentialsLabel = computed(() => {
  if (provider.value === 'gcp')     return 'Service account JSON'
  if (provider.value === 'gdrive')  return 'Service Account JSON'
  if (provider.value === 'huawei')  return 'OBS Credentials JSON'
  if (provider.value === 'alibaba') return 'OSS Credentials JSON'
  if (provider.value === 'azure')   return 'Azure Credentials JSON'
  return 'Credentials JSON'
})

const gcpPlaceholder     = `{\n  "type": "service_account",\n  "project_id": "...",\n  ...\n}`
const awsPlaceholder     = `{\n  "access_key_id": "...",\n  "secret_access_key": "...",\n  "region": "us-east-1",\n  "endpoint": "https://...r2.cloudflarestorage.com"  ← optional, for R2/MinIO\n}`
const huaweiPlaceholder  = `{\n  "access_key_id": "...",\n  "secret_access_key": "...",\n  "endpoint": "https://obs.cn-north-4.myhuaweicloud.com",\n  "region": "cn-north-4"\n}`
const alibabaPlaceholder = `{\n  "access_key_id": "...",\n  "secret_access_key": "...",\n  "endpoint": "https://oss-cn-hangzhou.aliyuncs.com",\n  "region": "cn-hangzhou"\n}`
const azurePlaceholder   = `{\n  "account_name": "mystorageaccount",\n  "account_key": "base64key=="\n}`
const wasabiPlaceholder  = `{\n  "access_key_id": "...",\n  "secret_access_key": "...",\n  "region": "us-east-1",\n  "endpoint": "https://s3.wasabisys.com"\n}`
const doPlaceholder      = `{\n  "access_key_id": "...",\n  "secret_access_key": "...",\n  "region": "nyc3",\n  "endpoint": "https://nyc3.digitaloceanspaces.com"\n}`
const b2Placeholder      = `{\n  "access_key_id": "...",\n  "secret_access_key": "...",\n  "region": "us-west-004",\n  "endpoint": "https://s3.us-west-004.backblazeb2.com"\n}`

const credentialsPlaceholder = computed(() => {
  if (provider.value === 'gcp')          return gcpPlaceholder
  if (provider.value === 'gdrive')       return gcpPlaceholder
  if (provider.value === 'huawei')       return huaweiPlaceholder
  if (provider.value === 'alibaba')      return alibabaPlaceholder
  if (provider.value === 'azure')        return azurePlaceholder
  if (provider.value === 'wasabi')       return wasabiPlaceholder
  if (provider.value === 'digitalocean') return doPlaceholder
  if (provider.value === 'backblaze')    return b2Placeholder
  return awsPlaceholder
})

const formValid = computed(() =>
  form.value.name.trim().length > 0 &&
  form.value.bucket.trim().length > 0 &&
  (provider.value === 'gcp' || form.value.credentials.trim().length > 0)
)

function handleTest() {
  emit('test', backendProvider.value, form.value.bucket, form.value.credentials)
}

async function handleSave() {
  const success = await new Promise(resolve =>
    emit('save', backendProvider.value, { ...form.value }, resolve, props.editConn?.id ?? null)
  )
  if (success && !props.editConn) {
    // Only reset form on create; keep values visible on edit
    form.value = { name: '', bucket: '', credentials: '' }
  }
}
</script>
