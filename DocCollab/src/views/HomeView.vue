<template>
  <div class="home">
    <div class="home-header">
      <h1>📦 DocCollab</h1>
      <p class="subtitle">多人文档协作系统 · 轻量级版本容器管理</p>
    </div>

    <div class="actions">
      <el-input
        v-model="newProjectName"
        placeholder="输入新项目名称..."
        size="large"
        class="input-new"
        @keyup.enter="handleCreate"
        clearable
      />
      <el-button type="primary" size="large" @click="handleCreate" :disabled="!newProjectName.trim()">
        <el-icon><Plus /></el-icon>
        创建项目
      </el-button>
    </div>

    <div v-if="store.projects.length === 0" class="empty-state">
      <el-empty description="暂无项目，请创建第一个项目开始协作" />
    </div>

    <div v-else class="project-grid">
      <el-card
        v-for="project in store.projects"
        :key="project.id"
        class="project-card"
        shadow="hover"
        @click="enterProject(project.id)"
      >
        <div class="card-header">
          <el-icon :size="28" color="#409eff"><Folder /></el-icon>
          <h3>{{ project.name }}</h3>
        </div>
        <div class="card-info">
          <span>版本数：{{ project.containers.length }}</span>
          <span>更新于 {{ formatDate(project.updatedAt) }}</span>
        </div>
        <div class="card-actions" @click.stop>
          <el-button
            text
            type="danger"
            size="small"
            @click="handleDelete(project)"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { formatDate } from '@/utils/storage'
import { ElMessageBox, ElMessage } from 'element-plus'
import type { Project } from '@/types'

const router = useRouter()
const store = useProjectStore()
const newProjectName = ref('')

function handleCreate() {
  const name = newProjectName.value.trim()
  if (!name) return
  const project = store.addProject(name)
  newProjectName.value = ''
  ElMessage.success(`项目「${name}」创建成功`)
  enterProject(project.id)
}

function enterProject(id: string) {
  store.selectProject(id)
  router.push(`/project/${id}/documents`)
}

function handleDelete(project: Project) {
  ElMessageBox.confirm(
    `确定要删除项目「${project.name}」吗？此操作不可恢复。`,
    '确认删除',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    store.removeProject(project.id)
    ElMessage.success('项目已删除')
  }).catch(() => {})
}
</script>

<style scoped>
.home {
  max-width: 900px;
  margin: 60px auto;
  padding: 0 24px;
}

.home-header {
  text-align: center;
  margin-bottom: 36px;
}

.home-header h1 {
  font-size: 32px;
  margin-bottom: 8px;
}

.subtitle {
  color: #909399;
  font-size: 15px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.input-new {
  flex: 1;
}

.empty-state {
  margin-top: 40px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.project-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.project-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.card-header h3 {
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.card-actions {
  margin-top: 12px;
  text-align: right;
  border-top: 1px solid #ebeef5;
  padding-top: 8px;
}
</style>
