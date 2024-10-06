import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import { isUserLoggedIn } from './utils'
import routes from '~pages'
import Login from "@/pages/login.vue"
import NotAuthorized from "@/pages/not-authorized.vue";
import DefaultLayoutWithVerticalNav from '@/layouts/default.vue';
import ability from "@/plugins/casl/ability";
import Forbidden from "@/pages/forbidden.vue";


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login,
    },
    {
      path: '/not-authorized',
      name: 'NotAuthorized',
      component: NotAuthorized,
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      component: Forbidden,
    },

    {
      path: '/',
      component: DefaultLayoutWithVerticalNav,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Index',
          redirect: { name: 'Statistics' }
        },
        {
          path: 'statistics',
          name: 'Statistics',
          component: () => import("@/pages/statistics.vue"),
          meta: {
            action: 'show',
            subject: 'Statistics',
          }
        },
        {
          path: 'roles',
          name: 'Roles',
          component: () => import("@/pages/roles.vue"),
          meta: {
            action: 'show',
            subject: 'Roles',
          }
        },
        {
          path: 'employees',
          name: 'Employees',
          component: () => import("@/pages/employees.vue"),
          meta: {
            action: 'show',
            subject: 'Users',
          }
        },
        {
          path: 'suppliers',
          name: 'Suppliers',
          component: () => import("@/pages/suppliers.vue"),
          meta: {
            action: 'show',
            subject: 'Suppliers',
          }
        },
        {
          path: 'ware-house',
          name: 'WareHouse',
          component: () => import("@/pages/ware-house.vue"),
          meta: {
            action: 'show',
            subject: 'WareHouse',
          }
        },
        {
          path: 'cateories',
          name: 'Categories',
          component: () => import("@/pages/categories.vue"),
          meta: {
            action: 'show',
            subject: 'Categories',
          }
        },
        {
          path: 'products',
          name: 'Products',
          component: () => import("@/pages/products.vue"),
          meta: {
            action: 'show',
            subject: 'Products',
          }
        },
        {
          path: 'product-variants',
          name: 'ProductVariants',
          component: () => import("@/pages/product-variants.vue"),
          meta: {
            action: 'show',
            subject: 'ProductVariants',
          }
        },
        {
          path: 'batches',
          name: 'Batches',
          component: () => import("@/pages/batches.vue"),
          meta: {
            action: 'show',
            subject: 'Batches',
          }
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import("@/pages/settings.vue"),
          meta: {
            action: 'show',
            subject: 'Settings',
          }
        },
      ],
    },
    ...setupLayouts(routes),
  ],
});


router.beforeEach((to, from, next) => {
  // Проверка, требуется ли аутентификация для этого маршрута
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const isLoggedIn = isUserLoggedIn();

    if (!isLoggedIn) {
      // Если пользователь не аутентифицирован, перенаправляем на страницу входа
      return next({ name: 'Login' });
    }
  }

  // Если пользователь аутентифицирован или маршрут не требует аутентификации,
  // проверяем права доступа на основе мета-полей
  if (to.meta && to.meta.action && to.meta.subject) {
    if (ability.can(to.meta.action, to.meta.subject)) {
      return next(); // Пользователь имеет нужные права
    } else {
      return next({ name: 'forbidden' }); // Перенаправление на страницу ошибки или входа
    }
  }

  // Если маршрут не требует дополнительных проверок, продолжаем переход
  next();
});


export default router
