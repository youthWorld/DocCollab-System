<template>
  <div class="documents-view">
    <!-- 顶部标题栏 -->
    <div class="section-header">
      <div class="header-left">
        <h2><span class="header-icon">📝</span> 文档编辑</h2>
        <span class="header-hint" v-if="store.currentContainer">
          {{ store.currentContainer.version }} · {{ docs.length }} 篇文档
        </span>
      </div>
      <el-button v-if="!store.isViewingHistory" type="primary" size="large" @click="createNewDoc" :icon="Plus" round>
        新建文档
      </el-button>
    </div>

    <!-- 历史版本提示 -->
    <el-alert v-if="store.isViewingHistory" type="warning" :closable="false" show-icon style="margin-bottom: 16px">
      <template #title>
        正在查看历史版本 <strong>{{ store.currentContainer?.version }}</strong>（只读）。
        <el-button type="warning" size="small" text @click="store.selectContainer(store.latestContainer!.id)">
          切换到最新版本 {{ store.latestContainer?.version }} 进行编辑
        </el-button>
      </template>
    </el-alert>

    <!-- 文档卡片列表 -->
    <div v-if="docs.length === 0 && !editingDoc" class="empty-block">
      <div class="empty-inner">
        <div class="empty-icon">📄</div>
        <h3>还没有文档</h3>
        <p>点击右上角「新建文档」开始编写</p>
      </div>
    </div>

    <div v-else-if="!editingDoc" class="doc-grid">
      <div v-for="doc in docs" :key="doc.id" class="doc-card" @click="startEdit(doc)">
        <div class="doc-card-icon">
          <el-icon :size="22">
            <Document />
          </el-icon>
        </div>
        <div class="doc-card-body">
          <div class="doc-card-title">{{ doc.title || '未命名文档' }}</div>
          <div class="doc-card-meta">
            <span class="doc-card-time">{{ formatDate(doc.updatedAt) }}</span>
            <span class="doc-card-chars">{{ getTextLen(doc.content) }} 字</span>
          </div>
        </div>
        <div class="doc-card-arrow">
          <el-icon>
            <ArrowRight />
          </el-icon>
        </div>
      </div>
    </div>

    <!-- 富文本编辑器 -->
    <div v-if="editingDoc" class="editor-panel">
      <!-- 编辑器顶部栏 -->
      <div class="editor-topbar">
        <div class="topbar-left">
          <el-button text @click="cancelEdit" class="back-btn">
            <el-icon>
              <ArrowLeft />
            </el-icon>
            返回列表
          </el-button>
          <el-divider direction="vertical" />
          <el-input v-model="editingDoc.title" placeholder="输入文档标题..." class="title-input" :maxlength="100" />
        </div>
        <div class="topbar-right">
          <template v-if="!store.isViewingHistory">
            <span class="save-hint" v-if="hasUnsaved">有未保存的更改</span>
            <el-button type="primary" @click="saveDoc" :icon="Check" round>
              保存文档
            </el-button>
          </template>
          <el-tag v-else type="warning" size="small">只读</el-tag>
        </div>
      </div>

      <!-- 工具栏（仅编辑模式） -->
      <div class="editor-toolbar" v-if="editor && !store.isViewingHistory">
        <div class="toolbar-group">
          <el-tooltip content="加粗 (Ctrl+B)" placement="bottom">
            <button class="tool-btn" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()">
              <strong>B</strong>
            </button>
          </el-tooltip>
          <el-tooltip content="斜体 (Ctrl+I)" placement="bottom">
            <button class="tool-btn" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()">
              <em>I</em>
            </button>
          </el-tooltip>
          <el-tooltip content="删除线" placement="bottom">
            <button class="tool-btn" :class="{ active: editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()">
              <s>S</s>
            </button>
          </el-tooltip>
          <el-tooltip content="下划线 (Ctrl+U)" placement="bottom">
            <button class="tool-btn" :class="{ active: editor.isActive('underline') }" @click="editor.chain().focus().toggleUnderline().run()">
              <u>U</u>
            </button>
          </el-tooltip>
        </div>

        <div class="toolbar-divider" />

        <div class="toolbar-group">
          <el-tooltip content="一级标题" placement="bottom">
            <button class="tool-btn heading-btn" :class="{ active: editor.isActive('heading', { level: 1 }) }" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()">
              H1
            </button>
          </el-tooltip>
          <el-tooltip content="二级标题" placement="bottom">
            <button class="tool-btn heading-btn" :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">
              H2
            </button>
          </el-tooltip>
          <el-tooltip content="三级标题" placement="bottom">
            <button class="tool-btn heading-btn" :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">
              H3
            </button>
          </el-tooltip>
        </div>

        <div class="toolbar-divider" />

        <div class="toolbar-group">
          <el-tooltip content="无序列表" placement="bottom">
            <button class="tool-btn" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="3" cy="4" r="1.5" />
                <circle cx="3" cy="8" r="1.5" />
                <circle cx="3" cy="12" r="1.5" />
                <line x1="6" y1="4" x2="14" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <line x1="6" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <line x1="6" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </el-tooltip>
          <el-tooltip content="有序列表" placement="bottom">
            <button class="tool-btn" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><text x="1" y="5.5" font-size="7" font-weight="bold">1</text><text x="1" y="10.5" font-size="7" font-weight="bold">2</text><text x="1" y="15.5" font-size="7" font-weight="bold">3</text>
                <line x1="6" y1="4" x2="14" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <line x1="6" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <line x1="6" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </el-tooltip>
          <el-tooltip content="引用块" placement="bottom">
            <button class="tool-btn" :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 3h3v5H3.5V5.5H2V3zm7 0h3v5h-1.5V5.5H9V3zM2 10h3v3H2v-3zm7 0h3v3H9v-3z" />
              </svg>
            </button>
          </el-tooltip>
          <el-tooltip content="代码块" placement="bottom">
            <button class="tool-btn" :class="{ active: editor.isActive('codeBlock') }" @click="editor.chain().focus().toggleCodeBlock().run()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.5 4L1.5 7.5 4.5 11 5.5 10.2 3.1 7.5 5.5 4.8 4.5 4zM11.5 4L10.5 4.8 12.9 7.5 10.5 10.2 11.5 11 14.5 7.5 11.5 4z" />
              </svg>
            </button>
          </el-tooltip>
        </div>

        <div class="toolbar-divider" />

        <div class="toolbar-group">
          <el-tooltip content="撤销 (Ctrl+Z)" placement="bottom">
            <button class="tool-btn" :disabled="!editor.can().undo()" @click="editor.chain().focus().undo().run()">
              <el-icon :size="16">
                <RefreshLeft />
              </el-icon>
            </button>
          </el-tooltip>
          <el-tooltip content="重做 (Ctrl+Y)" placement="bottom">
            <button class="tool-btn" :disabled="!editor.can().redo()" @click="editor.chain().focus().redo().run()">
              <el-icon :size="16">
                <RefreshRight />
              </el-icon>
            </button>
          </el-tooltip>
        </div>
      </div>

      <!-- 编辑区域 -->
      <div class="editor-body">
        <editor-content :editor="editor" class="editor-content" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Check, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import { saveDocument, formatDate } from '@/utils/storage'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import type { DocItem } from '@/types'

