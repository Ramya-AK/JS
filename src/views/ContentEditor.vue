<template>
  <div :class="{ 'editor-container': isEditing, 'view-mode': !isEditing }">
    <div class="toolbar">
      <button @click="createNewContent" :disabled="isEditing">New Content</button>
      <button @click="saveContent" v-if="isEditing" :disabled="isSaving">
        {{ isSaving ? 'Saving...' : 'Save' }}
      </button>
      <button @click="cancelEditing" v-if="isEditing">Cancel</button>
    </div>

    <div v-if="isLoading" class="loading">Loading contents...</div>

    <div class="content-list" v-if="!isEditing && !isLoading">
      <div v-for="item in savedContents" :key="item.id" class="content-item">
        <h2>{{ item.title }}</h2>
        <div>{{ item.content }}</div>
        <!-- <small>Last edited: {{ new Date(item.lastEdited).toLocaleString() }}</small> -->
        <div class="item-actions">
          <button @click="editContent(item)">Edit</button>
          <button @click="deleteContent(item.id)">Delete</button>
        </div>
      </div>
    </div>

    <div class="editor" v-if="isEditing">
      <input v-model="currentContent.title" placeholder="Enter title" class="title-input" />
      <textarea
        v-model="currentContent.content"
        placeholder="Write your content here..."
        class="content-textarea"
      ></textarea>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase/config'
import { ref as dbRef, set, push, remove, onValue, off } from 'firebase/database'

// State
const isEditing = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref('')
const savedContents = ref([])
const currentContent = reactive({
  id: null,
  title: '',
  content: '',
  lastEdited: null
})

// Firebase References
const contentsRef = dbRef(db, 'contents')

// Methods
const createNewContent = () => {
  currentContent.id = null
  currentContent.title = ''
  currentContent.content = ''
  currentContent.lastEdited = null
  isEditing.value = true
}

const formatContentWithLinks = (content) => {
  // Regex to find markdown-style links: [text](url)
  return content.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
    // Validate URL
    const validUrl = /^(https?:\/\/)/i.test(url) ? url : `https://${url}`
    return `<a href="${validUrl}" target="_blank">${text}</a>`
  })
}

const saveContent = async () => {
  if (!currentContent.title || !currentContent.content) {
    error.value = 'Please fill in both title and content'
    return
  }

  isSaving.value = true
  error.value = ''

  try {
    const contentToSave = {
      title: currentContent.title,
      content: currentContent.content,
      lastEdited: new Date().toISOString()
    }

    if (currentContent.id) {
      // Update existing content
      await set(dbRef(db, `contents/${currentContent.id}`), contentToSave)
    } else {
      // Create new content
      const newContentRef = push(contentsRef)
      await set(newContentRef, contentToSave)
    }

    isEditing.value = false
  } catch (err) {
    error.value = 'Error saving content: ' + err.message
    console.error('Error saving content:', err)
  } finally {
    isSaving.value = false
  }
}

const editContent = (content) => {
  currentContent.id = content.id
  currentContent.title = content.title
  currentContent.content = content.content
  currentContent.lastEdited = content.lastEdited
  isEditing.value = true
}

const deleteContent = async (id) => {
  if (!confirm('Are you sure you want to delete this content?')) return

  error.value = ''
  try {
    await remove(dbRef(db, `contents/${id}`))
  } catch (err) {
    error.value = 'Error deleting content: ' + err.message
    console.error('Error deleting content:', err)
  }
}

const cancelEditing = () => {
  isEditing.value = false
  error.value = ''
}

// Real-time data sync
onMounted(() => {
  isLoading.value = true

  onValue(
    contentsRef,
    (snapshot) => {
      const data = snapshot.val()
      if (data) {
        // Convert Firebase object to array with IDs
        savedContents.value = Object.entries(data).map(([id, content]) => ({
          id,
          ...content,
          formattedContent: formatContentWithLinks(content.content)
        }))
      } else {
        savedContents.value = []
      }
      isLoading.value = false
    },
    (error) => {
      console.error('Error fetching contents:', error)
      error.value = 'Error loading contents: ' + error.message
      isLoading.value = false
    }
  )
})

// Cleanup Firebase listeners
onUnmounted(() => {
  off(contentsRef)
})
</script>

<style scoped>
.editor-container {
  /* max-width: 800px; */
  margin: 0 auto;
  padding: 20px;
  background-color: black;
}

.view-mode {
  display: flex;
  align-items: center;
  flex-direction: column;
  margin: 0 auto;
  padding: 20px;
  background-color: black;
}

.link-format-guide {
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 0.9em;
  color: #666;
}

.toolbar {
  margin-bottom: 20px;
}

.toolbar button {
  margin-right: 10px;
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.toolbar button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-item {
  padding: 15px;
  border: 2px solid #111010;
  border-radius: 4px;
}

.item-actions {
  margin-top: 10px;
}

.item-actions button {
  margin-right: 10px;
  padding: 5px 10px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.item-actions button:last-child {
  background-color: #f44336;
}

.editor {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.title-input {
  padding: 10px;
  font-size: 1.2em;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.content-textarea {
  padding: 10px;
  min-height: 300px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.loading,
.error-message {
  padding: 15px;
  margin: 10px 0;
  border-radius: 4px;
}

.loading {
  background-color: #e3f2fd;
  color: #1976d2;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
}

h2 {
  border-bottom: 1px solid black;
  color: antiquewhite;
  font-weight: bolder;
}

div {
  font-weight: normal;
  color: white;
  margin-top: 10px;
  white-space: pre-wrap;
}
</style>
