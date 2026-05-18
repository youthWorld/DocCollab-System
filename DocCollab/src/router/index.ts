import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{
			path: '/',
			name: 'home',
			component: () => import('@/views/HomeView.vue'),
		},
		{
			path: '/project/:id',
			component: () => import('@/views/ProjectView.vue'),
			children: [
				{
					path: '',
					name: 'project-redirect',
					redirect: { name: 'documents' },
				},
				{
					path: 'documents',
					name: 'documents',
					component: () => import('@/views/DocumentsView.vue'),
				},
				{
					path: 'files',
					name: 'files',
					component: () => import('@/views/FilesView.vue'),
				},
				{
					path: 'history',
					name: 'history',
					component: () => import('@/views/HistoryView.vue'),
				},
				{
					path: 'compare',
					name: 'compare',
					component: () => import('@/views/CompareView.vue'),
				},
			],
		},
	],
})

export default router
