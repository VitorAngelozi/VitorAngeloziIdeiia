# 🔐 Sistema de Autenticação Implementado

## Resumo

O sistema de autenticação foi **completamente implementado** com:

### ✅ Funcionalidades de Autenticação

1. **Registro de Usuários** → `POST /auth/registro`
   - Cria novo usuário com username, password, email
   - Hash seguro de senha (SHA256)
   - Validação de duplicidade

2. **Login com JWT** → `POST /auth/login`
   - Retorna token JWT válido por 8 horas
   - Token inclui username do usuário
   - Algoritmo: HS256

3. **Obter Usuário Logado** → `GET /auth/me`
   - Retorna dados do usuário autenticado
   - Requer token válido

### ✅ Gerenciamento de Usuários (ADMIN ONLY)

4. **Listar Usuários** → `GET /auth/usuarios`
   - Apenas admins podem listar
   - Retorna todos os usuários do sistema

5. **Obter Usuário** → `GET /auth/usuarios/{id}`
   - Admin vê qualquer usuário
   - Usuário comum vê apenas suas próprias informações

6. **Deletar Usuário** → `DELETE /auth/usuarios/{id}`
   - Apenas admin
   - Admin não pode deletar a si mesmo

7. **Promover a Admin** → `POST /auth/usuarios/{id}/promote`
   - Apenas admin existente
   - Converte usuário comum em administrador

8. **Remover Admin** → `POST /auth/usuarios/{id}/demote`
   - Apenas admin existente
   - Admin não pode remover suas próprias permissões

---

## Credentials Padrão

```
Username: admin
Password: admin123
Email:    admin@exemplo.com
Admin:    Sim ✓
```

**⚠️ ALTERE ISSO EM PRODUÇÃO!**

---

## Como Usar

### 1. Registrar Novo Usuário

```bash
curl -X POST http://localhost:8000/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "username": "joao",
    "password": "senha123",
    "email": "joao@exemplo.com"
  }'
```

### 2. Fazer Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "joao",
    "password": "senha123"
  }'
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "usuario": {
    "id": 1,
    "username": "joao",
    "email": "joao@exemplo.com",
    "admin": 0
  }
}
```

### 3. Usar Token em Requisições

```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Admin Promover Usuário

```bash
# Login como admin primeiro
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Depois promover usuário (substitua 1 pelo ID do usuário)
curl -X POST http://localhost:8000/auth/usuarios/1/promote \
  -H "Authorization: Bearer {admin_token}"
```

---

## Proteção de Endpoints

A maioria dos endpoints do sistema exigem autenticação:

| Endpoint | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/catalogo` | ✓ | ✓(A) | ✓(A) | ✓(A) |
| `/clientes` | ✓ | ✓(A) | ✓(A) | ✓(A) |
| `/contratos` | ✓ | ✓(A) | ✓(A) | ✓(A) |
| `/projetos` | ✓ | ✓(A) | ✓(A) | ✓(A) |
| `/orcamentos` | ✓ | ✓ | ✓ | ✓(A) |
| `/auth/**` | ✓ | ✓ | - | ✓(A) |

**✓** = Requer token  
**(A)** = Requer admin

---

## Testes

Execute o script de testes:

```bash
python test_auth.py
```

Resultado esperado:
- ✅ Registro: 201 Created
- ✅ Login: 200 OK
- ✅ Get Me: 200 OK
- ✅ Listar: 200 OK (admin)
- ✅ Promover: 200 OK (admin)
- ✅ Sem token: 401 Unauthorized

---

## Estrutura no Código

### `auth_routes.py`
- `hash_password()` - Hash SHA256 de senhas
- `criar_access_token()` - Gera JWT token
- `verificar_token()` - Dependency para autenticação
- `verificar_admin()` - Dependency para admin only

### `models.py`
- `Usuario` - Modelo do usuário com campos: id, username, password_hash, email, admin

### `schemas.py`
- `UsuarioCreate` - Schema para registro
- `UsuarioLogin` - Schema para login
- `UsuarioResponse` - Schema de resposta

### `init_admin.py`
- Script para criar primeiro admin (execute uma única vez)

---

## Segurança

✅ Senhas são hashadas com SHA256
✅ JWT com expiração de 8 horas
✅ Endpoints admin protegidos
✅ Validação de duplicidade (username, email)
✅ Usuários novos começam como comum (não admin)

⚠️ **Para Produção:**
- Use SECRET_KEY forte
- Use HTTPS
- Considere adicionar rate limiting
- Considere adicionar 2FA
- Use bcrypt ao invés de SHA256
- Armazene senhas em variáveis de ambiente

---

## Próximos Passos (Opcional)

- [ ] Adicionar refresh tokens
- [ ] Implementar 2FA (autenticação de dois fatores)
- [ ] Logout e invalidação de tokens
- [ ] Rate limiting em login
- [ ] Logs de auditoria de acesso
- [ ] Recuperação de senha por email
- [ ] Social login (Google, GitHub, etc)
