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
    title: 'Управление складом',
    icon: { icon: 'mdi-warehouse' },
    children : [
      {
        title: 'Главный склад',
        to: { name: 'Stock' },
        subject: 'Stock',
        action: 'show',
      },
      {
        title: 'Накладные о приходе',
        to: { name: 'IncomeInvoices' },
        subject: 'IncomeInvoices',
        action: 'show',
      },
      {
        title: 'Накладные о уходе',
        to: { name: 'DepartureInvoices' },
        subject: 'DepartureInvoices',
        action: 'show',
      },
    ]
  },
  {
    title: 'Управление товарами',
    icon: { icon: 'mdi-package-variant' },
    children: [
      {
        title: 'Товары',
        to: { name: 'Products' },
        // icon: { icon: 'mdi-cube-outline' },
        subject: 'Products',
        action: 'show'
      },
      {
        title: 'Вариации товара',
        to: { name: 'ProductVariants' },
        // icon: { icon: 'mdi-cube-outline' },
        subject: 'ProductVariants',
        action: 'show'
      },
      {
        title: 'Категории',
        to: { name: 'Categories' },
        // icon: { icon: 'mdi-view-grid-plus-outline' },
        subject: 'Categories',
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
    title: 'Управление филиалами',
    icon: { icon: 'mdi-domain' },
    children: [
      {
        title: 'Филиалы',
        to: { name: 'Branches' },
        subject: 'Branches',
        action: 'show'
      },
      {
        title: 'Склад филиала',
        to: { name: 'BranchesWareHouse' },
        subject: 'BranchesWareHouse',
        action: 'show'
      },
    ]
  },
  {
    title: 'Накладные для витрины',
    to: { name: 'ShowcaseInvoices' },
    icon: { icon: 'mdi-clipboard-list' },
    subject: 'ShowcaseInvoices',
    action: 'show'
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
