<template>
  <div class="compare-view">
    <div class="section-header">
      <h2>🔍 版本对比</h2>
    </div>

    <div v-if="containers.length < 2" class="empty-block">
      <el-empty description="至少需要两个版本才能进行对比" :image-size="100" />
    </div>

    <div v-else class="compare-panel">
      <!-- 版本选择 -->
      <div class="version-selectors">
        <div class="selector-item">
          <label>版本 A（旧版本）</label>
          <el-select v-model="versionA" placeholder="选择旧版本" style="width: 100%">
            <el-option v-for="c in containers" :key="c.id" :label="`${c.version} - ${c.label ?? '未标记'} (${formatDate(c.createdAt)})`" :value="c.id" />
          </el-select>
        </div>
        <div class="vs-icon">
          <el-icon :size="24">
            <Switch />
          </el-icon>
        </div>
        <div class="selector-item">
          <label>版本 B（新版本）</label>
          <el-select v-model="versionB" placeholder="选择新版本" style="width: 100%">
            <el-option v-for="c in containers" :key="c.id" :label="`${c.version} - ${c.label ?? '未标记'} (${formatDate(c.createdAt)})`" :value="c.id" />
          </el-select>
        </div>
      </div>

      <el-button type="primary" :disabled="!versionA || !versionB || versionA === versionB" @click="doCompare" style="margin-top: 16px">
        开始对比
      </el-button>

      <!-- 对比结果 -->
      <div v-if="diffResult" class="diff-result">
        <el-divider />

        <!-- 新增文件 -->
        <div v-if="diffResult.addedFiles.length > 0" class="diff-section">
          <h3>
            <el-tag type="success" size="small">新增文件</el-tag>
            <span class="count">{{ diffResult.addedFiles.length }} 个</span>
          </h3>
          <ul>
            <li v-for="f in diffResult.addedFiles" :key="f.name">
              <el-icon color="#67c23a">
                <CirclePlus />
              </el-icon>
              {{ f.name }}
            </li>
          </ul>
        </div>

        <!-- 删除文件 -->
        <div v-if="diffResult.removedFiles.length > 0" class="diff-section">
          <h3>
            <el-tag type="danger" size="small">删除文件</el-tag>
            <span class="count">{{ diffResult.removedFiles.length }} 个</span>
          </h3>
          <ul>
            <li v-for="f in diffResult.removedFiles" :key="f.name">
              <el-icon color="#f56c6c">
                <Remove />
              </el-icon>
              {{ f.name }}
            </li>
          </ul>
        </div>

        <!-- 新增文档 -->
        <div v-if="diffResult.addedDocs.length > 0" class="diff-section">
          <h3>
            <el-tag type="success" size="small">新增文档</el-tag>
            <span class="count">{{ diffResult.addedDocs.length }} 篇</span>
          </h3>
          <ul>
            <li v-for="d in diffResult.addedDocs" :key="d.title">
              <el-icon color="#67c23a">
                <CirclePlus />
              </el-icon>
              {{ d.title }}
            </li>
          </ul>
        </div>

        <!-- 删除文档 -->
        <div v-if="diffResult.removedDocs.length > 0" class="diff-section">
          <h3>
            <el-tag type="danger" size="small">删除文档</el-tag>
            <span class="count">{{ diffResult.removedDocs.length }} 篇</span>
          </h3>
          <ul>
            <li v-for="d in diffResult.removedDocs" :key="d.title">
              <el-icon color="#f56c6c">
                <Remove />
              </el-icon>
              {{ d.title }}
            </li>
          </ul>
        </div>

        <!-- 修改文档 -->
        <div v-if="diffResult.modifiedDocs.length > 0" class="diff-section">
          <h3>
            <el-tag type="warning" size="small">修改文档</el-tag>
            <span class="count">{{ diffResult.modifiedDocs.length }} 篇</span>
          </h3>
          <div v-for="doc in diffResult.modifiedDocs" :key="doc.title" class="doc-diff">
            <h4>{{ doc.title }}</h4>
            <div class="diff-panels">
              <div class="diff-panel old">
                <div class="panel-label">旧版本</div>
                <div class="panel-content" v-html="doc.oldContent || '(空)'" />
              </div>
              <div class="diff-panel new">
                <div class="panel-label">新版本</div>
                <div class="panel-content" v-html="doc.newContent || '(空)'" />
              </div>
            </div>
          </div>
        </div>

        <!-- 无差异 -->
        <div v-if="isNoDiff" class="no-diff">
          <el-result icon="success" title="两个版本完全一致，无差异" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import { compareContainers, formatDate } from '@/utils/storage'
import type { DiffResult } from '@/utils/storage'

const store = useProjectStore()

const containers = computed(() => store.currentProject?.containers ?? [])
const versionA = ref('')
const versionB = ref('')
const diffResult = ref<DiffResult | null>(null)

const isNoDiff = computed(() => {
  if (!diffResult.value) return false
  const d = diffResult.value
  return d.addedFiles.length === 0 && d.removedFiles.length === 0
    && d.addedDocs.length === 0 && d.removedDocs.length === 0 && d.modifiedDocs.length === 0
})

function doCompare() {
  if (!store.currentProjectId || !versionA.value || !versionB.value) return
  diffResult.value = compareContainers(store.currentProjectId, versionA.value, versionB.value)
}
</script>

<style scoped>
.compare-view {
  max-width: 900px;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 20px;
}

.empty-block {
  background: #fff;
  border-radius: 8px;
  padding: 40px;
}

.compare-panel {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.version-selectors {
  display: flex;
  align-items: center;
  gap: 16px;
}

.selector-item {
  flex: 1;
}

.selector-item label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #606266;
}

.vs-icon {
  padding-top: 24px;
  color: #909399;
}

.diff-result {
  margin-top: 4px;
}

.diff-section {
  margin-bottom: 20px;
}

.diff-section h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  margin-bottom: 10px;
}

.diff-section .count {
  font-weight: normal;
  color: #909399;
  font-size: 13px;
}

.diff-section ul {
  list-style: none;
  padding-left: 0;
}

.diff-section li {
  padding: 6px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.doc-diff {
  margin-bottom: 20px;
}

.doc-diff h4 {
  font-size: 14px;
  margin-bottom: 8px;
  color: #303133;
}

.diff-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.diff-panel {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}

.diff-panel.old {
  border-left: 3px solid #f56c6c;
}

.diff-panel.new {
  border-left: 3px solid #67c23a;
}

.panel-label {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.panel-content {
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.7;
  max-height: 240px;
  overflow-y: auto;
}

.no-diff {
  margin-top: 16px;
}
</style>
