export default [
  {
    title: 'Статистика',
    to: { name: 'Statistics' },
    icon: { icon: 'mdi-chart-areaspline' },
    subject: 'Statistics',
    action: 'show'
  },
  {
    title: 'Упр. системы',
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
        to: { name: 'Users' },
        // icon: { icon: 'mdi-account-tie' },
        subject: 'Users',
        action: 'show'
      },
      {
        title: 'Продавцы',
        to: { name: 'Persons' },
        // icon: { icon: 'mdi-account-tie' },
        subject: 'Persons',
        action: 'show'
      },
    ]
  },
  {
    title: 'Упр. складом',
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
        to: { name: 'InvoicesIncome' },
        subject: 'InvoicesIncome',
        action: 'show',
      },
      {
        title: 'Накладные о уходе',
        to: { name: 'InvoicesDeparture' },
        subject: 'InvoicesDeparture',
        action: 'show',
      },
    ]
  },
  {
    title: 'Упр. товарами',
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
        title: 'Вариации товаров',
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
    title: 'Упр. филиалами',
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
      {
        title: 'Накладные для витрины',
        to: { name: 'InvoicesWarehouse' },
        subject: 'InvoicesWarehouse',
        action: 'show'
      },
      {
        title: 'Витрина',
        to: { name: 'Showcases' },
        subject: 'Showcases',
        action: 'show'
      },
      {
        title: 'Расходы',
        to: { name: 'Safes' },
        subject: 'Safes',
        action: 'show'
      },
    ]
  },
  {
    title: 'Упр. кассами',
    icon: { icon: 'mdi-cash-register' },
    children: [
      {
        title: 'Список касс',
        to: { name: 'CashBoxes' },
        subject: 'CashBoxes',
        action: 'show'
      },
      {
        title: 'Расчётные чеки',
        to: { name: 'CashsRegister' },
        subject: 'CashsRegister',
        action: 'show'
      },

    ]
  },
  {
    title: 'Возвраты',
    to: { name: 'Returns' },
    icon: { icon: 'mdi-cash-refund' },
    subject: 'Refunds',
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
