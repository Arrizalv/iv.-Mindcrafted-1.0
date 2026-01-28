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
import AiChatView from '../views/AiChatView.vue'

// Lazy Load untuk halaman berat/admin
const ManageCoursesView = () => import('../views/creator/ManageCoursesView.vue')
const MentorScheduleView = () => import('../views/creator/MentorScheduleView.vue')
const UserManagementView = () => import('../views/admin/UserManagementView.vue')
const UnauthorizedView = () => import('../views/UnauthorizedView.vue')
const BecomeInstructorView = () => import('../views/BecomeInstructorView.vue')
const AdminApplicationsView = () => import('../views/admin/AdminApplicationsView.vue')
const AdminCoursesView = () => import('../views/admin/AdminCoursesView.vue')
const MentorProfileView = () => import('../views/creator/MentorProfileView.vue')
const ManageServicesView = () => import('../views/creator/ManageServicesView.vue')
const ServiceDetailView = () => import('../views/ServiceDetailView.vue')
const CreatorDashboardView = () => import('../views/creator/CreatorDashboardView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landing', component: LandingPageView, meta: { layout: 'landing' } },
    { path: '/auth', name: 'auth', component: AuthView, meta: { layout: 'auth' } },


    { path: '/course/:id', name: 'course-detail', component: () => import('../views/CourseDetailView.vue'),meta: { layout: 'app' } },

    // Member Area
    { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/ai-chat', name: 'ai-chat', component: AiChatView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/courses', name: 'courses', component: CoursesView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/course/:id', name: 'course-detail', component: () => import('../views/CourseDetailView.vue'),meta: { layout: 'app' } },
    { path: '/marketplace', name: 'marketplace', component: MarketplaceView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/community', name: 'community', component: CommunityView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/mentoring', name: 'mentoring', component: MentoringView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/discussion', name: 'discussion', component: DiscussionView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/apply-instructor', name: 'apply-instructor', component: BecomeInstructorView, meta: { requiresAuth: true, layout: 'app' } },
    
    // Creator Area
    { path: '/creator-dashboard', name: 'creator-dashboard', component: CreatorDashboardView, meta: { requiresAuth: true, layout: 'app', allowedRoles: ['instructor', 'mentor', 'freelancer', 'admin'] } },
    { path: '/my-courses', name: 'manage-courses', component: ManageCoursesView, meta: { requiresAuth: true, layout: 'app', allowedRoles: ['instructor', 'admin'] } },
    { path: '/mentor-schedule', name: 'mentor-schedule', component: MentorScheduleView, meta: { requiresAuth: true, layout: 'app', allowedRoles: ['mentor', 'admin'] } },
    { path: '/mentor-profile', name: 'mentor-profile', component: MentorProfileView, meta: { requiresAuth: true, layout: 'app', allowedRoles: ['mentor', 'admin'] } },
    { path: '/instructor/course/:id/edit', name: 'edit-course', component: () => import('../views/creator/EditCourseView.vue'), meta: { requiresAuth: true, layout: 'app', allowedRoles: ['instructor', 'admin'] } },
    { path: '/my-services', name: 'manage-services', component: ManageServicesView, meta: { requiresAuth: true, layout: 'app', allowedRoles: ['freelancer', 'admin'] } },
    { path: '/service/:id', name: 'service-detail', component: ServiceDetailView, meta: { requiresAuth: true, layout: 'app' } },

    // Admin Area
    { path: '/admin/users', name: 'admin-users', component: UserManagementView, meta: { requiresAuth: true, layout: 'app', allowedRoles: ['admin'] } },
    { path: '/admin/applications', name: 'admin-applications', component: AdminApplicationsView, meta: { requiresAuth: true, layout: 'app', allowedRoles: ['admin'] } },
    { path: '/admin/courses', name: 'admin-courses', component: AdminCoursesView, meta: { requiresAuth: true, layout: 'app', allowedRoles: ['admin'] } },
    
    // Error
    { path: '/unauthorized', name: 'unauthorized', component: UnauthorizedView, meta: { layout: 'landing' } }
  ]
})

// Navigation Guard
// PERBAIKAN 1: Ganti 'from' jadi '_from' karena tidak dipakai
router.beforeEach(async (to, _from, next) => {
  const { data: { session } } = await supabase.auth.getSession()

  if (to.meta.requiresAuth && !session) return next('/auth')
  if ((to.path === '/auth' || to.path === '/') && session) return next('/dashboard')

  // PERBAIKAN 2: Definisikan tipe untuk meta agar TypeScript tau ada 'allowedRoles'
  // Kita casting to.meta menjadi tipe yang memiliki allowedRoles
  const allowedRoles = to.meta.allowedRoles as string[] | undefined

  if (allowedRoles && session) {
    const { data: userRolesData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', session.user.id)

    // PERBAIKAN 3: Kasih tipe 'any' ke parameter 'r' biar TS ga bingung baca struktur join Supabase
    const userRoles = userRolesData 
      ? userRolesData.map((r: any) => r.roles?.name) 
      : []

    // PERBAIKAN 4: Kasih tipe string ke parameter 'role'
    const hasPermission = allowedRoles.some((role: string) => userRoles.includes(role))

    if (!hasPermission) return next('/unauthorized') 
  }
  next()
})

export default router