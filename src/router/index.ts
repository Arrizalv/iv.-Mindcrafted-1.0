import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

// Pastikan path import ini sesuai dengan folder kamu
import LandingPageView from '../views/LandingPageView.vue'
import AuthView from '../views/AuthView.vue'
import DashboardView from '../views/DashboardView.vue'
import CoursesView from '../views/CoursesView.vue'
import MarketplaceView from '../views/MarketplaceView.vue'
import CommunityView from '../views/CommunityView.vue'
import MentoringView from '../views/MentoringView.vue'
import DiscussionView from '../views/DiscussionView.vue'

// Lazy Load untuk halaman berat/admin
const ManageCoursesView = () => import('../views/creator/ManageCoursesView.vue')
const MentorScheduleView = () => import('../views/creator/MentorScheduleView.vue')
const UserManagementView = () => import('../views/admin/UserManagementView.vue')
const UnauthorizedView = () => import('../views/UnauthorizedView.vue')
const BecomeInstructorView = () => import('../views/BecomeInstructorView.vue')
const AdminApplicationsView = () => import('../views/admin/AdminApplicationsView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landing', component: LandingPageView, meta: { layout: 'landing' } },
    { path: '/auth', name: 'auth', component: AuthView, meta: { layout: 'auth' } },
    
    // Member Area
    { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/courses', name: 'courses', component: CoursesView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/marketplace', name: 'marketplace', component: MarketplaceView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/community', name: 'community', component: CommunityView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/mentoring', name: 'mentoring', component: MentoringView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/discussion', name: 'discussion', component: DiscussionView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/apply-instructor', name: 'apply-instructor', component: BecomeInstructorView, meta: { requiresAuth: true, layout: 'app' } },

    // Creator Area
    { path: '/my-courses', name: 'manage-courses', component: ManageCoursesView, meta: { requiresAuth: true, layout: 'app', allowedRoles: ['instructor', 'admin'] } },
    { path: '/mentor-schedule', name: 'mentor-schedule', component: MentorScheduleView, meta: { requiresAuth: true, layout: 'app', allowedRoles: ['mentor', 'admin'] } },

    // Admin Area
    { path: '/admin/users', name: 'admin-users', component: UserManagementView, meta: { requiresAuth: true, layout: 'app', allowedRoles: ['admin'] } },
    { path: '/admin/applications', name: 'admin-applications', component: AdminApplicationsView, meta: { requiresAuth: true, layout: 'app', allowedRoles: ['admin'] } },

    // Error
    { path: '/unauthorized', name: 'unauthorized', component: UnauthorizedView, meta: { layout: 'landing' } }
  ]
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()

  if (to.meta.requiresAuth && !session) return next('/auth')
  if ((to.path === '/auth' || to.path === '/') && session) return next('/dashboard')

  if (to.meta.allowedRoles && session) {
    const { data: userRolesData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', session.user.id)

    const userRoles = userRolesData ? userRolesData.map((r) => r.roles.name) : []
    const hasPermission = to.meta.allowedRoles.some((role) => userRoles.includes(role))

    if (!hasPermission) return next('/unauthorized') 
  }
  next()
})

export default router