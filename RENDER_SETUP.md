# Configuração no Render

## ✅ Checklist de confirmação

| Item | Status |
|------|--------|
| **DB** – PostgreSQL conectado (Internal URL) | ✅ OK |
| **Backend** – DATABASE_URL no Environment | ✅ OK (Admin encontrado nos logs) |
| **Backend** – Login retorna 200 | ✅ OK |
| **Backend** – uvicorn rodando na porta certa | ✅ OK |
| **Frontend** – VITE_API_URL = URL do backend | ⚠️ Confirmar |
| **Frontend** – Redirect /* → /index.html | ⚠️ Confirmar no Dashboard |
| **401 em /clientes, /contratos, /projetos** | Ver seção "401 após login" abaixo |

---

### 401 após login — o que conferir

O login retorna 200, mas /clientes, /contratos e /projetos retornam 401 (são protegidos). `/orcamentos` retorna 200 porque é público.

1. **No frontend** – variável `VITE_API_URL` deve ser exatamente `https://vitorangeloziideiia.onrender.com`. Se estiver errada, faça um novo deploy do frontend após corrigir.
2. **DevTools (F12) → Network** – ao fazer login e carregar o dashboard, verifique se as requisições para `/clientes`, `/contratos` e `/projetos` incluem o header `Authorization: Bearer ...`. Se não tiver, o token não está sendo enviado.
3. **`client.ts`** – ao receber 401, agora chama `logout()` para limpar o estado persistido e evitar loop de requisições sem token.

---

## Backend (Web Service - vitorangeloziideiia)

### Environment Variables obrigatórias

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://ust_gestao_db_user:lvkeziK1zDhgsfNobRjFq53u715F2ZDM@dpg-d6b7qs0gjchc73af2nd0-a/ust_gestao_db` |

Se você conectou o banco pelo menu "Add from Render PostgreSQL", o Render pode ter adicionado automaticamente. Confira em: **Dashboard → Seu backend → Environment**.

Se não aparecer, adicione manualmente com o valor acima.

### Variável opcional (CORS)

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://ust-gestao-frontend.onrender.com` |

---

## Frontend (Static Site - ust-gestao-frontend)

### Corrigir 404 em rotas como /login

O React Router controla as rotas no navegador. Ao acessar diretamente `/login` (ou dar refresh), o Render tenta servir um arquivo físico `/login`, que não existe → 404.

**Solução no Render Dashboard:**

1. Vá em **Dashboard → ust-gestao-frontend → Settings**
2. Procure a seção **Redirects/Rewrites** (ou **Build & Deploy**)
3. Adicione uma regra:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** Rewrite

Assim todas as rotas servem `index.html` e o React Router trata no cliente.

Um arquivo `frontend/public/_redirects` também foi adicionado — alguns hosts o reconhecem automaticamente.

---

### Variável obrigatória para o login funcionar

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://vitorangeloziideiia.onrender.com` |

⚠️ **Importante:** Se `VITE_API_URL` estiver com valor errado (ex: hash como `1977ce9fc61c5d9c58e9805a1f070f45`), o frontend chama a API no lugar errado e o login não funciona. Corrija para a URL do backend acima.

---

## Após alterar variáveis

1. **Backend** – Render faz redeploy automático ao salvar.
2. **Frontend** – Faça **Manual Deploy** ou dê um novo commit, pois variáveis de ambiente exigem novo build.

---

## Credenciais do admin

- **Username:** admin  
- **Password:** admin123  

(mudar em produção!)
