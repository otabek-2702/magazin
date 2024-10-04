import axios from 'axios'
import router from "@/router"
import { toast } from 'vue3-toastify';


axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*'


const axiosIns = axios.create({
  // You can add your headers here
  // ================================
  baseURL: import.meta.env.VITE_BASE_URL,

  // timeout: 1000,
  // headers: {'X-Custom-Header': 'foobar'}
})


// ℹ️ Add request interceptor to send the authorization header on each subsequent request after login
axiosIns.interceptors.request.use(config => {
  // Retrieve token from localStorage
  const token = localStorage.getItem('accessToken')


  // If token is found
  if (token) {
    // Get request headers and if headers is undefined assign blank object
    config.headers = config.headers || {}

    config.headers.Authorization = token ? `Bearer ${token}` : ''
  }



  // Return modified config
  return config
})

axiosIns.interceptors.response.use(response => {
  // Возвращаем ответ, если всё нормально
  return response
}, error => {
  if (error.response) {
    toast(error?.message, {
      theme: 'auto',
      type: 'error',
      dangerouslyHTMLString: true,
    });
  }
  if (!import.meta.env.VITE_DEV_MODE) {
    if (error.response && error.response.status === 404) {

      // Redirect to the 404 page
      // eslint-disable-next-line promise/no-promise-in-callback
      router.push({ path: '/404' }).then(() => {
        // Force reload after navigation
        window.location.reload()
      }).catch(err => {
        // Handle navigation error (if needed)
        console.error('Navigation error:', err)
        window.location.reload()
      })
    }


    if (error.response && error.response.status === 401) {

      // Redirect to the 404 page
      // eslint-disable-next-line promise/no-promise-in-callback
      router.push({ path: '/login' }).then(() => {

        localStorage.removeItem('userAbilities')
        localStorage.removeItem('userData')
        localStorage.removeItem('accessToken')

        // Force reload after navigation
        window.location.reload()
      }).catch(err => {
        // Handle navigation error (if needed)
        console.error('Navigation error:', err)
        window.location.reload()
      })
    }

    if (error.response && error.response.status === 403) {

      // Redirect to the forbidden page
      // eslint-disable-next-line promise/no-promise-in-callback
      router.push({ path: '/forbidden' }).then(() => {

        // Force reload after navigation
        window.location.reload()
      }).catch(err => {
        // Handle navigation error (if needed)
        console.error('Navigation error:', err)
        window.location.reload()
      })
    }
  }

  return Promise.reject(error)
})

export default axiosIns
