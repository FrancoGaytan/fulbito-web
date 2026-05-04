import { createRouter, createWebHistory } from 'vue-router'
import MatchesPage from '../views/MatchesPage.vue'
import CreateMatchPage from '../views/CreateMatchPage.vue'
import MatchDetailPage from '../views/MatchDetailPage.vue'
import GroupsPage from '../views/GroupsPage.vue'
import PlayersPage from '../views/PlayersPage.vue'
import PlayerDetailsPage from '../views/PlayerDetailsPage.vue'
import LoginPage from '../views/LoginPage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import ForgotPasswordPage from '../views/ForgotPasswordPage.vue'
import SpacesPage from '../views/SpacesPage.vue'
import { useAuth } from '../stores/auth'
import { useSpaces } from '../stores/spaces'

const routes = [
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/register', name: 'register', component: RegisterPage },
  { path: '/forgot', name: 'forgot', component: ForgotPasswordPage },
  { path: '/spaces', name: 'spaces', component: SpacesPage, meta: { requiresAuth: true } },
  { path: '/', name: 'matches', component: MatchesPage, meta: { requiresAuth: true, requiresSpace: true } },
  { path: '/matches/new', name: 'create-match', component: CreateMatchPage, meta: { requiresAuth: true, requiresSpace: true } },
  { path: '/match/:id', name: 'match-detail', component: MatchDetailPage, props: true, meta: { requiresAuth: true, requiresSpace: true } },
  { path: '/groups', name: 'groups', component: GroupsPage, meta: { requiresAuth: true, requiresSpace: true } },
  { path: '/players', name: 'players', component: PlayersPage, meta: { requiresAuth: true, requiresSpace: true } },
  { path: '/players/:id', name: 'player-detail', component: PlayerDetailsPage, props: true, meta: { requiresAuth: true, requiresSpace: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to) => {
  const auth = useAuth()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresSpace && auth.isAuthenticated) {
    const spaces = useSpaces()
    // Siempre esperar a que fetchSpaces termine antes de evaluar hasActiveSpace
    if (!spaces.loading) {
      await spaces.fetchSpaces()
    }
    if (!spaces.hasActiveSpace) {
      return { name: 'spaces' }
    }
  }
})

export default router