# AquaERP — Frontend React

Frontend completo para o sistema AquaERP, desenvolvido em React + Vite.

## Pré-requisitos
- Node.js 18+
- Backend Spring Boot rodando em `http://localhost:8080`

## Como rodar

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173

## Estrutura de Pastas

```
src/
├── App.jsx              # App principal (todos os componentes e páginas)
├── main.jsx             # Entry point
├── services/
│   └── api.js           # Serviços de API (fetch para o backend)
└── hooks/
    └── useFetch.js      # Hook para busca de dados com loading/error
```

## Endpoints utilizados

| Recurso   | Endpoint                            | Método  |
|-----------|-------------------------------------|---------|
| Clientes  | GET /api/clientes/todos             | Listar  |
| Clientes  | GET /api/clientes/buscar?nome=      | Buscar  |
| Clientes  | POST /api/clientes                  | Criar   |
| Clientes  | PATCH /api/clientes/{id}/toggle     | Toggle  |
| Pedidos   | GET /api/pedidos                    | Listar  |
| Pedidos   | POST /api/pedidos                   | Criar   |
| Pedidos   | PATCH /api/pedidos/{id}/status      | Status  |
| Roteiros  | GET /api/roteiros?data=             | Listar  |
| Roteiros  | POST /api/roteiros                  | Criar   |
| Caminhões | GET /api/roteiros/caminhoes         | Listar  |
| Caminhões | POST /api/roteiros/caminhoes        | Criar   |
| Roteiros  | POST /api/roteiros/{id}/pedidos     | Add     |
| Roteiros  | DELETE /api/roteiros/{id}/pedidos/{pid} | Remove |

## Páginas

- **Dashboard** — visão geral com KPIs
- **Clientes** — CRUD completo com filtros por tipo/status
- **Pedidos** — gestão de pedidos com filtro por status, atualização de status
- **Roteiros** — gestão de frota e roteirização de entregas
