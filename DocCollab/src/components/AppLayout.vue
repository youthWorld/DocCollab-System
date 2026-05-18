<template>
  <el-container class="layout">
    <el-header class="header">
      <div class="header-left">
        <el-button text @click="$router.push('/')">
          <el-icon>
            <HomeFilled />
          </el-icon>
          <span class="logo-text">DocCollab</span>
        </el-button>
      </div>
      <div class="header-center" v-if="store.currentProject">
        <el-breadcrumb separator=">">
          <el-breadcrumb-item :to="{ path: '/' }">项目列表</el-breadcrumb-item>
          <el-breadcrumb-item>{{ store.currentProject.name }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right" v-if="store.currentProject">
        <el-select :model-value="store.currentContainerId" @change="handleVersionChange" placeholder="选择版本" size="default" class="version-select" popper-class="version-popper">
          <el-option v-for="c in store.currentProject.containers.slice().reverse()" :key="c.id" :label="`${c.version} · ${c.label ?? '未标记'}`" :value="c.id">
            <div class="version-option">
              <span class="version-tag">{{ c.version }}</span>
              <el-tag :type="getLabelType(c.label)" size="small" effect="plain">
                {{ c.label ?? '未标记' }}
              </el-tag>
              <span class="version-date">{{ formatShortDate(c.createdAt) }}</span>
            </div>
          </el-option>
        </el-select>
        <el-tag v-if="store.currentContainer && store.currentContainer.id === store.latestContainer?.id" type="success" effect="dark" size="small" style="margin-left: 8px">
          最新
        </el-tag>
        <el-tag v-else-if="store.currentContainer" type="warning" effect="dark" size="small" style="margin-left: 8px">
          历史
        </el-tag>
      </div>
    </el-header>
    <el-container class="main-area">
      <!-- 侧边栏 -->
      <el-aside v-if="showSidebar" width="220px" class="sidebar">
        <el-menu :default-active="activeMenu" router :router-link-props="{ exact: false }" class="sidebar-menu">
          <el-menu-item index="documents">
            <el-icon>
              <Document />
            </el-icon>
            <span>文档编辑</span>
          </el-menu-item>
          <el-menu-item index="files">
            <el-icon>
              <FolderOpened />
            </el-icon>
            <span>资源文件</span>
          </el-menu-item>
          <el-menu-item index="history">
            <el-icon>
              <Clock />
            </el-icon>
            <span>变更记录</span>
          </el-menu-item>
          <el-menu-item index="compare">
            <el-icon>
              <Switch />
            </el-icon>
            <span>版本对比</span>
          </el-menu-item>
        </el-menu>

        <!-- 版本操作区 -->
        <div class="sidebar-footer" v-if="store.currentProject">
          <el-divider style="margin: 8px 0" />
          <div style="padding: 0 16px">
            <el-button type="primary" size="small" style="width: 100%" @click="showVersionDialog = true">
              <el-icon>
                <Plus />
              </el-icon>
              保存新版本
            </el-button>
          </div>
        </div>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <!-- 保存版本对话框 -->
  <el-dialog v-model="showVersionDialog" title="保存新版本" width="480px" destroy-on-close>
    <el-form :model="versionForm" label-position="top">
      <el-form-item label="版本标签" required>
        <el-select v-model="versionForm.label" placeholder="选择此版本的目的" style="width: 100%">
          <el-option label="🎯 初始版本" value="初始版本" />
          <el-option label="🚀 功能迭代" value="功能迭代" />
          <el-option label="🐛 Bug修复" value="Bug修复" />
          <el-option label="📝 文档完善" value="文档完善" />
          <el-option label="🔧 代码重构" value="代码重构" />
        </el-select>
      </el-form-item>
      <el-form-item label="版本说明" required>
        <el-input v-model="versionForm.description" type="textarea" :rows="3" placeholder="请描述本次修改的内容..." maxlength="500" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showVersionDialog = false">取消</el-button>
      <el-button type="primary" @click="saveNewVersion" :disabled="!canSave">
        保存版本
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/project'

const route = useRoute()
const store = useProjectStore()

const showVersionDialog = ref(false)
const versionForm = ref({ label: '', description: '' })

const showSidebar = computed(() => route.path !== '/')
const activeMenu = computed(() => route.name as string ?? 'documents')

const canSave = computed(() =>
  versionForm.value.label !== '' && versionForm.value.description.trim().length >= 2
)

const labelTypeMap: Record<string, string> = {
  '初始版本': 'success',
  '功能迭代': 'primary',
  'Bug修复': 'danger',
  '文档完善': 'info',
  '代码重构': 'warning',
  '未标记': 'info'
}

function getLabelType(label?: string) {
  return labelTypeMap[label ?? '未标记'] ?? 'info'
}

function formatShortDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function handleVersionChange(containerId: string) {
  store.selectContainer(containerId)
}

function saveNewVersion() {
  if (!canSave.value) return
  store.addContainer({
    label: versionForm.value.label,
    description: versionForm.value.description.trim()
  })
  showVersionDialog.value = false
  versionForm.value = { label: '', description: '' }
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  height: 56px;
}

.header-left .logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
  margin-left: 6px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.main-area {
  height: calc(100vh - 56px);
}

.sidebar {
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}

.sidebar-footer {
  padding-bottom: 16px;
}

.content {
  background: #f5f7fa;
  padding: 24px;
  overflow-y: auto;
}

.version-select {
  width: 240px;
}

.header-right {
  display: flex;
  align-items: center;
}
</style>

<style>
.version-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-option .version-tag {
  font-weight: 600;
  color: #303133;
  min-width: 36px;
}

.version-option .version-date {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}
</style>
