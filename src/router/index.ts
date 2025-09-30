import { createRouter, createWebHistory } from 'vue-router'
import MatchesPage from '../views/MatchesPage.vue'
import MatchDetailPage from '../views/MatchDetailPage.vue'
import GroupsPage from '../views/GroupsPage.vue'
import PlayersPage from '../views/PlayersPage.vue'
import PlayerDetailsPage from '../views/PlayerDetailsPage.vue'
import LoginPage from '../views/LoginPage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import ForgotPasswordPage from '../views/ForgotPasswordPage.vue'
import { useAuth } from '../stores/auth'

const routes = [
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/register', name: 'register', component: RegisterPage },
  { path: '/forgot', name: 'forgot', component: ForgotPasswordPage },
  { path: '/', name: 'matches', component: MatchesPage, meta: { requiresAuth: true } },
  { path: '/match/:id', name: 'match-detail', component: MatchDetailPage, props: true, meta: { requiresAuth: true } },
  { path: '/groups', name: 'groups', component: GroupsPage, meta: { requiresAuth: true } },
  { path: '/players', name: 'players', component: PlayersPage, meta: { requiresAuth: true } },
  { path: '/players/:id', name: 'player-detail', component: PlayerDetailsPage, props: true, meta: { requiresAuth: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const auth = useAuth()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router