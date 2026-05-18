<template>
  <div class="files-view">
    <div class="section-header">
      <h2>📁 资源文件</h2>
      <div class="header-actions">
        <el-upload v-if="!store.isViewingHistory" :auto-upload="false" :show-file-list="false" :on-change="handleFileSelect" accept="*">
          <el-button type="primary">
            <el-icon>
              <Upload />
            </el-icon>
            上传文件
          </el-button>
        </el-upload>
      </div>
    </div>

    <!-- 历史版本提示 -->
    <el-alert v-if="store.isViewingHistory" type="warning" :closable="false" show-icon style="margin-bottom: 16px">
      <template #title>
        正在查看历史版本 <strong>{{ store.currentContainer?.version }}</strong>（只读）。
        <el-button type="warning" size="small" text @click="store.selectContainer(store.latestContainer!.id)">
          切换到最新版本 {{ store.latestContainer?.version }}
        </el-button>
      </template>
    </el-alert>

    <div v-if="!store.currentContainer" class="empty-block">
      <el-empty description="请先创建版本容器" :image-size="100" />
    </div>

    <div v-else-if="files.length === 0" class="empty-block">
      <el-empty description="暂无文件，请上传代码、图片、视频等资源" :image-size="100" />
    </div>

    <div v-else class="file-table-wrapper">
      <el-table :data="files" stripe style="width: 100%">
        <el-table-column prop="name" label="文件名" min-width="200">
          <template #default="{ row }">
            <div class="file-name">
              <el-icon :size="18">
                <Document />
              </el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="160" />
        <el-table-column label="大小" width="120" align="right">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.uploadedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="downloadFile(row)">
              <el-icon>
                <Download />
              </el-icon>
              下载
            </el-button>
            <el-button v-if="!store.isViewingHistory" text type="danger" size="small" @click="handleDelete(row)">
              <el-icon>
                <Delete />
              </el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useProjectStore } from '@/stores/project'
import { addFile, deleteFile, formatFileSize, formatDate } from '@/utils/storage'
import type { FileItem } from '@/types'
import type { UploadFile } from 'element-plus'

const store = useProjectStore()

const files = computed(() => store.currentContainer?.files ?? [])

function handleFileSelect(uploadFile: UploadFile) {
  const raw = uploadFile.raw
  const targetId = store.workingContainer?.id
  if (!raw || !store.currentProjectId || !targetId) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const data = (e.target?.result as string)?.split(',')[1] ?? ''
    addFile(store.currentProjectId!, targetId, {
      name: raw.name,
      type: raw.type || 'application/octet-stream',
      size: raw.size,
      data
    })
    store.refresh()
    ElMessage.success(`文件「${raw.name}」上传成功`)
  }
  reader.readAsDataURL(raw)
}

function downloadFile(file: FileItem) {
  const link = document.createElement('a')
  link.href = `data:${file.type};base64,${file.data}`
  link.download = file.name
  link.click()
}

function handleDelete(file: FileItem) {
  ElMessageBox.confirm(`确定要删除文件「${file.name}」吗？`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const targetId = store.workingContainer?.id
    if (store.currentProjectId && targetId) {
      deleteFile(store.currentProjectId, targetId, file.id)
      store.refresh()
      ElMessage.success('文件已删除')
    }
  }).catch(() => { })
}
</script>

<style scoped>
.files-view {
  max-width: 960px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.file-table-wrapper {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
