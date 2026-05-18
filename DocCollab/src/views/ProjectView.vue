<template>
  <AppLayout />
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import AppLayout from '@/components/AppLayout.vue'

const route = useRoute()
const router = useRouter()
const store = useProjectStore()

onMounted(() => {
  const projectId = route.params.id as string
  const project = store.projects.find(p => p.id === projectId)
  if (!project) {
    router.replace('/')
    return
  }
  store.selectProject(projectId)
})

watch(() => route.params.id, (id) => {
  if (id) {
    store.selectProject(id as string)
  }
})
</script>