const store = useProjectStore()

const editingDoc = ref<DocItem | null>(null)
const isNew = ref(false)
const hasUnsaved = ref(false)
let originalContent = ''

const docs = computed(() => store.currentContainer?.documents ?? [])

const editor = useEditor({
  content: '',
  extensions: [StarterKit, Underline],
  editorProps: {
    attributes: {
      class: 'prose'
    }
  }
})

// 监听编辑内容变化
watch(() => editor.value?.getHTML(), (val) => {
  if (editingDoc.value && val !== undefined) {
    hasUnsaved.value = val !== originalContent
  }
})

function getTextLen(html: string): number {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || '').replace(/\s+/g, '').length
}

function createNewDoc() {
  editingDoc.value = {
    id: '',
    title: '新建文档',
    content: '',
    updatedAt: new Date().toISOString()
  }
  isNew.value = true
  hasUnsaved.value = false
  originalContent = ''
  editor.value?.commands.setContent('')
}

function startEdit(doc: DocItem) {
  editingDoc.value = { ...doc }
  isNew.value = false
  hasUnsaved.value = false
  originalContent = doc.content
  editor.value?.commands.setContent(doc.content)
}

function cancelEdit() {
  editingDoc.value = null
  isNew.value = false
  hasUnsaved.value = false
  editor.value?.commands.setContent('')
}

