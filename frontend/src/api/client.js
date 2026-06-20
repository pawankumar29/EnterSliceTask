const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = body?.error || `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return body;
};

export const api = {
  listTickets: (params, options) =>
    request(`/tickets?${new URLSearchParams(params)}`, options),
  getTicket: (id, options) => request(`/tickets/${id}`, options),
  createTicket: (payload) => request('/tickets', { method: 'POST', body: JSON.stringify(payload) }),
  updateStatus: (id, status) => request(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assignTicket: (id, assignedAgentId) =>
    request(`/tickets/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assignedAgentId }) }),
  addComment: (id, payload) => request(`/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify(payload) }),
  stats: (options) => request('/dashboard/stats', options),
  agents: (options) => request('/agents', options),
};
