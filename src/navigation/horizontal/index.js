export default [
  {
    title: 'Home',
    to: { name: 'Index' },
    icon: { icon: 'bx-home-alt' },
    subject:'post',
    action:'create'
  },
  {
    title: 'Roles',
    to: {name: 'Role'},
    icon: {icon: 'bx-shield-x'},
    subject:'roles',
    action:'show'
  },
  {
    title: 'Candidates',
    to: {name: 'Candidate'},
    icon: {icon: 'bx-child'},
    subject:'candidate',
    action:'show'
  },
]