function saveDoc() {
  const targetContainerId = store.workingContainer?.id
  if (!editingDoc.value || !store.currentProjectId || !targetContainerId) return

  const success = saveDocument(
    store.currentProjectId,
    targetContainerId,
    {
      id: editingDoc.value.id || undefined,
      title: editingDoc.value.title.trim() || '未命名文档',
      content: editor.value?.getHTML() ?? ''
    }
  )

  if (success) {
    store.refresh()
    ElMessage.success('文档已保存')
    editingDoc.value = null
    hasUnsaved.value = false
  } else {
    ElMessage.error('保存失败')
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.documents-view {
  max-width: 900px;
  margin: 0 auto;
}

/* === 顶部栏 === */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left h2 {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 4px;
}

.header-icon {
  margin-right: 6px;
}

.header-hint {
  font-size: 13px;
  color: #909399;
  margin-left: 4px;
}

/* === 空状态 === */
.empty-block {
  background: #fff;
  border-radius: 16px;
  padding: 80px 40px;
  text-align: center;
  border: 2px dashed #e4e7ed;
}

.empty-inner .empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.empty-inner h3 {
  font-size: 18px;
  color: #303133;
  margin-bottom: 8px;
}

.empty-inner p {
  font-size: 14px;
  color: #909399;
}

/* === 文档卡片列表 === */
.doc-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doc-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.doc-card:hover {
  border-color: #c6d9ff;
  background: #f8faff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
}

.doc-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #ecf5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  flex-shrink: 0;
}

.doc-card-body {
  flex: 1;
  min-width: 0;
}

.doc-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-card-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.doc-card-arrow {
  color: #c0c4cc;
  flex-shrink: 0;
}

/* === 编辑器面板 === */
.editor-panel {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #ebeef5;
}

/* --- 编辑器顶部栏 --- */
.editor-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafbfc;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.back-btn {
  color: #606266;
  flex-shrink: 0;
}

.title-input {
  max-width: 400px;
}

.title-input :deep(.el-input__wrapper) {
  background: transparent;
  border: none;
  box-shadow: none;
  font-size: 16px;
  font-weight: 600;
  padding: 0 4px;
}

.title-input :deep(.el-input__wrapper:hover),
.title-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: none;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.save-hint {
  font-size: 12px;
  color: #e6a23c;
}

/* --- 工具栏 --- */
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  overflow-x: auto;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 22px;
  background: #e4e7ed;
  margin: 0 6px;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 7px;
  cursor: pointer;
  color: #606266;
  font-size: 13px;
  transition: all 0.15s;
}

.tool-btn:hover {
  background: #f0f2f5;
  color: #303133;
}

.tool-btn.active {
  background: #ecf5ff;
  color: #409eff;
}

.tool-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.tool-btn.heading-btn {
  font-weight: 700;
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* --- 编辑器内容区 --- */
.editor-body {
  padding: 32px 40px;
  min-height: 420px;
}

.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 360px;
  font-size: 16px;
  line-height: 1.9;
  color: #303133;
  caret-color: #409eff;
}

.editor-content :deep(.ProseMirror)::placeholder {
  color: #c0c4cc;
}

/* 标题样式 */
.editor-content :deep(.ProseMirror h1) {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 32px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  letter-spacing: -0.5px;
}

.editor-content :deep(.ProseMirror h2) {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 28px 0 12px;
  letter-spacing: -0.3px;
}

.editor-content :deep(.ProseMirror h3) {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 10px;
}

/* 段落 */
.editor-content :deep(.ProseMirror p) {
  margin: 10px 0;
  color: #4a4a5a;
}

/* 列表 */
.editor-content :deep(.ProseMirror ul),
.editor-content :deep(.ProseMirror ol) {
  padding-left: 24px;
  margin: 10px 0;
}

.editor-content :deep(.ProseMirror li) {
  margin: 6px 0;
  padding-left: 4px;
}

.editor-content :deep(.ProseMirror li::marker) {
  color: #409eff;
}

/* 引用块 */
.editor-content :deep(.ProseMirror blockquote) {
  border-left: 4px solid #409eff;
  background: #f8faff;
  margin: 16px 0;
  padding: 12px 20px;
  border-radius: 0 8px 8px 0;
  color: #4a5568;
  font-style: italic;
}

/* 代码块 */
.editor-content :deep(.ProseMirror pre) {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 10px;
  padding: 18px 22px;
  margin: 16px 0;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 14px;
  line-height: 1.6;
  overflow-x: auto;
}

.editor-content :deep(.ProseMirror pre code) {
  background: none;
  color: inherit;
  padding: 0;
  font-size: inherit;
}

/* 行内代码 */
.editor-content :deep(.ProseMirror code) {
  background: #f0f0f5;
  color: #e05d65;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 0.9em;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* 分割线 */
.editor-content :deep(.ProseMirror hr) {
  border: none;
  border-top: 2px solid #f0f0f0;
  margin: 28px 0;
}

/* 加粗 */
.editor-content :deep(.ProseMirror strong) {
  color: #1a1a2e;
  font-weight: 700;
}

/* 链接 */
.editor-content :deep(.ProseMirror a) {
  color: #409eff;
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* 图片 */
.editor-content :deep(.ProseMirror img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 12px 0;
}

/* 选中文本 */
.editor-content :deep(.ProseMirror) ::selection {
  background: #d4e4ff;
}

/* p 标签内是空的就显示 placeholder */
.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #c0c4cc;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
