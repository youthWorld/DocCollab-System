// ========== 核心数据类型 ==========

/** 版本标签枚举 */
export type ChangeLabel =
	| '初始版本'
	| '功能迭代'
	| 'Bug修复'
	| '文档完善'
	| '代码重构'

/** 版本变更明细 */
export interface VersionDiff {
	addedFiles: string[] // 新增的文件名
	removedFiles: string[] // 删除的文件名
	addedDocs: string[] // 新增的文档标题
	removedDocs: string[] // 删除的文档标题
	modifiedDocs: string[] // 内容有变化的文档标题
}

/** 文件条目 */
export interface FileItem {
	id: string
	name: string
	type: string // MIME type
	size: number // bytes
	data: string // base64
	uploadedAt: string // ISO date
}

/** 文档 */
export interface DocItem {
	id: string
	title: string
	content: string // HTML content from tiptap
	updatedAt: string // ISO date
}

/** 版本容器 */
export interface Container {
	id: string
	projectId: string
	version: string // e.g. "v1.0", "v1.1"
	label?: ChangeLabel // 修改标签 (v1.1+)
	description?: string // 修改描述 (v1.1+)
	customTags: string[] // 自定义标签 (v2.0+)
	parentId?: string // 分支来源容器ID (v2.0+)
	branchName?: string // 分支名称 (v2.0+)
	files: FileItem[]
	documents: DocItem[]
	createdAt: string // ISO date
}

/** 项目 */
export interface Project {
	id: string
	name: string
	containers: Container[]
	createdAt: string
	updatedAt: string
}

/** 变更记录（用于展示） */
export interface ChangeRecord {
	containerId: string
	version: string
	label: string
	description: string
	createdAt: string
	fileCount: number
	docCount: number
}

/** 版本对比结果 */
export interface DiffResult {
	addedFiles: string[]
	removedFiles: string[]
	modifiedDocs: Array<{
		docId: string
		title: string
		oldContent: string
		newContent: string
	}>
}
