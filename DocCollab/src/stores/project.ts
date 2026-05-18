import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, Container, ChangeRecord } from '@/types'
import {
	loadProjects,
	saveProjects,
	createProject,
	deleteProject,
	createContainer,
} from '@/utils/storage'

export const useProjectStore = defineStore('project', () => {
	// ========== State ==========
	const projects = ref<Project[]>(loadProjects())
	const currentProjectId = ref<string | null>(null)
	const currentContainerId = ref<string | null>(null)

	// ========== Getters ==========
	const currentProject = computed(
		() => projects.value.find(p => p.id === currentProjectId.value) ?? null,
	)

	const currentContainer = computed(
		() =>
			currentProject.value?.containers.find(
				c => c.id === currentContainerId.value,
			) ?? null,
	)

	const latestContainer = computed(() => {
		if (!currentProject.value || currentProject.value.containers.length === 0)
			return null
		return currentProject.value.containers[
			currentProject.value.containers.length - 1
		]
	})

	/** 当前是否在查看历史版本（非最新） */
	const isViewingHistory = computed(() => {
		if (!latestContainer.value || !currentContainerId.value) return false
		return currentContainerId.value !== latestContainer.value.id
	})

	/** 工作区容器：始终指向最新版本，所有写入操作的目标 */
	const workingContainer = computed(() => latestContainer.value)

	const changeRecords = computed((): ChangeRecord[] => {
		if (!currentProject.value) return []
		return [...currentProject.value.containers].reverse().map(c => ({
			containerId: c.id,
			version: c.version,
			label: c.label ?? '未标记',
			description: c.description ?? '无描述',
			createdAt: c.createdAt,
			fileCount: c.files.length,
			docCount: c.documents.length,
		}))
	})

	// ========== Actions ==========
	function addProject(name: string): Project {
		const p = createProject(name)
		projects.value = loadProjects()
		return p
	}

	function removeProject(id: string) {
		deleteProject(id)
		if (currentProjectId.value === id) {
			currentProjectId.value = null
			currentContainerId.value = null
		}
		projects.value = loadProjects()
	}

	function selectProject(id: string) {
		currentProjectId.value = id
		currentContainerId.value = null
		const p = projects.value.find(pr => pr.id === id)
		if (!p) return
		// 无容器：自动创建 v1.0 作为初始工作区
		if (p.containers.length === 0) {
			const c = createContainer(id, {
				label: '初始版本',
				description: '项目初始化，创建初始工作区',
			})
			if (c) {
				projects.value = loadProjects()
				currentContainerId.value = c.id
			}
		} else {
			currentContainerId.value = p.containers[p.containers.length - 1].id
		}
	}

	function selectContainer(containerId: string) {
		currentContainerId.value = containerId
	}

	function addContainer(
		options: {
			label?: string
			description?: string
			parentId?: string
			branchName?: string
		} = {},
	): Container | null {
		if (!currentProjectId.value) return null
		const c = createContainer(currentProjectId.value, options)
		if (c) {
			projects.value = loadProjects()
			currentContainerId.value = c.id
		}
		return c
	}

	function refresh() {
		projects.value = loadProjects()
	}

	return {
		projects,
		currentProjectId,
		currentContainerId,
		currentProject,
		currentContainer,
		latestContainer,
		workingContainer,
		isViewingHistory,
		changeRecords,
		addProject,
		removeProject,
		selectProject,
		selectContainer,
		addContainer,
		refresh,
	}
})
