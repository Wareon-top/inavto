const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(BASE + path, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    if (!response.ok) throw new Error(`API ${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

function queryString(filters) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function getCars(filters = {}) {
  return request('/cars' + queryString(filters))
}

export async function getCarById(id) {
  return request(`/cars/${encodeURIComponent(id)}`)
}

export async function submitSelection(form) {
  return request('/selections', { method: 'POST', body: JSON.stringify(form) })
}

export async function getOrderById(id) {
  return request(`/orders/${encodeURIComponent(id)}`)
}
