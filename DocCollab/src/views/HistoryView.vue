<template>
  <div class="history-view">
    <div class="section-header">
      <h2>📋 变更记录</h2>
      <el-tag type="info" size="large" round>
        共 {{ versions.length }} 个版本
      </el-tag>
    </div>

    <div v-if="versions.length === 0" class="empty-block">
      <div class="empty-inner">
        <div class="empty-icon">📭</div>
        <h3>暂无变更记录</h3>
        <p>创建项目并保存第一个版本后，变更记录会显示在这里</p>
      </div>
    </div>

    <!-- 看板列表 -->
    <div v-else class="board-list">
      <div v-for="(group, idx) in versions" :key="group.containerId" class="board-card" :class="{ expanded: expandedId === group.containerId }">
        <!-- 版本头部 -->
        <div class="board-header" @click="toggleExpand(group.containerId)">
          <div class="board-header-left">
            <div class="version-badge" :style="{ background: getColor(group.label) }">
              {{ group.version }}
            </div>
            <div class="board-summary">
              <div class="board-title">
                <el-tag :type="getTagType(group.label)" size="small" effect="dark">
                  {{ group.label }}
                </el-tag>
                <span class="board-desc-preview">{{ group.description }}</span>
              </div>
              <div class="board-meta">
                {{ formatDate(group.createdAt) }}
              </div>
            </div>
          </div>
          <div class="board-header-right">
            <span class="board-stats">
              <el-icon>
                <Document />
              </el-icon> {{ group.docCount }}
              <el-icon style="margin-left: 10px">
                <FolderOpened />
              </el-icon> {{ group.fileCount }}
            </span>
            <el-icon class="expand-icon" :class="{ rotated: expandedId === group.containerId }">
              <ArrowDown />
            </el-icon>
          </div>
        </div>

        <!-- 展开详情 -->
        <div v-if="expandedId === group.containerId" class="board-detail">
          <el-divider style="margin: 0 0 16px" />

          <!-- 版本说明 -->
          <div class="detail-section">
            <h4>版本说明</h4>
            <p class="detail-desc">{{ group.description }}</p>
          </div>

          <!-- 相比上一版本的变更 -->
          <div class="detail-section" v-if="group.diff">
            <h4>本版本变更</h4>

            <!-- 无变更 -->
            <p v-if="isDiffEmpty(group.diff)" class="no-change">与上一版本相比无变更</p>

            <div v-else class="change-lines">
              <div v-if="group.diff.addedFiles.length" class="change-line added">
                <el-icon>
                  <CirclePlus />
                </el-icon>
                <span class="change-label">新增文件</span>
                <span v-for="(name, i) in group.diff.addedFiles" :key="'af' + i" class="change-item">{{ name }}</span>
              </div>
              <div v-if="group.diff.removedFiles.length" class="change-line removed">
                <el-icon>
                  <Remove />
                </el-icon>
                <span class="change-label">删除文件</span>
                <span v-for="(name, i) in group.diff.removedFiles" :key="'rf' + i" class="change-item">{{ name }}</span>
              </div>
              <div v-if="group.diff.addedDocs.length" class="change-line added">
                <el-icon>
                  <CirclePlus />
                </el-icon>
                <span class="change-label">新增文档</span>
                <span v-for="(name, i) in group.diff.addedDocs" :key="'ad' + i" class="change-item">{{ name }}</span>
              </div>
              <div v-if="group.diff.removedDocs.length" class="change-line removed">
                <el-icon>
                  <Remove />
                </el-icon>
                <span class="change-label">删除文档</span>
                <span v-for="(name, i) in group.diff.removedDocs" :key="'rd' + i" class="change-item">{{ name }}</span>
              </div>
              <div v-if="group.diff.modifiedDocs.length" class="change-line modified">
                <el-icon>
                  <Edit />
                </el-icon>
                <span class="change-label">修改文档</span>
                <span v-for="(name, i) in group.diff.modifiedDocs" :key="'md' + i" class="change-item">{{ name }}</span>
              </div>
            </div>
          </div>

          <!-- 文件快照 -->
          <div class="detail-section" v-if="group.files && group.files.length > 0">
            <h4>文件快照（{{ group.files.length }} 个）</h4>
            <div class="file-chips">
              <div v-for="f in group.files" :key="f.id" class="file-chip" @click="downloadFile(f)">
                <el-icon>
                  <Document />
                </el-icon>
                <span class="file-name">{{ f.name }}</span>
                <span class="file-size">{{ formatFileSize(f.size) }}</span>
                <el-icon class="dl-icon">
                  <Download />
                </el-icon>
              </div>
            </div>
          </div>

          <!-- 文档快照 -->
          <div class="detail-section" v-if="group.documents && group.documents.length > 0">
            <h4>文档快照（{{ group.documents.length }} 篇）</h4>
            <div class="doc-chips">
              <div v-for="d in group.documents" :key="d.id" class="doc-chip">
                <el-icon>
                  <Document />
                </el-icon>
                <span>{{ d.title || '未命名文档' }}</span>
                <span class="doc-chars">{{ getTextLen(d.content) }} 字</span>
              </div>
            </div>
          </div>

          <!-- 容器标签 -->
          <div class="detail-section">
            <h4>容器标签</h4>
            <div class="tag-row">
              <el-tag v-for="tag in group.customTags" :key="tag" closable size="small" type="warning" effect="light" @close="removeTag(group.containerId, tag)">
                {{ tag }}
              </el-tag>
              <el-input v-if="taggingId === group.containerId" ref="tagInputRef" v-model="newTag" size="small" placeholder="输入标签后回车" class="tag-input-inline" @keyup.enter="addTag(group.containerId)" @blur="cancelTagInput" />
              <el-button v-else size="small" text type="primary" @click="startTagInput(group.containerId)">
                <el-icon>
                  <Plus />
                </el-icon>
                添加标签
              </el-button>
            </div>
          </div>

          <!-- 操作 -->
          <div class="detail-actions">
            <el-button size="small" @click="switchToVersion(group.containerId)" type="primary" plain>
              <el-icon>
                <Switch />
              </el-icon>
              切换到该版本
            </el-button>
            <el-button size="small" @click="exportVersion(group.containerId)" type="success" plain>
              <el-icon>
                <Download />
              </el-icon>
              批量导出
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, Plus, Download, Switch } from '@element-plus/icons-vue'
import { saveAs } from 'file-saver'
import { useProjectStore } from '@/stores/project'
import {
  formatDate,
  formatFileSize,
  getVersionChanges,
  addContainerTag,
  removeContainerTag,
  exportContainerZip,
} from '@/utils/storage'
import type { FileItem, VersionDiff } from '@/types'

