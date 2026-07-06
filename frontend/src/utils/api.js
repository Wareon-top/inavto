import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: BASE, timeout: 8000 })

export async function getCars(filters = {}) {
  const { data } = await api.get('/cars', { params: filters })
  return data
}

export async function getCarById(id) {
  const { data } = await api.get(`/cars/${id}`)
  return data
}

export async function submitSelection(form) {
  const { data } = await api.post('/selections', form)
  return data
}

export async function getOrderById(id) {
  const { data } = await api.get(`/orders/${id}`)
  return data
}
