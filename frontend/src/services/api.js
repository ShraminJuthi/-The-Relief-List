const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK_DATA ?? 'true') === 'true'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers },
  })
  if (!response.ok) throw new Error(`API error ${response.status}`)
  return response.status === 204 ? null : response.json()
}

// Expected backend contract. Align these paths and payloads with Member 2 before integration.
export const api = {
  getRecords: () => request('/records'),
  getMatches: () => request('/matches'),
  getBeneficiaries: () => request('/beneficiaries'),
  uploadSource: (source, file) => {
    const body = new FormData()
    body.append('source', source)
    body.append('file', file)
    return request('/imports', { method: 'POST', body })
  },
  decideMatch: (matchId, decision) => request(`/matches/${matchId}/decision`, {
    method: 'POST', body: JSON.stringify({ decision }),
  }),
}
