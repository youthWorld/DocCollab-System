import type { Project, Container } from '@/types'

const PROJECTS_KEY = 'doccollab_projects'

// ========== LocalStorage 封装 ==========

export function loadProjects(): Project[] {
	try {
		const raw = localStorage.getItem(PROJECTS_KEY)
		return raw ? JSON.parse(raw) : []
	} catch {
		return []
	}
}

export function saveProjects(projects: Project[]): void {
	localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
}

// ========== 项目操作 ==========

export function createProject(name: string): Project {
	const project: Project = {
		id: generateId(),
		name,
		containers: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	}
	const projects = loadProjects()
	projects.push(project)
	saveProjects(projects)
	return project
}

export function getProject(id: string): Project | undefined {
	return loadProjects().find(p => p.id === id)
}

export function deleteProject(id: string): void {
	const projects = loadProjects().filter(p => p.id !== id)
	saveProjects(projects)
}

// ========== 容器操作 ==========

export function createContainer(
	projectId: string,
	options: {
		label?: string
		description?: string
		parentId?: string
		branchName?: string
	} = {},
): Container | null {
	const projects = loadProjects()
	const project = projects.find(p => p.id === projectId)
	if (!project) return null

	// 找到最新的容器，复制其内容作为基础
	const latest = project.containers[project.containers.length - 1]

	const container: Container = {
		id: generateId(),
		projectId,
		version: `v1.${project.containers.length}`,
		label: options.label as Container['label'],
		description: options.description,
		customTags: [],
		parentId: options.parentId,
		branchName: options.branchName,
		files: latest ? JSON.parse(JSON.stringify(latest.files)) : [],
		documents: latest ? JSON.parse(JSON.stringify(latest.documents)) : [],
		createdAt: new Date().toISOString(),
	}

	project.containers.push(container)
	project.updatedAt = new Date().toISOString()
	saveProjects(projects)
	return container
}

export function getContainer(
	projectId: string,
	containerId: string,
): Container | undefined {
	const project = getProject(projectId)
	return project?.containers.find(c => c.id === containerId)
}

export function getLatestContainer(projectId: string): Container | undefined {
	const project = getProject(projectId)
	if (!project || project.containers.length === 0) return undefined
	return project.containers[project.containers.length - 1]
}

// ========== 文件操作 ==========

export function addFile(
	projectId: string,
	containerId: string,
	file: { name: string; type: string; size: number; data: string },
): boolean {
	const projects = loadProjects()
	const project = projects.find(p => p.id === projectId)
	if (!project) return false
	const container = project.containers.find(c => c.id === containerId)
	if (!container) return false

	container.files.push({
		id: generateId(),
		...file,
		uploadedAt: new Date().toISOString(),
	})
	project.updatedAt = new Date().toISOString()
	saveProjects(projects)
	return true
}

export function deleteFile(
	projectId: string,
	containerId: string,
	fileId: string,
): boolean {
	const projects = loadProjects()
	const project = projects.find(p => p.id === projectId)
	if (!project) return false
	const container = project.containers.find(c => c.id === containerId)
	if (!container) return false
	container.files = container.files.filter(f => f.id !== fileId)
	project.updatedAt = new Date().toISOString()
	saveProjects(projects)
	return true
}

// ========== 文档操作 ==========

export function saveDocument(
	projectId: string,
	containerId: string,
	doc: { id?: string; title: string; content: string },
): boolean {
	const projects = loadProjects()
	const project = projects.find(p => p.id === projectId)
	if (!project) return false
	const container = project.containers.find(c => c.id === containerId)
	if (!container) return false

	if (doc.id) {
		const existing = container.documents.find(d => d.id === doc.id)
		if (existing) {
			existing.title = doc.title
			existing.content = doc.content
			existing.updatedAt = new Date().toISOString()
		}
	} else {
		container.documents.push({
			id: generateId(),
			title: doc.title,
			content: doc.content,
			updatedAt: new Date().toISOString(),
		})
	}
	project.updatedAt = new Date().toISOString()
	saveProjects(projects)
	return true
}

