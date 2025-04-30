import { createRouter, createWebHistory } from 'vue-router'

// Import components for routes
import HomeView from '../views/HomeView.vue'
import PublicNotesView from '../views/PublicNotesView.vue'
import NoteDetailView from '../views/NoteDetailView.vue'
import MyNotesView from '../views/MyNotesView.vue'; // Import the new view

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/notes', name: 'PublicNotes', component: PublicNotesView },
  { path: '/notes/:id', name: 'NoteDetail', component: NoteDetailView, props: true },
  // --- NEW ROUTE ---
  { path: '/my-notes', name: 'MyNotes', component: MyNotesView },
  // ... other potential routes
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router