const store = useProjectStore()
const expandedId = ref<string | null>(null)

// ========== R9: 标签管理 ==========
const taggingId = ref<string | null>(null)
const newTag = ref('')
const tagInputRef = ref<InstanceType<typeof import('element-plus').ElInput> | null>(null)

function startTagInput(containerId: string) {
  taggingId.value = containerId
  newTag.value = ''
  nextTick(() => {
    const el = document.querySelector('.tag-input-inline input') as HTMLInputElement
    el?.focus()
  })
}

function cancelTagInput() {
  taggingId.value = null
  newTag.value = ''
}

function addTag(containerId: string) {
  const tag = newTag.value.trim()
  if (!tag || !store.currentProjectId) return
  if (addContainerTag(store.currentProjectId, containerId, tag)) {
    store.refresh()
    ElMessage.success(`已添加标签「${tag}」`)
  }
  cancelTagInput()
}

function removeTag(containerId: string, tag: string) {
  if (!store.currentProjectId) return
  removeContainerTag(store.currentProjectId, containerId, tag)
  store.refresh()
  ElMessage.success(`已移除标签「${tag}」`)
}

// ========== R8: 批量导出 ==========
async function exportVersion(containerId: string) {
  if (!store.currentProjectId) return
  ElMessage.info('正在打包...')
  const blob = await exportContainerZip(store.currentProjectId, containerId)
  if (blob) {
    saveAs(blob, `export-${containerId}.zip`)
    ElMessage.success('导出成功')
  } else {
    ElMessage.error('导出失败')
  }
}