// ========== 版本对比 ==========

export interface DiffResult {
	addedFiles: Array<{ name: string }>
	removedFiles: Array<{ name: string }>
	addedDocs: Array<{ title: string }>
	removedDocs: Array<{ title: string }>
	modifiedDocs: Array<{ title: string; oldContent: string; newContent: string }>
}

export function compareContainers(
	projectId: string,
	cid1: string,
	cid2: string,
): DiffResult | null {
	const project = getProject(projectId)
	if (!project) return null
	const c1 = project.containers.find(c => c.id === cid1)
	const c2 = project.containers.find(c => c.id === cid2)
	if (!c1 || !c2) return null

	const files1 = new Set(c1.files.map(f => f.name))
	const files2 = new Set(c2.files.map(f => f.name))

	const addedFiles = c2.files
		.filter(f => !files1.has(f.name))
		.map(f => ({ name: f.name }))
	const removedFiles = c1.files
		.filter(f => !files2.has(f.name))
		.map(f => ({ name: f.name }))

	const docs1 = new Map(c1.documents.map(d => [d.id, d]))
	const docs2 = new Map(c2.documents.map(d => [d.id, d]))

	const addedDocs: Array<{ title: string }> = []
	const removedDocs: Array<{ title: string }> = []
	const modifiedDocs: DiffResult['modifiedDocs'] = []

	for (const [id, d2] of docs2) {
		const d1 = docs1.get(id)
		if (!d1) {
			addedDocs.push({ title: d2.title || '未命名文档' })
		} else if (d1.content !== d2.content) {
			modifiedDocs.push({
				title: d2.title,
				oldContent: d1.content,
				newContent: d2.content,
			})
		}
	}
	for (const [id, d1] of docs1) {
		if (!docs2.has(id)) {
			removedDocs.push({ title: d1.title || '未命名文档' })
		}
	}

	return { addedFiles, removedFiles, addedDocs, removedDocs, modifiedDocs }
}

// ========== 版本变更明细 ==========

import type { VersionDiff } from '@/types'

/** 计算某个版本相比上一版本的变更明细（直接使用容器数据） */
export function getVersionChanges(
	containers: {
		id: string
		files: Array<{ name: string }>
		documents: Array<{ id: string; title: string; content: string }>
	}[],
	containerId: string,
): VersionDiff | null {
	const idx = containers.findIndex(c => c.id === containerId)
	if (idx < 0) return null

	const current = containers[idx]
	const previous = idx > 0 ? containers[idx - 1] : null

	if (!previous) {
		return {
			addedFiles: current.files.map(f => f.name),
			removedFiles: [],
			addedDocs: current.documents.map(d => d.title || '未命名文档'),
			removedDocs: [],
			modifiedDocs: [],
		}
	}

	const prevFileNames = new Set(previous.files.map(f => f.name))
	const currFileNames = new Set(current.files.map(f => f.name))

	const addedFiles = current.files
		.filter(f => !prevFileNames.has(f.name))
		.map(f => f.name)
	const removedFiles = previous.files
		.filter(f => !currFileNames.has(f.name))
		.map(f => f.name)

	const prevDocs = new Map(previous.documents.map(d => [d.id, d]))
	const currDocs = new Map(current.documents.map(d => [d.id, d]))

	const addedDocs: string[] = []
	const removedDocs: string[] = []
	const modifiedDocs: string[] = []

	for (const [id, d] of currDocs) {
		if (!prevDocs.has(id)) {
			addedDocs.push(d.title || '未命名文档')
		} else if (prevDocs.get(id)!.content !== d.content) {
			modifiedDocs.push(d.title || '未命名文档')
		}
	}
	for (const [id, d] of prevDocs) {
		if (!currDocs.has(id)) {
			removedDocs.push(d.title || '未命名文档')
		}
	}

	return { addedFiles, removedFiles, addedDocs, removedDocs, modifiedDocs }
}

// ========== 工具函数 ==========

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return bytes + ' B'
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
	return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleString('zh-CN')
}
