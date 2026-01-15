import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'
import LandingPageView from '../views/LandingPageView.vue'
import AuthView from '../views/AuthView.vue'
import DashboardView from '../views/DashboardView.vue'
import CoursesView from '../views/CoursesView.vue'
import MarketplaceView from '../views/MarketplaceView.vue'
import CommunityView from '../views/CommunityView.vue'
import MentoringView from '../views/MentoringView.vue'
import DiscussionView from '../views/DiscussionView.vue'
import UserManagementView from '../views/admin/UserManagementView.vue'
import ManageCoursesView from '../views/creator/ManageCoursesView.vue'
import MentorScheduleView from '../views/creator/MentorScheduleView.vue'
import UnauthorizedView from '../views/UnauthorizedView.vue'
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    allowedRoles?: string[]
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { 
      path: '/', 
      name: 'landing', 
      component: LandingPageView,
      meta: { layout: 'landing' } // Layout khusus Landing Page
    },
    { 
      path: '/auth', 
      name: 'auth', 
      component: AuthView,
      meta: { layout: 'auth' } // Layout khusus Auth
    },
    // --- AREA MEMBER (Butuh Login) ---
    { 
      path: '/dashboard', 
      name: 'dashboard', 
      component: DashboardView,
      meta: { requiresAuth: true, layout: 'app' } 
    },
    { path: '/courses', name: 'courses', component: CoursesView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/marketplace', name: 'marketplace', component: MarketplaceView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/community', name: 'community', component: CommunityView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/mentoring', name: 'mentoring', component: MentoringView, meta: { requiresAuth: true, layout: 'app' } },
    { path: '/discussion', name: 'discussion', component: DiscussionView, meta: { requiresAuth: true, layout: 'app' } },
  
// --- CREATOR AREA (Hanya Instructor & Mentor) ---
    // Contoh halaman manage course
    { 
      path: '/my-courses',
      name: 'manage-courses',
      component: ManageCoursesView, // Lazy load
      meta: { 
        requiresAuth: true, 
        layout: 'app',
        allowedRoles: ['instructor', 'admin'] // <--- INI KUNCINYA
      } 
    },
    // Contoh halaman jadwal mentor
    { 
      path: '/mentor-schedule', 
      name: 'mentor-schedule', 
      component: MentorScheduleView, // Lazy load
      meta: { 
        requiresAuth: true, 
        layout: 'app',
        allowedRoles: ['mentor', 'admin'] 
      } 
    },

    // --- ADMIN AREA (Hanya Dewa) ---
    {
      path: '/admin/users',
      name: 'admin-users',
      component: UserManagementView, // Lazy load
      meta: { 
        requiresAuth: true, 
        layout: 'app', 
        allowedRoles: ['admin'] 
      }
    },

    // --- 404 / UNAUTHORIZED ---
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: UnauthorizedView, // Halaman simpel "Lu gak boleh masuk sini"
      meta: { layout: 'landing' }
    },
    // 1. Rute User buat ngelamar (Semua user login bisa akses)
    {
      path: '/apply-instructor',
      name: 'apply-instructor',
      component: () => import('../views/BecomeInstructorView.vue'),
      meta: { requiresAuth: true, layout: 'app' }
    },

    // 2. Rute Admin buat ngecek lamaran (Cuma Admin)
    {
      path: '/admin/applications',
      name: 'admin-applications',
      component: () => import('../views/admin/AdminApplicationsView.vue'),
      meta: { 
        requiresAuth: true, 
        layout: 'app', 
        allowedRoles: ['admin'] // <--- Penting!
      }
    }  
]
})


// --- THE ULTIMATE GUARD ---
router.beforeEach(async (to, _from, next) => {
  // 1. Cek Session User
  const { data: { session } } = await supabase.auth.getSession()
  
  // A. Kalau butuh login tapi gak ada session -> LEMPAR KE AUTH
  if (to.meta.requiresAuth && !session) {
    return next('/auth')
  }

  // B. Kalau udah login tapi mau ke Auth/Landing -> LEMPAR KE DASHBOARD
  if ((to.path === '/auth' || to.path === '/') && session) {
    return next('/dashboard')
  }

  // C. CEK ROLE (Bagian Paling Penting)
  if (to.meta.allowedRoles && session) {
    
    // Kita harus fetch role user dari DB karena session auth biasanya gak nyimpen data custom table realtime
    // (Bisa dioptimasi pake state management/pinia biar gak fetch terus2an, tapi ini cara paling aman)
    const { data: userRolesData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', session.user.id)

    // Mapping hasil query jadi array simple: ['student', 'instructor']
    const userRoles = userRolesData ? userRolesData.map((r: any) => r.roles.name) : []

    // Cek apakah user punya setidaknya SATU role yang diizinkan
    const allowedRoles = to.meta.allowedRoles ?? []
    const hasPermission = allowedRoles.some(role =>
    userRoles.includes(role)
)
    if (!hasPermission) {
      // Kalau gak punya izin, lempar ke halaman Unauthorized atau Dashboard
      return next('/unauthorized') 
    }
  }

  // Lolos semua pengecekan
  next()
})

export default router