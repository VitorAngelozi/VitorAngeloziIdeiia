# 🔐 Autenticação - Admin vs Normal

## Tipos de Usuários

### 👤 Usuário Normal
- Pode criar/visualizar orçamentos
- Pode alterar apenas orçamentos em status "Rascunho"
- **Não pode**: Aprovar orçamentos
- **Não pode**: Acessar relatórios admin

### 👨‍💼 Usuário Admin
- Pode fazer tudo que um usuário normal faz
- Pode aprovar orçamentos
- Pode acessar relatórios e auditoria completa
- Pode gerenciar usuários

---

## Como Criar Usuários

### Opção 1: Via Script Python (Recomendado)

Execute este script:
```bash
python criar_usuarios.py
```

Ele criará automaticamente:
- Admin: `admin` / `senha123`
- Usuário normal: `usuario` / `senha123`

### Opção 2: Criar Usuário via API e Promover a Admin

#### 1. Primeiro, criar um usuário normal
```bash
POST http://localhost:8000/auth/registro
Content-Type: application/json

{
  "username": "joao",
  "password": "senha123",
  "email": "joao@empresa.com"
}
```

#### 2. Depois, usar um Admin existente para promover o usuário
```bash
POST http://localhost:8000/auth/promover-admin/joao
Authorization: Bearer seu_token_admin_aqui
```

**Response:**
```json
{
  "message": "Usuário joao foi promovido a administrador",
  "usuario": {
    "id": 2,
    "username": "joao",
    "email": "joao@empresa.com",
    "admin": 1
  }
}
```

### Opção 3: Promover Usuário Existente a Admin

Se você já tem um usuário criado e quer promovê-lo a admin:

```bash
POST http://localhost:8000/auth/promover-admin/{username}
Authorization: Bearer seu_token_admin_aqui
```

**Exemplo:**
```bash
POST http://localhost:8000/auth/promover-admin/usuario
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Como Remover Privilégios de Admin

Um admin pode remover privilégios de admin de outro usuário usando:

```bash
POST http://localhost:8000/auth/remover-admin/{username}
Authorization: Bearer seu_token_admin_aqui
```

**Exemplo:**
```bash
POST http://localhost:8000/auth/remover-admin/joao
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Nota:** Um admin não pode remover seus próprios privilégios.

---

## Como Fazer Login

### 1. Obter Token
```bash
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "senha123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@empresa.com",
    "admin": 1
  }
}
```

### 2. Usar Token em Requisições

Adicione o token no header `Authorization`:

```bash
GET http://localhost:8000/orcamentos
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Diferenças de Permissões

| Ação | Normal | Admin |
|------|--------|-------|
| Criar orçamento | ✅ | ✅ |
| Editar orçamento (rascunho) | ✅ | ✅ |
| Editar orçamento (aprovado) | ❌ | ❌ |
| Aprovar orçamento | ❌ | ✅ |
| Ver auditoria | ✅ | ✅ |
| Deletar orçamento | ✅ | ✅ |
| Gerenciar usuários | ❌ | ✅ |

---

## Uso no Swagger

### 1. Abra http://localhost:8000/docs

### 2. Procure o endpoint `/auth/login`

### 3. Clique em "Try it out"

### 4. Insira credenciais:
```json
{
  "username": "admin",
  "password": "senha123"
}
```

### 5. Copie o `access_token`

### 6. Clique no botão "Authorize" (cadeado 🔒)

### 7. Cole o token no formato:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 8. Agora todos os endpoints estarão autenticados!

---

## Credenciais Padrão

Após rodar `criar_usuarios.py`:

| Usuário | Senha | Tipo |
|---------|-------|------|
| admin | senha123 | Admin |
| usuario | senha123 | Normal |

**⚠️ Mude essas senhas em produção!**

---

## Resolvendo Problemas

### Erro: "Username already exists"
Significa que o usuário já foi criado. Faça login ao invés.

### Erro: "Invalid credentials"
Verifique username e password - são case-sensitive.

### Erro: "Token expired"
Faça login novamente para obter um novo token.

### Não aparece o botão "Authorize" no Swagger
Significa que a autenticação JWT não está completamente implementada. Use a API manualmente com headers.
