export default [
  {
    title: 'Статистика',
    to: { name: 'Statistics' },
    icon: { icon: 'mdi-chart-areaspline' },
    subject: 'Statistics',
    action: 'show'
  },
  {
    title: 'Управление системы',
    icon: { icon: 'mdi-application-cog' },
    children: [
      {
        title: 'Роли',
        to: { name: 'Roles' },
        // icon: { icon: 'mdi-shield-account' },
        subject: 'Roles',
        action: 'show'
      },
      {
        title: 'Сотрудники',
        to: { name: 'Employees' },
        // icon: { icon: 'mdi-account-tie' },
        subject: 'Users',
        action: 'show'
      },
    ]
  },
  {
    title: 'Управление товарами',
    icon: { icon: 'mdi-package-variant' },
    children: [
      
      // {
      //   title: 'Склад',
      //   to: { name: 'WareHouse' },
      // // icon: { icon: 'mdi-warehouse' },
      //   subject: 'WareHouse',
      //   action: 'show'
      // },
      {
        title: 'Категории',
        to: { name: 'Categories' },
        // icon: { icon: 'mdi-view-grid-plus-outline' },
        subject: 'Categories',
        action: 'show'
      },
      {
        title: 'Товары',
        to: { name: 'Products' },
        // icon: { icon: 'mdi-cube-outline' },
        subject: 'Products',
        action: 'show'
      },
      {
        title: 'Настройки',
        to: { name: 'Settings' },
        subject: 'Settings',
        action: 'show'
      },
    ]
  },
  {
    title: 'Поставщики',
    to: { name: 'Suppliers' },
    icon: { icon: 'mdi-human-dolly' },
    subject: 'Suppliers',
    action: 'show'
  },

  {
    title: 'Партии товаров',
    to: { name: 'Batches' },
    icon: { icon: 'mdi-package-variant-closed-plus' },
    subject: 'Batches',
    action: 'show'
  },

  
]
