import { setupLayouts } from "virtual:generated-layouts";
import { createRouter, createWebHistory } from "vue-router";
import { isUserLoggedIn } from "./utils";
import routes from "~pages";
import Login from "@/pages/login.vue";
import NotAuthorized from "@/pages/not-authorized.vue";
import DefaultLayoutWithVerticalNav from "@/layouts/default.vue";
import ability from "@/plugins/casl/ability";
import Forbidden from "@/pages/forbidden.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: Login,
    },
    {
      path: "/not-authorized",
      name: "NotAuthorized",
      component: NotAuthorized,
    },
    {
      path: "/forbidden",
      name: "forbidden",
      component: Forbidden,
    },

    {
      path: "/",
      component: DefaultLayoutWithVerticalNav,
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "Index",
          redirect: { name: "Statistics" },
        },
        {
          path: "statistics",
          name: "Statistics",
          component: () => import("@/pages/statistics.vue"),
          meta: {
            action: "show",
            subject: "Statistics",
          },
        },
        // system
        {
          path: "roles",
          name: "Roles",
          component: () => import("@/pages/roles.vue"),
          meta: {
            action: "show",
            subject: "Roles",
          },
        },
        {
          path: "employees",
          name: "Employees",
          component: () => import("@/pages/employees.vue"),
          meta: {
            action: "show",
            subject: "Users",
          },
        },
        // stock
        {
          path: "stock",
          name: "Stock",
          component: () => import("@/pages/stock.vue"),
          meta: {
            action: "show",
            subject: "Stock",
          },
        },
        {
          path: "invoices",
          name: "IncomeInvoices",
          component: () => import("@/pages/invoices.vue"),
          meta: {
            action: "show",
            subject: "IncomeInvoices",
          },
        },
        {
          path: "invoices",
          name: "DepartureInvoices",
          component: () => import("@/pages/branches/invoices.vue"),
          meta: {
            action: "show",
            subject: "DepartureInvoices",
          },
        },
        // products
        {
          path: "products",
          name: "Products",
          component: () => import("@/pages/products.vue"),
          meta: {
            action: "show",
            subject: "Products",
          },
        },
        {
          path: "product-variants",
          name: "ProductVariants",
          component: () => import("@/pages/product-variants.vue"),
          meta: {
            action: "show",
            subject: "ProductVariants",
          },
        },
        {
          path: "cateories",
          name: "Categories",
          component: () => import("@/pages/categories.vue"),
          meta: {
            action: "show",
            subject: "Categories",
          },
        },
        {
          path: "settings",
          name: "Settings",
          component: () => import("@/pages/settings.vue"),
          meta: {
            action: "show",
            subject: "Settings",
          },
        },
        // branches
        {
          path: "branches/",
          children: [
            {
              path: "",
              name: "Branches",
              component: () => import("@/pages/branches/index.vue"),
              meta: {
                action: "show",
                subject: "Branches",
              },
            },
            {
              path: "ware-house",
              name: "BranchesWareHouse",
              component: () => import("@/pages/branches/ware-house.vue"),
              meta: {
                action: "show",
                subject: "BranchesWareHouse",
              },
            },
          ],
        },
        // invoices
        {
          path: 'showcase-invoices',
          name: 'ShowcaseInvoices',
          component: () => import("@/pages/branches/showcase-invoices.vue"),
          meta: {
            action: 'show',
            subject: 'ShowcaseInvoices',
          }
        },
        // suppliers
        {
          path: "suppliers",
          name: "Suppliers",
          component: () => import("@/pages/suppliers.vue"),
          meta: {
            action: "show",
            subject: "Suppliers",
          },
        },
        // batches
        {
          path: "batches",
          name: "Batches",
          component: () => import("@/pages/batches.vue"),
          meta: {
            action: "show",
            subject: "Batches",
          },
        },
      ],
    },
    ...setupLayouts(routes),
  ],
});

router.beforeEach((to, from, next) => {
  // Проверка, требуется ли аутентификация для этого маршрута
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    const isLoggedIn = isUserLoggedIn();

    if (!isLoggedIn) {
      // Если пользователь не аутентифицирован, перенаправляем на страницу входа
      return next({ name: "Login" });
    }
  }

  // Если пользователь аутентифицирован или маршрут не требует аутентификации,
  // проверяем права доступа на основе мета-полей
  if (to.meta && to.meta.action && to.meta.subject) {
    if (ability.can(to.meta.action, to.meta.subject)) {
      return next(); // Пользователь имеет нужные права
    } else {
      return next({ name: "forbidden" }); // Перенаправление на страницу ошибки или входа
    }
  }

  // Если маршрут не требует дополнительных проверок, продолжаем переход
  next();
});

export default router;
