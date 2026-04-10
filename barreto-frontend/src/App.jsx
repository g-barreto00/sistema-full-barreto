import { useState, useEffect, useCallback } from "react";

// ─── API Service Layer ────────────────────────────────────────────────────────
const BASE = "http://localhost:8080";

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

const api = {
  bairros: {
    listar: () => req("/api/bairros"),
    criar: (nome) => req("/api/bairros", { method: "POST", body: JSON.stringify({ nome }) }),
    deletar: (id) => req(`/api/bairros/${id}`, { method: "DELETE" }),
  },
  estoque: {
    listar: () => req("/api/estoque"),
    repor: (produto, quantidade) => req("/api/estoque/repor", { method: "POST", body: JSON.stringify({ produto, quantidade }) }),
  },
  clientes: {
    listar: () => req("/api/clientes/todos"),
    buscar: (q) => req(`/api/clientes/buscar?q=${encodeURIComponent(q)}`),
    buscarPorId: (id) => req(`/api/clientes/${id}`),
    criar: (d) => req("/api/clientes", { method: "POST", body: JSON.stringify(d) }),
    toggle: (id) => req(`/api/clientes/${id}/toggle`, { method: "PATCH" }),
  },
  pedidos: {
    listar: () => req("/api/pedidos"),
    buscarPorId: (id) => req(`/api/pedidos/${id}`),
    criar: (d) => req("/api/pedidos", { method: "POST", body: JSON.stringify(d) }),
    status: (id, status) =>
      req(`/api/pedidos/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },
  roteiros: {
    listar: (data) => req(`/api/roteiros${data ? `?data=${data}` : ""}`),
    buscarPorId: (id) => req(`/api/roteiros/${id}`),
    caminhoes: () => req("/api/roteiros/caminhoes"),
    criarCaminhao: (d) => req("/api/roteiros/caminhoes", { method: "POST", body: JSON.stringify(d) }),
    criar: (d) => req("/api/roteiros", { method: "POST", body: JSON.stringify(d) }),
    addPedido: (rid, pid) =>
      req(`/api/roteiros/${rid}/pedidos`, { method: "POST", body: JSON.stringify({ pedidoId: pid }) }),
    remPedido: (rid, pid) => req(`/api/roteiros/${rid}/pedidos/${pid}`, { method: "DELETE" }),
    finalizar: (id, pedidosEntregues) => req(`/api/roteiros/${id}/finalizar`, { method: "PATCH", body: JSON.stringify({ pedidosEntregues }) }),
  },
};

// ─── useFetch Hook ─────────────────────────────────────────────────────────────
function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await fetcher()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { data, loading, error, refetch: run };
}

// ─── Design System / Tokens ───────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --primary: #00629e;
    --primary-dim: #00568b;
    --primary-light: #cfe5ff;
    --primary-mid: #b5d8ff;
    --error: #9f403d;
    --error-light: #fe8983;
    --error-bg: rgba(159,64,61,0.08);
    --bg: #f7f9fb;
    --surface: #ffffff;
    --surface-low: #f0f4f7;
    --surface-mid: #e8eff3;
    --surface-high: #e1e9ee;
    --surface-highest: #d9e4ea;
    --text: #2a3439;
    --text-sec: #5c5f64;
    --text-muted: #717c82;
    --border: rgba(160,180,190,0.25);
    --border-med: rgba(160,180,190,0.45);
    --green: #16a34a;
    --green-bg: #dcfce7;
    --amber: #d97706;
    --amber-bg: #fef3c7;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --sidebar-w: 256px;
    --topbar-h: 64px;
    --shadow-sm: 0 1px 3px rgba(42,52,57,0.06), 0 1px 2px rgba(42,52,57,0.04);
    --shadow-md: 0 4px 12px rgba(42,52,57,0.08);
    --shadow-lg: 0 12px 32px rgba(42,52,57,0.1);
    font-size: 14px;
  }

  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); }
  h1, h2, h3, .headline { font-family: 'Manrope', sans-serif; }

  .icon {
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    font-size: 20px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    user-select: none;
  }
  .icon.filled { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
  .icon.sm { font-size: 16px; }
  .icon.lg { font-size: 24px; }

  /* ── Sidebar ── */
  .sidebar {
    position: fixed; left: 0; top: 0; width: var(--sidebar-w);
    height: 100vh; background: #f1f5f9; display: flex;
    flex-direction: column; padding: 16px; z-index: 50;
    border-right: 1px solid var(--border);
  }
  .sidebar-logo { display: flex; align-items: center; gap: 10px; padding: 8px 4px; margin-bottom: 24px; }
  .sidebar-logo-icon {
    width: 36px; height: 36px; background: var(--primary); border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center; color: white;
  }
  .sidebar-logo h1 { font-size: 20px; font-weight: 800; color: #075985; font-family: 'Manrope', sans-serif; }
  .sidebar-logo p { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-top: 1px; }
  .nav-link {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    border-radius: var(--radius-sm); color: var(--text-sec); font-size: 13px;
    font-weight: 500; cursor: pointer; transition: all 0.15s; text-decoration: none;
    border: none; background: none; width: 100%; text-align: left;
  }
  .nav-link:hover { background: rgba(255,255,255,0.6); color: #0369a1; }
  .nav-link.active {
    background: white; color: #0369a1; font-weight: 700;
    box-shadow: var(--shadow-sm); transform: translateX(2px);
  }
  .sidebar-divider { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
  .btn-new-order {
    width: 100%; padding: 10px; border-radius: var(--radius-sm); border: none;
    background: linear-gradient(135deg, var(--primary), var(--primary-dim));
    color: white; font-weight: 600; font-size: 13px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    box-shadow: var(--shadow-sm); margin-top: 8px;
    transition: box-shadow 0.15s, transform 0.1s;
  }
  .btn-new-order:hover { box-shadow: var(--shadow-md); }
  .btn-new-order:active { transform: scale(0.98); }

  /* ── Topbar ── */
  .topbar {
    position: fixed; right: 0; top: 0; left: var(--sidebar-w);
    height: var(--topbar-h); background: rgba(255,255,255,0.85);
    backdrop-filter: blur(16px); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px; z-index: 40; box-shadow: var(--shadow-sm);
  }
  .search-wrap { position: relative; width: 360px; }
  .search-wrap .icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
  .search-input {
    width: 100%; padding: 8px 16px 8px 38px; border-radius: 999px;
    border: 1.5px solid transparent; background: var(--surface-high);
    font-size: 13px; outline: none; color: var(--text); transition: border-color 0.15s;
    font-family: 'Inter', sans-serif;
  }
  .search-input:focus { border-color: rgba(0,98,158,0.3); background: white; }
  .topbar-right { display: flex; align-items: center; gap: 20px; }
  .icon-btn {
    width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; background: none; border: none; cursor: pointer;
    color: var(--text-sec); transition: background 0.15s; position: relative;
  }
  .icon-btn:hover { background: var(--surface-low); }
  .notif-dot {
    position: absolute; top: 6px; right: 6px; width: 7px; height: 7px;
    background: var(--error); border-radius: 50%; border: 2px solid white;
  }
  .topbar-divider { width: 1px; height: 28px; background: var(--border-med); }
  .user-info { text-align: right; }
  .user-info p { font-size: 13px; font-weight: 600; font-family: 'Manrope', sans-serif; }
  .user-info span { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; }
  .avatar {
    width: 36px; height: 36px; border-radius: 50%; background: var(--surface-highest);
    border: 2px solid white; box-shadow: var(--shadow-sm); display: flex;
    align-items: center; justify-content: center; font-weight: 700; font-size: 13px;
    color: var(--primary); overflow: hidden;
  }

  /* ── Main canvas ── */
  .main { margin-left: var(--sidebar-w); padding-top: var(--topbar-h); min-height: 100vh; }
  .page { padding: 28px; max-width: 1400px; margin: 0 auto; }

  /* ── Page header ── */
  .page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .page-header h2 { font-size: 26px; font-weight: 800; color: var(--text); font-family: 'Manrope', sans-serif; }
  .page-header p { font-size: 13px; color: var(--text-sec); margin-top: 2px; }
  .page-header-actions { display: flex; gap: 10px; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px;
    border-radius: var(--radius-sm); font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; border: none; font-family: 'Inter', sans-serif;
  }
  .btn:active { transform: scale(0.98); }
  .btn-primary { background: linear-gradient(135deg, var(--primary), var(--primary-dim)); color: white; box-shadow: var(--shadow-sm); }
  .btn-primary:hover { box-shadow: var(--shadow-md); }
  .btn-ghost { background: white; color: var(--primary); border: 1px solid var(--border-med); }
  .btn-ghost:hover { background: var(--surface-low); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-danger { background: var(--error); color: white; }
  .btn-danger:hover { background: #7a302e; }

  /* ── Cards ── */
  .card {
    background: white; border-radius: var(--radius-md); border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
  }
  .stat-card {
    background: white; border-radius: var(--radius-md); padding: 20px;
    border: 1px solid var(--border); box-shadow: var(--shadow-sm);
  }
  .stat-card .stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
  .stat-card .stat-val { font-size: 28px; font-weight: 800; font-family: 'Manrope', sans-serif; color: var(--text); }
  .stat-card .stat-sub { font-size: 11px; margin-top: 4px; font-weight: 600; }

  /* ── Table ── */
  .table-wrap { background: white; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: var(--surface-low); border-bottom: 1px solid var(--border); }
  th { padding: 12px 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); white-space: nowrap; }
  td { padding: 14px 20px; font-size: 13px; color: var(--text); }
  tbody tr { border-bottom: 1px solid var(--surface-low); transition: background 0.1s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: var(--surface-low); }

  /* ── Badges ── */
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
  }
  .badge-green { background: var(--green-bg); color: #15803d; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .badge-amber { background: var(--amber-bg); color: #92400e; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-gray { background: #f1f5f9; color: #475569; }
  .badge-indigo { background: #e0e7ff; color: #3730a3; }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; }

  /* ── Filters bar ── */
  .filters-bar {
    background: var(--surface-low); border-radius: var(--radius-sm); padding: 14px 16px;
    display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 20px;
    border: 1px solid var(--border);
  }
  .filter-select {
    display: flex; align-items: center; gap: 8px; background: white;
    padding: 7px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border);
    font-size: 12px;
  }
  .filter-select select {
    border: none; background: transparent; font-size: 12px; font-weight: 600;
    color: var(--text); cursor: pointer; outline: none; font-family: 'Inter', sans-serif;
  }

  /* ── Pagination ── */
  .pagination { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: rgba(240,244,247,0.5); border-top: 1px solid var(--surface-low); }
  .pagination p { font-size: 12px; color: var(--text-sec); font-weight: 500; }
  .pagination-btns { display: flex; gap: 4px; }
  .pag-btn {
    width: 30px; height: 30px; border-radius: var(--radius-sm); border: 1px solid var(--border);
    background: white; font-size: 12px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center; color: var(--text-sec);
    transition: all 0.1s;
  }
  .pag-btn:hover { background: var(--surface-low); color: var(--primary); }
  .pag-btn.active { background: var(--primary); color: white; border-color: var(--primary); }

  /* ── Avatar initials ── */
  .avatar-initials {
    width: 34px; height: 34px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; font-weight: 700; font-size: 12px;
    flex-shrink: 0;
  }
  .av-sky { background: #e0f2fe; color: #0369a1; }
  .av-indigo { background: #e0e7ff; color: #4338ca; }
  .av-amber { background: #fef3c7; color: #92400e; }
  .av-slate { background: #f1f5f9; color: #475569; }
  .av-green { background: #dcfce7; color: #15803d; }

  /* ── Loading / Error / Empty ── */
  .state-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 12px; }
  .state-wrap .icon { font-size: 40px; color: var(--text-muted); }
  .state-wrap p { font-size: 14px; color: var(--text-sec); text-align: center; }
  .spinner {
    width: 32px; height: 32px; border: 3px solid var(--surface-high);
    border-top-color: var(--primary); border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .pulse { animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  .error-msg { color: var(--error); font-size: 13px; font-weight: 600; }

  /* ── Modal ── */
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .modal {
    background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
    width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
  }
  .modal-header {
    padding: 20px 24px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-header h3 { font-size: 17px; font-weight: 700; font-family: 'Manrope', sans-serif; }
  .modal-body { padding: 24px; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; }

  /* ── Form ── */
  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--text-sec); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-input {
    width: 100%; padding: 9px 12px; border-radius: var(--radius-sm);
    border: 1.5px solid var(--border-med); background: white; font-size: 13px;
    color: var(--text); outline: none; transition: border-color 0.15s;
    font-family: 'Inter', sans-serif;
  }
  .form-input:focus { border-color: var(--primary); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  /* ── Route card ── */
  .route-card { background: white; border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--border); border-left: 4px solid var(--primary); box-shadow: var(--shadow-sm); transition: box-shadow 0.15s; }
  .route-card:hover { box-shadow: var(--shadow-md); }
  .route-card.amber { border-left-color: var(--amber); }
  .route-card.green { border-left-color: var(--green); }

  /* ── Progress bar ── */
  .progress-track { width: 100%; height: 6px; background: var(--surface-high); border-radius: 999px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 999px; transition: width 0.4s; }
  .progress-blue { background: var(--primary); }
  .progress-amber { background: var(--amber); }
  .progress-green { background: var(--green); }

  /* ── Tag ── */
  .tag { display: inline-flex; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .tag-blue { background: #dbeafe; color: #1d4ed8; }
  .tag-slate { background: #f1f5f9; color: #475569; }

  /* ── Alert ── */
  .alert { display: flex; align-items: flex-start; gap: 14px; padding: 18px; border-radius: var(--radius-md); border-left: 4px solid; }
  .alert-error { background: #fff5f5; border-color: var(--error); }
  .alert-warning { background: var(--amber-bg); border-color: var(--amber); }
  .alert-icon-wrap { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .alert-error .alert-icon-wrap { background: #fee2e2; color: var(--error); }
  .alert-warning .alert-icon-wrap { background: #fde68a; color: var(--amber); }

  /* ── Misc ── */
  .text-primary { color: var(--primary); }
  .text-error { color: var(--error); }
  .text-muted { color: var(--text-muted); }
  .text-sec { color: var(--text-sec); }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .mt-4 { margin-top: 16px; }
  .mt-6 { margin-top: 24px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-6 { margin-bottom: 24px; }
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-2 { gap: 8px; }
  .gap-3 { gap: 12px; }
  .w-full { width: 100%; }

  @media (max-width: 1100px) {
    .grid-4 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; }
    .sidebar { transform: translateX(-100%); }
    .main, .topbar { margin-left: 0; left: 0; }
    .search-wrap { width: 200px; }
  }
`;

// ─── Shared UI Components ─────────────────────────────────────────────────────
function Icon({ name, className = "", style = {}, filled = false }) {
  return (
    <span className={`icon${filled ? " filled" : ""} ${className}`} style={style}>
      {name}
    </span>
  );
}

function Spinner() {
  return (
    <div className="state-wrap">
      <div className="spinner" />
      <p>Carregando…</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="state-wrap">
      <Icon name="error_outline" style={{ fontSize: 40, color: "var(--error)" }} />
      <p className="error-msg">{message}</p>
      {onRetry && (
        <button className="btn btn-ghost btn-sm" onClick={onRetry}>
          <Icon name="refresh" className="sm" /> Tentar novamente
        </button>
      )}
    </div>
  );
}

function EmptyState({ message = "Nenhum item encontrado.", icon = "inbox" }) {
  return (
    <div className="state-wrap">
      <Icon name={icon} />
      <p>{message}</p>
    </div>
  );
}

function Badge({ children, variant = "gray" }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

const STATUS_MAP = {
  PENDENTE: { label: "Pendente", variant: "blue" },
  ENTREGUE: { label: "Entregue", variant: "green" },
  CANCELADO: { label: "Cancelado", variant: "red" },
};

const STATUS_ROTEIRO_MAP = {
  EM_ANDAMENTO: { label: "Em Andamento", variant: "blue" },
  FINALIZADO:   { label: "Finalizado", variant: "green" },
};

const TIPO_MAP = {
  CPF:  { label: "Pessoa Física", variant: "gray" },
  CNPJ: { label: "Pessoa Jurídica", variant: "indigo" },
};

function AvatarInitials({ name, color = "sky" }) {
  const initials = name
    ? name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?";
  return <div className={`avatar-initials av-${color}`}>{initials}</div>;
}

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage }) {
  const nav = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "clientes", icon: "group", label: "Clientes" },
    { id: "pedidos", icon: "receipt_long", label: "Pedidos" },
    { id: "roteiros", icon: "map", label: "Roteiros" },
    { id: "estoque", icon: "inventory_2", label: "Estoque" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Icon name="water_drop" filled />
        </div>
        <div>
          <h1>Barreto</h1>
          <p>Hydro-Precision Sys</p>
        </div>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map((n) => (
          <button
            key={n.id}
            className={`nav-link ${page === n.id ? "active" : ""}`}
            onClick={() => setPage(n.id)}
          >
            <Icon name={n.icon} className="sm" />
            {n.label}
          </button>
        ))}
      </nav>

      <hr className="sidebar-divider" />
      <button className="btn-new-order" onClick={() => setPage("pedidos")}>
        <Icon name="add" className="sm" />
        Novo Pedido
      </button>

      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        <button className="nav-link">
          <Icon name="settings" className="sm" />
          Configurações
        </button>
        <button className="nav-link">
          <Icon name="logout" className="sm" style={{ color: "var(--error)" }} />
          Sair
        </button>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ title, onSearch, searchPlaceholder }) {
  return (
    <header className="topbar">
      <div className="search-wrap">
        <Icon name="search" className="sm" />
        <input
          className="search-input"
          placeholder={searchPlaceholder || "Buscar…"}
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </div>
      <div className="topbar-right">
        <button className="icon-btn">
          <Icon name="notifications" />
          <span className="notif-dot" />
        </button>
        <button className="icon-btn">
          <Icon name="help_outline" />
        </button>
        <div className="topbar-divider" />
        <div className="user-info">
          <p>Adailton Barreto</p>
          <span>Administrador</span>
        </div>
        <div className="avatar">AB</div>
      </div>
    </header>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage({ setPage }) {
  const { data: clientes, loading: lc } = useFetch(() => api.clientes.listar());
  const { data: pedidos, loading: lp } = useFetch(() => api.pedidos.listar());
  const { data: roteiros, loading: lr } = useFetch(() => api.roteiros.listar());
  const { data: caminhoes, loading: lcam } = useFetch(() => api.roteiros.caminhoes());

  const loading = lc || lp || lr || lcam;

  const ativos = clientes?.filter((c) => c.ativo !== false)?.length ?? 0;
  const pendentes = pedidos?.filter((p) => p.status === "PENDENTE")?.length ?? 0;
  const entregues = pedidos?.filter((p) => p.status === "ENTREGUE")?.length ?? 0;
  const camOp = caminhoes?.length ?? 0;

  const recentPedidos = pedidos?.slice(0, 5) ?? [];

  const stats = [
    { label: "Clientes Ativos", val: ativos, icon: "group", color: "var(--primary)", sub: `${clientes?.length ?? 0} total`, subColor: "var(--text-sec)" },
    { label: "Pedidos Hoje", val: pedidos?.length ?? 0, icon: "receipt_long", color: "#7c3aed", sub: `${pendentes} pendentes`, subColor: "var(--amber)" },
    { label: "Entregues", val: entregues, icon: "local_shipping", color: "var(--green)", sub: "pedidos entregues", subColor: "var(--green)" },
    { label: "Caminhões", val: camOp, icon: "directions_car", color: "#0891b2", sub: "na frota", subColor: "var(--text-sec)" },
  ];

  return (
    <div className="page">
      <Topbar searchPlaceholder="Buscar clientes, pedidos, roteiros…" />
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Visão geral da operação</p>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid-4 mb-6">
            {stats.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-label">
                  {s.label}
                  <Icon name={s.icon} className="sm" style={{ color: s.color }} />
                </div>
                <div className="stat-val">{s.val}</div>
                <div className="stat-sub" style={{ color: s.subColor }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            <div className="card">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "Manrope" }}>Pedidos Recentes</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage("pedidos")}>
                  Ver todos <Icon name="arrow_forward" className="sm" />
                </button>
              </div>
              {recentPedidos.length === 0 ? (
                <EmptyState message="Nenhum pedido encontrado." icon="receipt_long" />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPedidos.map((p) => {
                      const st = STATUS_MAP[p.status] ?? { label: p.status, variant: "gray" };
                      return (
                        <tr key={p.numeroPedido}>
                          <td style={{ color: "var(--primary)", fontWeight: 700 }}>#{p.numeroPedido}</td>
                          <td>{p.cliente?.nome ?? "—"}</td>
                          <td><Badge variant={st.variant}>{st.label}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "Manrope" }}>Roteiros do Dia</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage("roteiros")}>
                  Ver todos <Icon name="arrow_forward" className="sm" />
                </button>
              </div>
              {!roteiros || roteiros.length === 0 ? (
                <EmptyState message="Nenhum roteiro para hoje." icon="map" />
              ) : (
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {roteiros.slice(0, 4).map((r) => (
                    <div key={r.numeroRoteiro} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--surface-low)", borderRadius: "var(--radius-sm)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Icon name="local_shipping" className="sm" style={{ color: "var(--primary)" }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>Roteiro #{r.numeroRoteiro}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.caminhao?.placa ?? "—"} · {r.pedidos?.length ?? 0} pedidos</div>
                        </div>
                      </div>
                      <Badge variant="blue">Ativo</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── CLIENTES PAGE ────────────────────────────────────────────────────────────
function ClientesPage() {
  const { data, loading, error, refetch } = useFetch(() => api.clientes.listar());
  const { data: bairros, refetch: refetchBairros } = useFetch(() => api.bairros.listar());
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [filterTipo, setFilterTipo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showBairros, setShowBairros] = useState(false);
  const [novoBairro, setNovoBairro] = useState("");
  const [savingBairro, setSavingBairro] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tipo: "CPF", nome: "", documento: "", endereco: "", bairro: "", telefone: "", razaoSocial: "", pontoReferencia: "" });

  const PER_PAGE = 10;

  async function handleSearch(v) {
    setSearch(v);
    setPage(1);
    if (v.trim().length >= 2) {
      try {
        const results = await api.clientes.buscar(v.trim());
        setSearchResults(results);
      } catch { setSearchResults(null); }
    } else {
      setSearchResults(null);
    }
  }

  const base = searchResults ?? (data ?? []);

  const filtered = base.filter((c) => {
    const matchTipo = !filterTipo || c.tipoCliente === filterTipo;
    const matchStatus = !filterStatus || (filterStatus === "ATIVO" ? c.ativo !== false : c.ativo === false);
    return matchTipo && matchStatus;
  });

  const total = filtered.length;
  const pages = Math.ceil(total / PER_PAGE);
  const slice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const AV_COLORS = ["sky", "indigo", "amber", "slate", "green"];
  function avColor(i) { return AV_COLORS[i % AV_COLORS.length]; }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.clientes.criar(form);
      setShowModal(false);
      setForm({ tipo: "CPF", nome: "", documento: "", endereco: "", bairro: "", telefone: "", razaoSocial: "", pontoReferencia: "" });
      refetch();
    } catch (err) {
      alert("Erro ao criar cliente: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateBairro(e) {
    e.preventDefault();
    if (!novoBairro.trim()) return;
    setSavingBairro(true);
    try {
      await api.bairros.criar(novoBairro.trim());
      setNovoBairro("");
      refetchBairros();
    } catch (err) { alert("Erro: " + err.message); }
    finally { setSavingBairro(false); }
  }

  async function handleDeleteBairro(id) {
    try { await api.bairros.deletar(id); refetchBairros(); }
    catch (err) { alert("Erro: " + err.message); }
  }

  async function handleToggle(id) {
    try {
      await api.clientes.toggle(id);
      await new Promise(r => setTimeout(r, 150));
      await refetch();
    }
    catch (err) { alert("Erro: " + err.message); }
  }

  return (
    <div className="page">
      <Topbar searchPlaceholder="Buscar clientes, endereços…" onSearch={handleSearch} />

      <div className="page-header">
        <div>
          <h2>Clientes</h2>
          <p>Gerencie a base de consumidores residenciais e comerciais.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost">
            <Icon name="upload_file" className="sm" /> Importar CSV
          </button>
          <button className="btn btn-ghost" onClick={() => setShowBairros(true)}>
            <Icon name="map" className="sm" /> Bairros
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Icon name="person_add" className="sm" /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-select">
          <Icon name="filter_list" className="sm" style={{ color: "var(--text-muted)" }} />
          <select value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); setPage(1); }}>
            <option value="">Todos os Tipos</option>
            <option value="CPF">Pessoa Física</option>
            <option value="CNPJ">Pessoa Jurídica</option>
          </select>
        </div>
        <div className="filter-select">
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">Qualquer Status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
        </div>
        {(filterTipo || filterStatus || search) && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: "auto", color: "var(--primary)" }}
            onClick={() => { setFilterTipo(""); setFilterStatus(""); setSearch(""); setSearchResults(null); setPage(1); }}
          >
            <Icon name="filter_list_off" className="sm" /> Limpar Filtros
          </button>
        )}
      </div>

      <div className="table-wrap">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : slice.length === 0 ? (
          <EmptyState message="Nenhum cliente encontrado." icon="group" />
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Nome do Cliente</th>
                  <th>Tipo</th>
                  <th>Endereço</th>
                  <th>Contato</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {slice.map((c, i) => {
                  const tipo = TIPO_MAP[c.tipoCliente] ?? { label: c.tipoCliente, variant: "gray" };
                  const isAtivo = c.ativo !== false;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <AvatarInitials name={c.nome} color={avColor(i)} />
                          <div>
                            <div
                              style={{ fontWeight: 600, cursor: "pointer", color: "var(--primary)" }}
                              onClick={() => setSelectedCliente(c)}
                            >{c.nome}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>ID: #{c.id} · {c.documento}</div>
                          </div>
                        </div>
                      </td>
                      <td><Badge variant={tipo.variant}>{tipo.label}</Badge></td>
                      <td style={{ color: "var(--text-sec)", maxWidth: 200 }}>{c.endereco ?? "—"}</td>
                      <td style={{ fontWeight: 500 }}>{c.telefone ?? "—"}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: isAtivo ? "var(--green)" : "var(--error)", display: "inline-block" }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: isAtivo ? "var(--green)" : "var(--error)" }}>
                            {isAtivo ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="icon-btn"
                          title={isAtivo ? "Desativar" : "Ativar"}
                          onClick={() => handleToggle(c.id)}
                          style={{ color: isAtivo ? "var(--error)" : "var(--green)" }}
                        >
                          <Icon name={isAtivo ? "person_off" : "person"} className="sm" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="pagination">
              <p>
                Mostrando <strong>{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)}</strong> de <strong>{total}</strong> clientes
              </p>
              <div className="pagination-btns">
                <button className="pag-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <Icon name="chevron_left" className="sm" />
                </button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`pag-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                {pages > 5 && <span style={{ padding: "0 4px", color: "var(--text-muted)" }}>…</span>}
                <button className="pag-btn" disabled={page === pages} onClick={() => setPage(page + 1)}>
                  <Icon name="chevron_right" className="sm" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bairros Modal */}
      <Modal
        open={showBairros}
        onClose={() => setShowBairros(false)}
        title="Gerenciar Bairros"
        footer={<button className="btn btn-ghost" onClick={() => setShowBairros(false)}>Fechar</button>}
      >
        <div>
          <form onSubmit={handleCreateBairro} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              value={novoBairro}
              onChange={(e) => setNovoBairro(e.target.value)}
              placeholder="Nome do bairro…"
              required
            />
            <button className="btn btn-primary btn-sm" type="submit" disabled={savingBairro}>
              <Icon name="add" className="sm" /> {savingBairro ? "…" : "Adicionar"}
            </button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
            {(bairros ?? []).length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px", fontSize: 13 }}>
                Nenhum bairro cadastrado.
              </div>
            ) : (
              (bairros ?? []).map((b) => (
                <div key={b.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: "var(--surface-low)",
                  borderRadius: "var(--radius-sm)", border: "1px solid var(--border)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="location_on" className="sm" style={{ color: "var(--primary)" }} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{b.nome}</span>
                  </div>
                  <button
                    className="icon-btn"
                    style={{ color: "var(--error)", width: 28, height: 28 }}
                    onClick={() => handleDeleteBairro(b.id)}
                    title="Remover bairro"
                  >
                    <Icon name="delete" className="sm" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Novo Cliente"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? "Salvando…" : "Criar Cliente"}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label>Nome completo</label>
            <input className="form-input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: João da Silva" required />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select className="form-input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="CPF">CPF (Pessoa Física)</option>
              <option value="CNPJ">CNPJ (Pessoa Jurídica)</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>CPF / CNPJ</label>
            <input className="form-input" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} placeholder="000.000.000-00" />
          </div>
          <div className="form-group">
            <label>Telefone</label>
            <input className="form-input" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-0000" />
          </div>
        </div>
        <div className="form-group">
          <label>Endereço</label>
          <input className="form-input" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, número" />
        </div>
        <div className="form-group">
          <label>Bairro</label>
          <select className="form-input" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })}>
            <option value="">Selecione um bairro…</option>
            {(bairros ?? []).map((b) => (
              <option key={b.id} value={b.nome}>{b.nome}</option>
            ))}
          </select>
        </div>
        {form.tipo === "CNPJ" && (
          <div className="form-group">
            <label>Razão Social</label>
            <input className="form-input" value={form.razaoSocial} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} placeholder="Ex: Empresa Ltda." />
          </div>
        )}
        <div className="form-group">
          <label>Ponto de Referência <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
          <input className="form-input" value={form.pontoReferencia} onChange={(e) => setForm({ ...form, pontoReferencia: e.target.value })} placeholder="Ex: próximo ao mercado" />
        </div>
      </Modal>

      {/* Cliente Detail Modal */}
      <Modal
        open={!!selectedCliente}
        onClose={() => setSelectedCliente(null)}
        title="Detalhes do Cliente"
        footer={
          <button className="btn btn-ghost" onClick={() => setSelectedCliente(null)}>Fechar</button>
        }
      >
        {selectedCliente && (
          <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, padding: "16px", background: "var(--surface-low)", borderRadius: "var(--radius-sm)" }}>
              <AvatarInitials name={selectedCliente.nome} color="sky" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedCliente.nome}</div>
                {selectedCliente.razaoSocial && (
                  <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{selectedCliente.razaoSocial}</div>
                )}
                <div style={{ marginTop: 4, display: "flex", gap: 6 }}>
                  <Badge variant={selectedCliente.tipoCliente === "CNPJ" ? "indigo" : "gray"}>
                    {selectedCliente.tipoCliente === "CNPJ" ? "Pessoa Jurídica" : "Pessoa Física"}
                  </Badge>
                  <Badge variant={selectedCliente.ativo !== false ? "green" : "red"}>
                    {selectedCliente.ativo !== false ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
              {[
                { label: "ID", value: `#${selectedCliente.id}` },
                { label: "Documento", value: selectedCliente.documento ?? "—" },
                { label: "Telefone", value: selectedCliente.telefone ?? "—" },
                { label: "Bairro", value: selectedCliente.bairro ?? "—" },
                { label: "Endereço", value: selectedCliente.endereco ?? "—", full: true },
                { label: "Ponto de Referência", value: selectedCliente.pontoReferencia ?? "—", full: true },
                ...(selectedCliente.tipoCliente === "CNPJ"
                  ? [{ label: "Razão Social", value: selectedCliente.razaoSocial ?? "—", full: true }]
                  : []),
              ].map((f) => (
                <div key={f.label} style={{ gridColumn: f.full ? "1 / -1" : undefined }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 3 }}>{f.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{f.value}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: selectedCliente.ativo !== false ? "var(--error)" : "var(--green)" }}
                onClick={async () => {
                  await handleToggle(selectedCliente.id);
                  setSelectedCliente(prev => prev ? { ...prev, ativo: !prev.ativo } : null);
                }}
              >
                {selectedCliente.ativo !== false ? "Desativar cliente" : "Reativar cliente"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── ClienteSearchField ──────────────────────────────────────────────────────
function ClienteSearchField({ value, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [open, setOpen] = useState(false);

  async function handleSearch(v) {
    setQuery(v);
    setOpen(true);
    if (v.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await api.clientes.buscar(v.trim());
      setResults(data ?? []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }

  function handleSelect(c) {
    onSelect(c);
    setSelectedName(c.nome);
    setQuery(c.nome);
    setOpen(false);
    setResults([]);
  }

  function handleClear() {
    onSelect({ id: "" });
    setSelectedName("");
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="form-group" style={{ position: "relative" }}>
      <label>Cliente</label>
      <div style={{ position: "relative" }}>
        <Icon name="search" className="sm" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          className="form-input"
          style={{ paddingLeft: 34, paddingRight: value ? 34 : 12, background: value ? "#f0fdf4" : "white", borderColor: value ? "var(--green)" : undefined }}
          placeholder="Buscar por nome, documento, telefone, bairro…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
          >
            <Icon name="close" className="sm" />
          </button>
        ) : searching ? (
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          </div>
        ) : null}
      </div>

      {value && (
        <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 600, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name="check_circle" className="sm" style={{ fontSize: 13 }} /> Cliente selecionado: {selectedName} (ID #{value})
        </div>
      )}

      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
          background: "white", border: "1px solid var(--border-med)",
          borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-md)",
          maxHeight: 220, overflowY: "auto", marginTop: 2
        }}>
          {results.map((c) => (
            <div
              key={c.id}
              onClick={() => handleSelect(c)}
              style={{
                padding: "10px 14px", cursor: "pointer", display: "flex",
                alignItems: "center", gap: 10, borderBottom: "1px solid var(--surface-low)",
                transition: "background 0.1s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-low)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "white"}
            >
              <AvatarInitials name={c.nome} color="sky" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nome}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {[c.bairro, c.telefone, c.documento].filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !searching && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
          background: "white", border: "1px solid var(--border-med)",
          borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-md)",
          padding: "14px", textAlign: "center", color: "var(--text-muted)",
          fontSize: 13, marginTop: 2
        }}>
          Nenhum cliente encontrado.
        </div>
      )}
    </div>
  );
}

// ─── PEDIDOS PAGE ─────────────────────────────────────────────────────────────
function PedidosPage() {
  const { data: pedidos, loading, error, refetch } = useFetch(() => api.pedidos.listar());
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ clienteId: "", produto: "GARRAFAO_REPOSICAO", quantidade: 1 });
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const PRODUTOS = [
    { val: "GARRAFAO_COMPLETO", label: "Garrafão 20L (completo)" },
    { val: "GARRAFAO_REPOSICAO", label: "Garrafão 20L (reposição)" },
    { val: "PACOTE_BABY", label: "Pacote Baby 300ml" },
    { val: "PACOTE_COPINHO", label: "Pacote Copinho 200ml" },
    { val: "PACOTE_500ML_COM_GAS", label: "Pacote 500ml c/ Gás" },
    { val: "PACOTE_500ML_SEM_GAS", label: "Pacote 500ml s/ Gás" },
  ];

  const filtered = (pedidos ?? []).filter((p) => {
    const matchStatus = !filter || p.status === filter;
    const matchSearch = !search || p.cliente?.nome?.toLowerCase().includes(search.toLowerCase()) || String(p.numeroPedido).includes(search);
    return matchStatus && matchSearch;
  });

  const total = filtered.length;
  const pages = Math.ceil(total / PER_PAGE);
  const slice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalValor = filtered.reduce((acc, p) => acc + (p.valorTotal ?? 0), 0);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.clienteId) { alert("Selecione um cliente."); return; }
    setSaving(true);
    try {
      await api.pedidos.criar({
        clienteId: Number(form.clienteId),
        itens: [{ produto: form.produto, quantidade: Number(form.quantidade) }],
      });
      setShowModal(false);
      setForm({ clienteId: "", produto: "GARRAFAO_REPOSICAO", quantidade: 1 });
      refetch();
    } catch (err) {
      alert("Erro ao criar pedido: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(id, status) {
    try { await api.pedidos.status(id, status); refetch(); }
    catch (err) { alert("Erro: " + err.message); }
  }

  return (
    <div className="page">
      <Topbar searchPlaceholder="Buscar pedidos…" onSearch={(v) => { setSearch(v); setPage(1); }} />

      <div className="page-header">
        <div>
          <h2>Pedidos de Distribuição</h2>
          <p>Gerenciamento centralizado de fluxo e logística de entregas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Icon name="add" className="sm" /> Novo Pedido
        </button>
      </div>

      <div className="filters-bar" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="filter-select">
            <Icon name="filter_alt" className="sm" style={{ color: "var(--text-muted)" }} />
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
              <option value="">Todos os Status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="ENTREGUE">Entregue</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,98,158,0.06)", padding: "8px 14px", borderRadius: "var(--radius-sm)" }}>
          <Icon name="trending_up" className="sm" style={{ color: "var(--primary)" }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Volume Total</div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "Manrope", color: "var(--primary)" }}>
              R$ {totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : slice.length === 0 ? (
          <EmptyState message="Nenhum pedido encontrado." icon="receipt_long" />
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>ID Pedido</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th style={{ textAlign: "right" }}>Valor Total</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((p) => {
                  const st = STATUS_MAP[p.status] ?? { label: p.status, variant: "gray" };
                  return (
                    <tr key={p.numeroPedido}>
                      <td style={{ color: "var(--primary)", fontWeight: 700 }}>#ORD-{String(p.numeroPedido).padStart(4, "0")}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <AvatarInitials name={p.cliente?.nome ?? "?"} color="sky" />
                          <span style={{ fontWeight: 600 }}>{p.cliente?.nome ?? "—"}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-sec)" }}>{p.dataPedido ? new Date(p.dataPedido).toLocaleDateString("pt-BR") : "—"}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "Manrope" }}>
                        R$ {(p.valorTotal ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                          {p.status === "PENDENTE" && (
                            <>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--green)", borderColor: "var(--green)", padding: "4px 10px" }} onClick={() => handleStatus(p.numeroPedido, "ENTREGUE")}>
                                <Icon name="check" className="sm" />
                              </button>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--error)", borderColor: "var(--error)", padding: "4px 10px" }} onClick={() => handleStatus(p.numeroPedido, "CANCELADO")}>
                                <Icon name="close" className="sm" />
                              </button>
                            </>
                          )}
                          <button className="icon-btn"><Icon name="more_vert" className="sm" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="pagination">
              <p>Mostrando <strong>{Math.min(total, (page - 1) * PER_PAGE + 1)}–{Math.min(page * PER_PAGE, total)}</strong> de <strong>{total}</strong> pedidos</p>
              <div className="pagination-btns">
                <button className="pag-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <Icon name="chevron_left" className="sm" />
                </button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`pag-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="pag-btn" disabled={page === pages} onClick={() => setPage(page + 1)}>
                  <Icon name="chevron_right" className="sm" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card mt-6" style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", overflow: "hidden", position: "relative" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Icon name="fact_check" style={{ fontSize: 24, color: "var(--primary)" }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, fontFamily: "Manrope" }}>Resumo do Dia</h3>
          </div>
          <p style={{ color: "var(--text-sec)", fontSize: 13 }}>Volume operacional das últimas 24 horas.</p>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { label: "Total", val: pedidos?.length ?? 0, color: "var(--primary)" },
            { label: "Entregues", val: (pedidos ?? []).filter((p) => p.status === "ENTREGUE").length, color: "var(--green)" },
            { label: "Pendentes", val: (pedidos ?? []).filter((p) => p.status === "PENDENTE").length, color: "var(--amber)" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "Manrope", color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Novo Pedido"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? "Salvando…" : "Criar Pedido"}
            </button>
          </>
        }
      >
        <ClienteSearchField
          value={form.clienteId}
          onSelect={(c) => setForm({ ...form, clienteId: c.id })}
        />
        <div className="form-row">
          <div className="form-group">
            <label>Produto</label>
            <select className="form-input" value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })}>
              {PRODUTOS.map((p) => <option key={p.val} value={p.val}>{p.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Quantidade</label>
            <input className="form-input" type="number" min="1" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} />
          </div>
        </div>
      </Modal>
      {/* Pedido Detail Modal */}
      <Modal
        open={!!selectedPedido}
        onClose={() => setSelectedPedido(null)}
        title="Detalhes do Pedido"
        footer={
          <div style={{ display: "flex", gap: 10, width: "100%", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {selectedPedido?.status === "PENDENTE" && (
                <>
                  <button className="btn btn-sm" style={{ background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green)" }}
                    onClick={async () => { await handleStatus(selectedPedido.numeroPedido, "ENTREGUE"); setSelectedPedido(prev => prev ? { ...prev, status: "ENTREGUE" } : null); refetch(); }}>
                    <Icon name="check" className="sm" /> Confirmar Entrega
                  </button>
                  <button className="btn btn-sm" style={{ background: "#fee2e2", color: "var(--error)", border: "1px solid var(--error)" }}
                    onClick={async () => { await handleStatus(selectedPedido.numeroPedido, "CANCELADO"); setSelectedPedido(null); refetch(); }}>
                    <Icon name="close" className="sm" /> Cancelar
                  </button>
                </>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPedido(null)}>Fechar</button>
          </div>
        }
      >
        {selectedPedido && (
          <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "var(--surface-low)", borderRadius: "var(--radius-sm)", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>ID do Pedido</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "Manrope", color: "var(--primary)" }}>
                  #ORD-{String(selectedPedido.numeroPedido).padStart(4, "0")}
                </div>
              </div>
              <Badge variant={(STATUS_MAP[selectedPedido.status] ?? { variant: "gray" }).variant}>
                {(STATUS_MAP[selectedPedido.status] ?? { label: selectedPedido.status }).label}
              </Badge>
            </div>

            {/* Cliente info */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>Cliente</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                <AvatarInitials name={selectedPedido.cliente?.nome ?? "?"} color="sky" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedPedido.cliente?.nome ?? "—"}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{selectedPedido.cliente?.endereco ?? ""}{selectedPedido.cliente?.bairro ? ` · ${selectedPedido.cliente.bairro}` : ""}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{selectedPedido.cliente?.telefone ?? ""}</div>
                </div>
              </div>
            </div>

            {/* Itens */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>Itens do Pedido</div>
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                {(selectedPedido.itens ?? []).length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Nenhum item</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--surface-low)", borderBottom: "1px solid var(--border)" }}>
                        <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", textAlign: "left" }}>Produto</th>
                        <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", textAlign: "center" }}>Qtd</th>
                        <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", textAlign: "right" }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPedido.itens ?? []).map((item, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--surface-low)" }}>
                          <td style={{ padding: "10px 14px", fontSize: 13 }}>{item.produto ?? "—"}</td>
                          <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "center", fontWeight: 600 }}>{item.quantidade}</td>
                          <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "right", fontWeight: 700, fontFamily: "Manrope" }}>
                            R$ {(item.subtotal ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Totais */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Valor Total", value: `R$ ${(selectedPedido.valorTotal ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "var(--primary)" },
                { label: "Bairro", value: selectedPedido.cliente?.bairro ?? "—", color: "var(--text)" },
                { label: "Data", value: selectedPedido.dataPedido ? new Date(selectedPedido.dataPedido).toLocaleDateString("pt-BR") : "—", color: "var(--text)" },
              ].map((s) => (
                <div key={s.label} style={{ background: "var(--surface-low)", borderRadius: "var(--radius-sm)", padding: "12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "Manrope", color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── ROTEIROS PAGE ────────────────────────────────────────────────────────────
function RoteirosPage() {
  const today = new Date().toISOString().split("T")[0];
  const { data: roteiros, loading, error, refetch } = useFetch(() => api.roteiros.listar(today), [today]);
  const { data: caminhoes, loading: lcam, refetch: refetchCam } = useFetch(() => api.roteiros.caminhoes());
  const { data: pedidos } = useFetch(() => api.pedidos.listar());
  const [selected, setSelected] = useState(null);
  const [showNewRoteiro, setShowNewRoteiro] = useState(false);
  const [detailRoteiro, setDetailRoteiro] = useState(null);
  const [showFinalizar, setShowFinalizar] = useState(false);
  const [roteiroToFinalizar, setRoteiroToFinalizar] = useState(null);
  const [checkedPedidos, setCheckedPedidos] = useState({});
  const [finalizando, setFinalizando] = useState(false);
  const [showNewCam, setShowNewCam] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rForm, setRForm] = useState({ caminhaoId: "", data: today });
  const [cForm, setCForm] = useState({ placa: "", motorista: "", capacidadeMaximaKg: "" });

  const selectedRoteiro = roteiros?.find((r) => r.numeroRoteiro === selected) ?? roteiros?.[0] ?? null;
  const pedidosNoRoteiro = new Set((roteiros ?? []).flatMap(r => (r.pedidos ?? []).map(p => p.numeroPedido)));
  const pedidosPendentes = (pedidos ?? []).filter((p) => p.status === "PENDENTE" && !pedidosNoRoteiro.has(p.numeroPedido));

  async function createRoteiro(e) {
    e.preventDefault();
    if (!rForm.caminhaoId) { alert("Selecione um caminhão."); return; }
    setSaving(true);
    try {
      await api.roteiros.criar({ caminhaoId: Number(rForm.caminhaoId), data: rForm.data });
      setShowNewRoteiro(false);
      setRForm({ caminhaoId: "", data: today });
      refetch();
    } catch (err) { alert("Erro: " + err.message); }
    finally { setSaving(false); }
  }

  async function createCaminhao(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.roteiros.criarCaminhao({ placa: cForm.placa, motorista: cForm.motorista, capacidadeMaximaKg: Number(cForm.capacidadeMaximaKg) });
      setShowNewCam(false);
      setCForm({ placa: "", motorista: "", capacidadeMaximaKg: "" });
      refetchCam();
    } catch (err) { alert("Erro: " + err.message); }
    finally { setSaving(false); }
  }

  async function addPedido(roteiroId, pedidoId) {
    try { await api.roteiros.addPedido(roteiroId, pedidoId); refetch(); }
    catch (err) { alert("Erro: " + err.message); }
  }

  async function remPedido(roteiroId, pedidoId) {
    try { await api.roteiros.remPedido(roteiroId, pedidoId); refetch(); }
    catch (err) { alert("Erro: " + err.message); }
  }

  const stats = [
    { label: "Frota Total", val: caminhoes?.length ?? 0, icon: "local_shipping", sub: "veículos cadastrados", color: "var(--primary)" },
    { label: "Roteiros Hoje", val: roteiros?.length ?? 0, icon: "alt_route", sub: `${pedidosPendentes.length} pedidos aguardando`, color: "#0891b2" },
    { label: "Pendentes", val: pedidosPendentes.length, icon: "pending_actions", sub: "aguardando roteirização", color: "var(--amber)" },
    { label: "Capacidade", val: "—", icon: "analytics", sub: "média da frota", color: "#7c3aed" },
  ];

  function openFinalizar(roteiro) {
    const initial = {};
    (roteiro.pedidos ?? []).forEach(p => {
      initial[p.numeroPedido] = p.status === "ENTREGUE";
    });
    setCheckedPedidos(initial);
    setRoteiroToFinalizar(roteiro);
    setShowFinalizar(true);
  }

  async function handleFinalizar() {
    if (!roteiroToFinalizar) return;
    setFinalizando(true);
    try {
      const entregues = Object.entries(checkedPedidos)
        .filter(([, v]) => v)
        .map(([k]) => Number(k));
      await api.roteiros.finalizar(roteiroToFinalizar.numeroRoteiro, entregues);
      setShowFinalizar(false);
      setRoteiroToFinalizar(null);
      refetch();
    } catch (err) {
      alert("Erro ao finalizar: " + err.message);
    } finally {
      setFinalizando(false);
    }
  }

  function generatePDF(roteiro) {
    const pedidos = roteiro.pedidos ?? [];

    // Consolidate all items
    const carga = {};
    pedidos.forEach(p => {
      (p.itens ?? []).forEach(item => {
        const key = item.produto ?? "—";
        if (!carga[key]) carga[key] = { produto: key, quantidade: 0, subtotal: 0 };
        carga[key].quantidade += item.quantidade ?? 0;
        carga[key].subtotal += item.subtotal ?? 0;
      });
    });

    const dataStr = roteiro.data
      ? (Array.isArray(roteiro.data)
          ? new Date(roteiro.data[0], roteiro.data[1]-1, roteiro.data[2]).toLocaleDateString("pt-BR")
          : new Date(roteiro.data).toLocaleDateString("pt-BR"))
      : "—";

    const pesoTotal = pedidos.reduce((acc, p) => acc + (p.pesoTotal ?? 0), 0);
    const valorTotal = pedidos.reduce((acc, p) => acc + (p.valorTotal ?? 0), 0);

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Roteiro ROTA-${String(roteiro.numeroRoteiro).padStart(3,"0")}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 24px; }
  h1 { font-size: 18px; font-weight: 800; color: #00629e; }
  h2 { font-size: 13px; font-weight: 700; color: #00629e; margin: 18px 0 8px; border-bottom: 2px solid #00629e; padding-bottom: 4px; }
  h3 { font-size: 12px; font-weight: 700; margin-bottom: 4px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #00629e; }
  .header-left p { font-size: 11px; color: #555; margin-top: 2px; }
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f0f4f7; border-radius: 6px; padding: 12px; margin-bottom: 4px; }
  .meta-item label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; display: block; margin-bottom: 2px; }
  .meta-item span { font-size: 12px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  th { background: #00629e; color: white; padding: 6px 10px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; }
  td { padding: 6px 10px; border-bottom: 1px solid #e8eff3; font-size: 11px; }
  tr:nth-child(even) td { background: #f7f9fb; }
  .totals-row td { font-weight: 700; background: #e8eff3 !important; }
  .cliente-block { margin-bottom: 14px; border: 1px solid #d0dce6; border-radius: 6px; overflow: hidden; page-break-inside: avoid; }
  .cliente-header { background: #f0f4f7; padding: 8px 12px; display: flex; justify-content: space-between; align-items: flex-start; }
  .cliente-info { font-size: 10px; color: #555; margin-top: 2px; }
  .cliente-body { padding: 0; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .badge-pending { background: #dbeafe; color: #1d4ed8; }
  .badge-done { background: #dcfce7; color: #15803d; }
  .assinatura { margin-top: 8px; border-top: 1px dashed #ccc; padding-top: 6px; display: flex; gap: 40px; }
  .assinatura-line { flex: 1; border-bottom: 1px solid #999; margin-top: 20px; }
  .assinatura-label { font-size: 9px; color: #888; margin-top: 3px; text-align: center; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; display: flex; justify-content: space-between; font-size: 9px; color: #aaa; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 700; }
  .color-primary { color: #00629e; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <h1>AquaERP — Folha de Roteiro</h1>
    <p>ROTA-${String(roteiro.numeroRoteiro).padStart(3,"0")} &nbsp;·&nbsp; Emitido em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", {hour:"2-digit",minute:"2-digit"})}</p>
  </div>
  <div style="text-align:right">
    <div style="font-size:22px;font-weight:800;color:#00629e">ROTA-${String(roteiro.numeroRoteiro).padStart(3,"0")}</div>
    <div style="font-size:11px;color:#555">${dataStr}</div>
  </div>
</div>

<div class="meta">
  <div class="meta-item"><label>Caminhão</label><span>${roteiro.caminhao?.placa ?? "—"}</span></div>
  <div class="meta-item"><label>Motorista</label><span>${roteiro.caminhao?.motorista ?? "—"}</span></div>
  <div class="meta-item"><label>Capacidade</label><span>${(roteiro.caminhao?.capacidadeMaximaKg ?? 0).toLocaleString("pt-BR")} kg</span></div>
  <div class="meta-item"><label>Nº de Paradas</label><span>${pedidos.length}</span></div>
</div>

<h2>Lista de Carga</h2>
<table>
  <thead><tr><th>Produto</th><th class="text-right">Qtd Total</th><th class="text-right">Valor Total</th></tr></thead>
  <tbody>
    ${Object.values(carga).map(item => `
    <tr>
      <td>${item.produto}</td>
      <td class="text-right font-bold">${item.quantidade}</td>
      <td class="text-right">R$ ${item.subtotal.toLocaleString("pt-BR", {minimumFractionDigits:2})}</td>
    </tr>`).join("")}
    <tr class="totals-row">
      <td class="font-bold">TOTAL GERAL</td>
      <td class="text-right font-bold">${Object.values(carga).reduce((a,i)=>a+i.quantidade,0)}</td>
      <td class="text-right font-bold color-primary">R$ ${valorTotal.toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
    </tr>
  </tbody>
</table>
<p style="font-size:10px;color:#888;margin-bottom:2px">Peso total estimado: <strong>${pesoTotal.toFixed(1)} kg</strong> de <strong>${(roteiro.caminhao?.capacidadeMaximaKg??0).toLocaleString("pt-BR")} kg</strong> disponíveis</p>

<h2>Pedidos por Cliente</h2>
${pedidos.map((p, idx) => `
<div class="cliente-block">
  <div class="cliente-header">
    <div>
      <h3>${idx+1}. ${p.cliente?.nome ?? "—"}</h3>
      <div class="cliente-info">
        ${[p.cliente?.endereco, p.cliente?.bairro].filter(Boolean).join(" · ")}
        ${p.cliente?.pontoReferencia ? `&nbsp;·&nbsp; Ref: ${p.cliente.pontoReferencia}` : ""}
        ${p.cliente?.telefone ? `&nbsp;·&nbsp; Tel: ${p.cliente.telefone}` : ""}
      </div>
    </div>
    <div style="text-align:right">
      <span class="badge ${p.status==="ENTREGUE"?"badge-done":"badge-pending"}">${p.status}</span>
      <div style="font-size:10px;color:#555;margin-top:3px">Pedido #${p.numeroPedido}</div>
    </div>
  </div>
  <div class="cliente-body">
    <table>
      <thead><tr><th>Produto</th><th class="text-right">Qtd</th><th class="text-right">Subtotal</th></tr></thead>
      <tbody>
        ${(p.itens??[]).map(item=>`
        <tr>
          <td>${item.produto??""}</td>
          <td class="text-right">${item.quantidade}</td>
          <td class="text-right">R$ ${(item.subtotal??0).toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
        </tr>`).join("")}
        <tr class="totals-row">
          <td class="font-bold">Total do Pedido</td>
          <td class="text-right">${(p.pesoTotal??0).toFixed(1)} kg</td>
          <td class="text-right font-bold color-primary">R$ ${(p.valorTotal??0).toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div style="padding:8px 12px">
    <div class="assinatura">
      <div style="flex:1"><div class="assinatura-line"></div><div class="assinatura-label">Assinatura do Cliente</div></div>
      <div style="flex:1"><div class="assinatura-line"></div><div class="assinatura-label">Horário de Entrega</div></div>
    </div>
  </div>
</div>`).join("")}

<div class="footer">
  <span>AquaERP © ${new Date().getFullYear()} — Documento gerado automaticamente</span>
  <span>ROTA-${String(roteiro.numeroRoteiro).padStart(3,"0")} · ${dataStr} · ${pedidos.length} paradas</span>
</div>

</body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  return (
    <div className="page">
      <Topbar searchPlaceholder="Buscar placa, rota ou motorista…" />
      <div className="page-header">
        <div>
          <h2>Caminhões &amp; Roteiros</h2>
          <p>Gestão de frota e logística de entregas</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost" onClick={() => setShowNewCam(true)}>
            <Icon name="add_circle" className="sm" /> Cadastrar Veículo
          </button>
          <button className="btn btn-primary" onClick={() => setShowNewRoteiro(true)}>
            <Icon name="add" className="sm" /> Criar Roteiro
          </button>
        </div>
      </div>

      <div className="grid-4 mb-6">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">
              {s.label}
              <Icon name={s.icon} className="sm" style={{ color: s.color }} />
            </div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-sub" style={{ color: "var(--text-muted)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Roteiros do Dia */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "Manrope", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="today" className="sm" style={{ color: "var(--primary)" }} /> Roteiros de Hoje
              </h3>
            </div>
            {loading ? (
              <Spinner />
            ) : error ? (
              <ErrorState message={error} onRetry={refetch} />
            ) : !roteiros || roteiros.length === 0 ? (
              <div className="card" style={{ padding: 40 }}>
                <EmptyState message="Nenhum roteiro para hoje." icon="map" />
              </div>
            ) : (
              <div className="grid-2">
                {roteiros.map((r) => {
                  const pedCount = r.pedidos?.length ?? 0;
                  const prog = pedCount > 0 ? Math.round((pedCount * 0.6)) : 0;
                  const isActive = true;
                  return (
                    <div
                      key={r.numeroRoteiro}
                      className={`route-card ${isActive ? "" : "amber"}`}
                      style={{ cursor: "pointer", outline: selected === r.numeroRoteiro ? "2px solid var(--primary)" : "none" }}
                      onClick={() => setSelected(r.numeroRoteiro)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.08em" }}>ROTA-{String(r.numeroRoteiro).padStart(3, "0")}</div>
                          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>Roteiro {r.numeroRoteiro}</div>
                        </div>
                        <Badge variant={(STATUS_ROTEIRO_MAP[r.status] ?? STATUS_ROTEIRO_MAP.EM_ANDAMENTO).variant}>
                          {(STATUS_ROTEIRO_MAP[r.status] ?? STATUS_ROTEIRO_MAP.EM_ANDAMENTO).label}
                        </Badge>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--surface-low)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="local_shipping" className="sm" style={{ color: "var(--text-muted)" }} />
                        </div>
                        <div style={{ fontSize: 12 }}>
                          <div style={{ fontWeight: 700, color: "var(--text)" }}>{r.caminhao?.motorista ?? "—"}</div>
                          <div style={{ color: "var(--text-muted)", textTransform: "uppercase" }}>{r.caminhao?.placa ?? "—"}</div>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: "var(--text-sec)" }}>Pedidos</span>
                          <span style={{ fontWeight: 700 }}>{pedCount}</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill progress-blue" style={{ width: `${Math.min(pedCount * 5, 100)}%` }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--surface-low)" }}>
                        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); setDetailRoteiro(r); }}>Detalhes</button>
                        <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setSelected(r.numeroRoteiro); }}>
                          Ver Rota
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Frota */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "Manrope" }}>Gestão de Frota</h3>
            </div>
            <div className="table-wrap">
              {lcam ? (
                <Spinner />
              ) : !caminhoes || caminhoes.length === 0 ? (
                <EmptyState message="Nenhum veículo cadastrado." icon="local_shipping" />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Veículo / Placa</th>
                      <th>Capacidade</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caminhoes.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ padding: 6, background: "#eff6ff", borderRadius: 8, color: "#1d4ed8" }}>
                              <Icon name="local_shipping" className="sm" />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{c.placa}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.motorista}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "var(--text-sec)" }}>{c.capacidadeMaximaKg ? `${c.capacidadeMaximaKg.toLocaleString("pt-BR")} kg` : "—"}</td>
                        <td><Badge variant="green">Disponível</Badge></td>
                        <td style={{ textAlign: "right" }}>
                          <button className="icon-btn"><Icon name="more_vert" className="sm" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Detalhes da Rota */}
        <div style={{ position: "sticky", top: 80 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "Manrope" }}>Detalhes da Rota</h3>
          </div>
          {selectedRoteiro ? (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ background: "var(--primary)", padding: "20px 20px 16px", color: "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: "Manrope" }}>ROTA-{String(selectedRoteiro.numeroRoteiro).padStart(3, "0")}</h3>
                    <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                      {selectedRoteiro.caminhao?.placa ?? "—"} · {selectedRoteiro.data ? (Array.isArray(selectedRoteiro.data) ? new Date(selectedRoteiro.data[0], selectedRoteiro.data[1]-1, selectedRoteiro.data[2]).toLocaleDateString("pt-BR") : new Date(selectedRoteiro.data).toLocaleDateString("pt-BR")) : "—"}
                    </p>
                  </div>
                  <span style={{ background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>ATIVA</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 9, textTransform: "uppercase", opacity: 0.6, fontWeight: 700, marginBottom: 2 }}>Veículo</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedRoteiro.caminhao?.motorista ?? "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, textTransform: "uppercase", opacity: 0.6, fontWeight: 700, marginBottom: 2 }}>Pedidos</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedRoteiro.pedidos?.length ?? 0}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Paradas do Roteiro</h4>
                  <span style={{ fontSize: 10, background: "var(--surface-low)", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                    {selectedRoteiro.pedidos?.length ?? 0} pedidos
                  </span>
                </div>

                <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                  {selectedRoteiro.pedidos?.map((p, i) => (
                    <div key={p.numeroPedido} style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingBottom: 10, borderBottom: "1px solid var(--surface-low)" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>#{p.numeroPedido} · {p.cliente?.nome ?? "—"}</span>
                          {p.cliente?.bairro && (() => { const bc = getBairroColor(p.cliente.bairro); return (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999, background: bc.bg, color: bc.color, flexShrink: 0 }}>
                              {p.cliente.bairro}
                            </span>
                          ); })()}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.cliente?.endereco ?? "Endereço não informado"}
                        </div>
                      </div>
                      <button
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}
                        onClick={() => selectedRoteiro?.status !== "FINALIZADO" && remPedido(selectedRoteiro.numeroRoteiro, p.numeroPedido)}
                      >
                        <Icon name="close" className="sm" />
                      </button>
                    </div>
                  ))}
                  {(!selectedRoteiro.pedidos || selectedRoteiro.pedidos.length === 0) && (
                    <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                      Nenhuma parada neste roteiro.
                    </div>
                  )}
                </div>

                {pedidosPendentes.length > 0 && selectedRoteiro?.status !== "FINALIZADO" && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>Adicionar Pedido Pendente</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 180, overflowY: "auto" }}>
                      {pedidosPendentes.map((p) => {
                        const bc = getBairroColor(p.cliente?.bairro);
                        return (
                          <div
                            key={p.numeroPedido}
                            onClick={() => addPedido(selectedRoteiro.numeroRoteiro, p.numeroPedido)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "8px 10px", borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border)", background: "white",
                              cursor: "pointer", transition: "background 0.1s", fontSize: 12
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-low)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 700, color: "var(--primary)" }}>#{p.numeroPedido}</span>
                              <span style={{ fontWeight: 600 }}>{p.cliente?.nome ?? "—"}</span>
                            </div>
                            {p.cliente?.bairro && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: "2px 8px",
                                borderRadius: 999, background: bc.bg, color: bc.color
                              }}>
                                {p.cliente.bairro}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--surface-low)" }}>
                  {selectedRoteiro?.status !== "FINALIZADO" ? (
                    <button className="btn btn-danger btn-sm w-full" style={{ justifyContent: "center", width: "100%" }}
                      onClick={() => openFinalizar(selectedRoteiro)}>
                      Finalizar Rota
                    </button>
                  ) : (
                    <div style={{ textAlign: "center", padding: "8px", fontSize: 12, fontWeight: 700, color: "var(--green)" }}>
                      ✓ Roteiro Finalizado
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 40 }}>
              <EmptyState message="Selecione um roteiro para ver os detalhes." icon="route" />
            </div>
          )}
        </div>
      </div>

      {/* Roteiro Detail Modal */}
      <Modal
        open={!!detailRoteiro}
        onClose={() => setDetailRoteiro(null)}
        title="Detalhes do Roteiro"
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <button className="btn btn-primary btn-sm" onClick={() => generatePDF(detailRoteiro)}>
              <Icon name="print" className="sm" /> Gerar PDF
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setDetailRoteiro(null)}>Fechar</button>
          </div>
        }
      >
        {detailRoteiro && (
          <div>
            {/* Header */}
            <div style={{ background: "var(--primary)", borderRadius: "var(--radius-sm)", padding: "16px 20px", color: "white", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Roteiro</div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "Manrope" }}>ROTA-{String(detailRoteiro.numeroRoteiro).padStart(3, "0")}</div>
                </div>
                <span style={{ background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>ATIVA</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
                {[
                  { label: "Caminhão", value: detailRoteiro.caminhao?.placa ?? "—" },
                  { label: "Motorista", value: detailRoteiro.caminhao?.motorista ?? "—" },
                  { label: "Data", value: detailRoteiro.data ? (Array.isArray(detailRoteiro.data) ? new Date(detailRoteiro.data[0], detailRoteiro.data[1]-1, detailRoteiro.data[2]).toLocaleDateString("pt-BR") : new Date(detailRoteiro.data).toLocaleDateString("pt-BR")) : "—" },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 9, opacity: 0.6, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Capacidade */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: "var(--text-sec)" }}>Capacidade utilizada</span>
                <span style={{ fontWeight: 700 }}>
                  {(detailRoteiro.pedidos ?? []).reduce((acc, p) => acc + (p.pesoTotal ?? 0), 0).toFixed(1)} / {detailRoteiro.caminhao?.capacidadeMaximaKg?.toLocaleString("pt-BR") ?? "—"} kg
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill progress-blue" style={{
                  width: `${Math.min(((detailRoteiro.pedidos ?? []).reduce((acc, p) => acc + (p.pesoTotal ?? 0), 0) / (detailRoteiro.caminhao?.capacidadeMaximaKg ?? 1)) * 100, 100).toFixed(1)}%`
                }} />
              </div>
            </div>

            {/* Pedidos */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
                Pedidos ({(detailRoteiro.pedidos ?? []).length})
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                {(detailRoteiro.pedidos ?? []).length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Nenhum pedido neste roteiro.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--surface-low)", borderBottom: "1px solid var(--border)" }}>
                        <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", textAlign: "left" }}>Pedido</th>
                        <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", textAlign: "left" }}>Cliente</th>
                        <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", textAlign: "right" }}>Peso</th>
                        <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", textAlign: "right" }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detailRoteiro.pedidos ?? []).map((p) => (
                        <tr key={p.numeroPedido} style={{ borderBottom: "1px solid var(--surface-low)" }}>
                          <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--primary)", fontWeight: 700 }}>#{p.numeroPedido}</td>
                          <td style={{ padding: "10px 14px", fontSize: 13 }}>{p.cliente?.nome ?? "—"}</td>
                          <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "right" }}>{(p.pesoTotal ?? 0).toFixed(1)} kg</td>
                          <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "right", fontWeight: 700, fontFamily: "Manrope" }}>
                            R$ {(p.valorTotal ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Totais */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Total de Pedidos", value: (detailRoteiro.pedidos ?? []).length, color: "var(--primary)" },
                { label: "Peso Total", value: `${(detailRoteiro.pedidos ?? []).reduce((acc, p) => acc + (p.pesoTotal ?? 0), 0).toFixed(1)} kg`, color: "var(--text)" },
                { label: "Valor Total", value: `R$ ${(detailRoteiro.pedidos ?? []).reduce((acc, p) => acc + (p.valorTotal ?? 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "var(--green)" },
              ].map((s) => (
                <div key={s.label} style={{ background: "var(--surface-low)", borderRadius: "var(--radius-sm)", padding: "12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "Manrope", color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Finalizar Roteiro Modal */}
      <Modal
        open={showFinalizar}
        onClose={() => setShowFinalizar(false)}
        title="Fechar Roteiro"
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-sec)" }}>
              <strong>{Object.values(checkedPedidos).filter(Boolean).length}</strong> de <strong>{Object.keys(checkedPedidos).length}</strong> pedidos marcados como entregues
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowFinalizar(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={handleFinalizar} disabled={finalizando}>
                {finalizando ? "Finalizando…" : "Confirmar Fechamento"}
              </button>
            </div>
          </div>
        }
      >
        {roteiroToFinalizar && (
          <div>
            <div style={{ background: "var(--surface-low)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Roteiro</div>
              <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "Manrope" }}>
                ROTA-{String(roteiroToFinalizar.numeroRoteiro).padStart(3, "0")} · {roteiroToFinalizar.caminhao?.motorista ?? "—"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2 }}>
                Marque os pedidos que foram entregues. Os desmarcados permanecem como Pendente.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(roteiroToFinalizar.pedidos ?? []).map((p) => (
                <label key={p.numeroPedido} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  border: `1.5px solid ${checkedPedidos[p.numeroPedido] ? "var(--green)" : "var(--border-med)"}`,
                  borderRadius: "var(--radius-sm)", cursor: "pointer",
                  background: checkedPedidos[p.numeroPedido] ? "#f0fdf4" : "white",
                  transition: "all 0.15s"
                }}>
                  <input
                    type="checkbox"
                    checked={!!checkedPedidos[p.numeroPedido]}
                    onChange={(e) => setCheckedPedidos(prev => ({ ...prev, [p.numeroPedido]: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: "var(--green)", cursor: "pointer" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      #{p.numeroPedido} · {p.cliente?.nome ?? "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {p.cliente?.endereco ?? ""}{p.cliente?.bairro ? ` · ${p.cliente.bairro}` : ""} · R$ {(p.valorTotal ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <Badge variant={checkedPedidos[p.numeroPedido] ? "green" : "amber"}>
                    {checkedPedidos[p.numeroPedido] ? "Entregue" : "Pendente"}
                  </Badge>
                </label>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* New Roteiro Modal */}
      <Modal open={showNewRoteiro} onClose={() => setShowNewRoteiro(false)} title="Criar Roteiro"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowNewRoteiro(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={createRoteiro} disabled={saving}>{saving ? "Criando…" : "Criar Roteiro"}</button>
          </>
        }
      >
        <div className="form-group">
          <label>Caminhão</label>
          <select className="form-input" value={rForm.caminhaoId} onChange={(e) => setRForm({ ...rForm, caminhaoId: e.target.value })} required>
            <option value="">Selecione um caminhão…</option>
            {(caminhoes ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.placa} · {c.motorista}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Data</label>
          <input className="form-input" type="date" value={rForm.data} onChange={(e) => setRForm({ ...rForm, data: e.target.value })} />
        </div>
      </Modal>

      {/* New Caminhão Modal */}
      <Modal open={showNewCam} onClose={() => setShowNewCam(false)} title="Cadastrar Veículo"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowNewCam(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={createCaminhao} disabled={saving}>{saving ? "Salvando…" : "Cadastrar"}</button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label>Placa</label>
            <input className="form-input" value={cForm.placa} onChange={(e) => setCForm({ ...cForm, placa: e.target.value })} placeholder="ABC-1234" required />
          </div>
          <div className="form-group">
            <label>Capacidade Máxima (kg)</label>
            <input className="form-input" type="number" value={cForm.capacidadeMaximaKg} onChange={(e) => setCForm({ ...cForm, capacidadeMaximaKg: e.target.value })} placeholder="8000" required />
          </div>
        </div>
        <div className="form-group">
          <label>Motorista</label>
          <input className="form-input" value={cForm.motorista} onChange={(e) => setCForm({ ...cForm, motorista: e.target.value })} placeholder="Nome do motorista" />
        </div>
      </Modal>
    </div>
  );
}

// ─── Bairro color palette ─────────────────────────────────────────────────────
const BAIRRO_COLORS = [
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#fce7f3", color: "#9d174d" },
  { bg: "#ede9fe", color: "#5b21b6" },
  { bg: "#ffedd5", color: "#9a3412" },
  { bg: "#e0f2fe", color: "#0369a1" },
  { bg: "#f0fdf4", color: "#166534" },
];

const bairroColorCache = {};
let bairroColorIdx = 0;

function getBairroColor(bairro) {
  if (!bairro) return { bg: "#f1f5f9", color: "#475569" };
  if (!bairroColorCache[bairro]) {
    bairroColorCache[bairro] = BAIRRO_COLORS[bairroColorIdx % BAIRRO_COLORS.length];
    bairroColorIdx++;
  }
  return bairroColorCache[bairro];
}

// ─── ESTOQUE PAGE ─────────────────────────────────────────────────────────────
const PRODUTO_LABELS = {
  GARRAFAO_REPOSICAO:   { label: "Garrafão 20L",               icon: "water_drop", min: 20 },
  PACOTE_BABY:          { label: "Pacote Baby 300ml",          icon: "water",      min: 10 },
  PACOTE_COPINHO:       { label: "Pacote Copinho 200ml",       icon: "water",      min: 10 },
  PACOTE_500ML_COM_GAS: { label: "Pacote 500ml c/ Gás",        icon: "bubble_chart", min: 8 },
  PACOTE_500ML_SEM_GAS: { label: "Pacote 500ml s/ Gás",        icon: "bubble_chart", min: 8 },
};

function getStockStatus(quantidade, min) {
  if (quantidade === 0) return { label: "Sem Estoque", variant: "red", color: "var(--error)", pct: 0 };
  if (quantidade <= min * 0.3) return { label: "Crítico", variant: "red", color: "var(--error)", pct: Math.min((quantidade / min) * 100, 100) };
  if (quantidade <= min) return { label: "Baixo", variant: "amber", color: "var(--amber)", pct: Math.min((quantidade / min) * 100, 100) };
  return { label: "Adequado", variant: "green", color: "var(--green)", pct: Math.min((quantidade / (min * 3)) * 100, 100) };
}

function EstoquePage() {
  const { data, loading, error, refetch } = useFetch(() => api.estoque.listar());
  const [showRepor, setShowRepor] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [qtdRepor, setQtdRepor] = useState(10);
  const [saving, setSaving] = useState(false);

  const estoqueMap = {};
  (data ?? []).forEach(e => { estoqueMap[e.produto] = e.quantidade; });

  const total = Object.keys(PRODUTO_LABELS).reduce((a, k) => a + (estoqueMap[k] ?? 0), 0);
  const criticos = Object.entries(PRODUTO_LABELS).filter(([p, meta]) => (estoqueMap[p] ?? 0) <= meta.min * 0.3).length;
  const baixos = Object.entries(PRODUTO_LABELS).filter(([p, meta]) => {
    const q = estoqueMap[p] ?? 0;
    return q > meta.min * 0.3 && q <= meta.min;
  }).length;

  async function handleRepor(e) {
    e.preventDefault();
    if (!selectedProduto) return;
    setSaving(true);
    try {
      await api.estoque.repor(selectedProduto, Number(qtdRepor));
      setShowRepor(false);
      setSelectedProduto(null);
      setQtdRepor(10);
      refetch();
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <Topbar searchPlaceholder="Buscar produtos…" />

      <div className="page-header">
        <div>
          <h2>Gestão de Estoque</h2>
          <p>Monitoramento em tempo real dos níveis de suprimento.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowRepor(true)}>
          <Icon name="add_circle" className="sm" /> Repor Estoque
        </button>
      </div>

      {/* KPIs */}
      <div className="grid-3 mb-6">
        <div className="stat-card">
          <div className="stat-label">Total em Estoque <Icon name="inventory_2" className="sm" style={{ color: "var(--primary)" }} /></div>
          <div className="stat-val">{total}</div>
          <div className="stat-sub" style={{ color: "var(--text-sec)" }}>unidades totais</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Produtos Críticos <Icon name="warning" className="sm" style={{ color: "var(--error)" }} /></div>
          <div className="stat-val" style={{ color: "var(--error)" }}>{criticos}</div>
          <div className="stat-sub" style={{ color: "var(--error)" }}>{criticos > 0 ? "reposição urgente" : "tudo ok"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Nível Baixo <Icon name="trending_down" className="sm" style={{ color: "var(--amber)" }} /></div>
          <div className="stat-val" style={{ color: "var(--amber)" }}>{baixos}</div>
          <div className="stat-sub" style={{ color: "var(--amber)" }}>{baixos > 0 ? "atenção necessária" : "tudo ok"}</div>
        </div>
      </div>

      {/* Stock table */}
      <div className="table-wrap">
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
          <>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "white" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "Manrope" }}>Catálogo de Produtos</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Código</th>
                  <th style={{ width: 200 }}>Nível Atual</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(PRODUTO_LABELS).map(([key, meta]) => {
                  const qtd = estoqueMap[key] ?? 0;
                  const status = getStockStatus(qtd, meta.min);
                  return (
                    <tr key={key}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, background: "var(--surface-high)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon name={meta.icon} className="sm" style={{ color: "var(--primary)" }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{meta.label}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Mín. recomendado: {meta.min} un.</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{key}</span></td>
                      <td>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700 }}>{qtd} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>un.</span></span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: status.color }}>{status.label}</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${status.pct}%`, background: status.color }} />
                          </div>
                        </div>
                      </td>
                      <td><Badge variant={status.variant}>{status.label}</Badge></td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--primary)" }}
                          onClick={() => { setSelectedProduto(key); setQtdRepor(10); setShowRepor(true); }}
                        >
                          <Icon name="add_circle" className="sm" /> Repor
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Repor Modal */}
      <Modal
        open={showRepor}
        onClose={() => { setShowRepor(false); setSelectedProduto(null); }}
        title="Repor Estoque"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowRepor(false); setSelectedProduto(null); }}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleRepor} disabled={saving}>
              {saving ? "Salvando…" : "Confirmar Reposição"}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Produto</label>
          <select
            className="form-input"
            value={selectedProduto ?? ""}
            onChange={(e) => setSelectedProduto(e.target.value)}
            required
          >
            <option value="">Selecione um produto…</option>
            {Object.entries(PRODUTO_LABELS).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label} (atual: {estoqueMap[key] ?? 0} un.)
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Quantidade a repor</label>
          <input
            className="form-input"
            type="number"
            min="1"
            value={qtdRepor}
            onChange={(e) => setQtdRepor(e.target.value)}
          />
        </div>
        {selectedProduto && (
          <div style={{ background: "var(--surface-low)", borderRadius: "var(--radius-sm)", padding: "12px 14px", fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-sec)" }}>Estoque atual:</span>
              <span style={{ fontWeight: 700 }}>{estoqueMap[selectedProduto] ?? 0} un.</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ color: "var(--text-sec)" }}>Após reposição:</span>
              <span style={{ fontWeight: 700, color: "var(--green)" }}>{(estoqueMap[selectedProduto] ?? 0) + Number(qtdRepor)} un.</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");

  const pages = {
    dashboard: DashboardPage,
    clientes: ClientesPage,
    pedidos: PedidosPage,
    roteiros: RoteirosPage,
    estoque: EstoquePage,
  };

  const Page = pages[page] ?? DashboardPage;

  return (
    <>
      <style>{CSS}</style>
      <Sidebar page={page} setPage={setPage} />
      <div className="main">
        <Page setPage={setPage} />
      </div>
    </>
  );
}
