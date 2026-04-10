const BASE_URL = 'http://localhost:8080';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const clienteService = {
  listar:      ()    => request('/api/clientes/todos'),
  buscar:      (n)   => request(`/api/clientes/buscar?nome=${encodeURIComponent(n)}`),
  buscarPorId: (id)  => request(`/api/clientes/${id}`),
  criar:       (d)   => request('/api/clientes', { method: 'POST', body: JSON.stringify(d) }),
  toggle:      (id)  => request(`/api/clientes/${id}/toggle`, { method: 'PATCH' }),
};

export const pedidoService = {
  listar:      ()         => request('/api/pedidos'),
  buscarPorId: (id)       => request(`/api/pedidos/${id}`),
  criar:       (d)        => request('/api/pedidos', { method: 'POST', body: JSON.stringify(d) }),
  status:      (id, s)    => request(`/api/pedidos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: s }) }),
};

export const roteiroService = {
  listar:       (data)       => request(`/api/roteiros${data ? `?data=${data}` : ''}`),
  buscarPorId:  (id)         => request(`/api/roteiros/${id}`),
  caminhoes:    ()           => request('/api/roteiros/caminhoes'),
  criarCaminhao:(d)          => request('/api/roteiros/caminhoes', { method: 'POST', body: JSON.stringify(d) }),
  criar:        (d)          => request('/api/roteiros', { method: 'POST', body: JSON.stringify(d) }),
  addPedido:    (rid, pid)   => request(`/api/roteiros/${rid}/pedidos`, { method: 'POST', body: JSON.stringify({ pedidoId: pid }) }),
  remPedido:    (rid, pid)   => request(`/api/roteiros/${rid}/pedidos/${pid}`, { method: 'DELETE' }),
};