// 按版本分组（倒序，最新的在前），附带 diff
const versions = computed(() => {
  if (!store.currentProject) return []
  const containers = store.currentProject.containers
  return [...containers].reverse().map(c => ({
    containerId: c.id,
    version: c.version,
    label: c.label ?? '未标记',
    description: c.description ?? '无描述',
    createdAt: c.createdAt,
    docCount: c.documents.length,
    fileCount: c.files.length,
    files: [...c.files],
    documents: [...c.documents],
    customTags: [...c.customTags],
    diff: getVersionChanges(containers, c.id)
  }))
})

const labelColors: Record<string, string> = {
  '初始版本': '#67c23a',
  '功能迭代': '#409eff',
  'Bug修复': '#f56c6c',
  '文档完善': '#909399',
  '代码重构': '#e6a23c',
  '未标记': '#c0c4cc'
}

const labelTagTypes: Record<string, 'success' | 'danger' | 'warning' | 'primary' | 'info'> = {
  '初始版本': 'success',
  '功能迭代': 'primary',
  'Bug修复': 'danger',
  '文档完善': 'info',
  '代码重构': 'warning',
  '未标记': 'info'
}

function isDiffEmpty(diff: VersionDiff) {
  return !diff.addedFiles.length && !diff.removedFiles.length
    && !diff.addedDocs.length && !diff.removedDocs.length
    && !diff.modifiedDocs.length
}

function getColor(label: string) { return labelColors[label] ?? '#c0c4cc' }
function getTagType(label: string) { return labelTagTypes[label] ?? 'info' }

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function switchToVersion(containerId: string) {
  store.selectContainer(containerId)
}

function downloadFile(f: FileItem) {
  const link = document.createElement('a')
  link.href = `data:${f.type};base64,${f.data}`
  link.download = f.name
  link.click()
}

function getTextLen(html: string): number {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || '').replace(/\s+/g, '').length
}
</script>

<style scoped>
.history-view {
  max-width: 860px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
}

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
  color: #909399;
  font-size: 14px;
}

/* === 看板列表 === */
.board-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.board-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #ebeef5;
  overflow: hidden;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.board-card:hover {
  border-color: #c6d9ff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.08);
}

.board-card.expanded {
  border-color: #c6d9ff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.1);
}

/* --- 看板头部 --- */
.board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.board-header:hover {
  background: #fafbfc;
}

.board-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.version-badge {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.board-summary {
  min-width: 0;
}

.board-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.board-desc-preview {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 340px;
  display: inline-block;
}

.board-meta {
  font-size: 12px;
  color: #909399;
}

.board-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  color: #909399;
  font-size: 13px;
}

.board-stats {
  display: flex;
  align-items: center;
  gap: 2px;
}

.expand-icon {
  transition: transform 0.25s ease;
  color: #c0c4cc;
  font-size: 18px;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

/* --- 展开详情 --- */
.board-detail {
  padding: 0 20px 20px;
  background: #fafbfc;
  border-top: 1px solid #f0f0f0;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section h4 {
  font-size: 13px;
  font-weight: 600;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.detail-desc {
  font-size: 15px;
  color: #303133;
  line-height: 1.7;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

/* 文件标签 */
.file-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  color: #606266;
}

.file-chip:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

.file-chip .file-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-chip .file-size {
  color: #c0c4cc;
  font-size: 11px;
}

.file-chip .dl-icon {
  color: #c0c4cc;
  font-size: 13px;
}

.file-chip:hover .dl-icon {
  color: #409eff;
}

/* 文档标签 */
.doc-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.doc-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 20px;
  font-size: 13px;
  color: #606266;
}

.doc-chip .doc-chars {
  color: #c0c4cc;
  font-size: 11px;
}

.detail-actions {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

/* 变更明细行 */
.change-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.change-line {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  flex-wrap: wrap;
}

.change-line.added {
  background: #f0f9eb;
  color: #67c23a;
}

.change-line.removed {
  background: #fef0f0;
  color: #f56c6c;
}

.change-line.modified {
  background: #fdf6ec;
  color: #e6a23c;
}

.change-label {
  font-weight: 600;
  margin-right: 2px;
}

.change-item {
  background: rgba(0, 0, 0, 0.06);
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  margin-left: 4px;
}

.no-change {
  font-size: 13px;
  color: #909399;
  padding: 4px 0;
}

/* 标签行 */
.tag-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.tag-input-inline {
  width: 160px;
}
</style>
