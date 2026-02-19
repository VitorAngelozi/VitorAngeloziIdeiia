# 📊 API de Gestão de Orçamentos com UST

Sistema robusto de orçamentos corporativos baseado em **Unidade de Serviço Técnico (UST)** desenvolvido com **FastAPI** e **SQLAlchemy**.

## 🎯 Objetivo do Projeto

Automatizar cálculos financeiros de orçamentos, garantindo:
- ✅ Precisão monetária com 4 casas decimais
- ✅ Integridade histórica (imutabilidade após aprovação)
- ✅ Snapshot de dados para evitar alterações retroativas
- ✅ Regras de negócio corporativas

---

## 🧠 Conceito Central: UST

O valor de um orçamento é calculado usando a seguinte fórmula:

```
ust_item = complexidade_ust × horas_estimadas
valor_item_bruto = ust_item × valor_ust_contrato
```

**Onde:**
- `complexidade_ust` → vem da Atividade (quanto trabalho técnico é necessário)
- `horas_estimadas` → informada pelo usuário ao criar o orçamento
- `valor_ust` → definido no Contrato (R$ por UST)

### Exemplo Prático

**Contrato:**
- valor_ust = R$ 185,00

**Atividade:**
- complexidade_ust = 2,5

**Horas estimadas:** 16,0

**Cálculo:**
```
ust_item = 2,5 × 16,0 = 40,00 UST
valor_item_bruto = 40,00 × 185,00 = R$ 7.400,00
```

---

## 🏗 Arquitetura do Domínio

O sistema trabalha com uma hierarquia de serviços:

```
Ciclo (ex: Desenvolvimento de Projeto)
 └── Fase (ex: Análise e Design)
      └── Atividade (ex: Levantamento de Requisitos)
           └── Gera valor financeiro
```

**Importante:** Apenas Atividades geram custo financeiro.

---

## 🗂 Estrutura de Entidades

### 👥 Cliente
```json
{
  "razao_social": "Empresa XYZ Ltda",
  "cnpj": "12.345.678/0001-90"
}
```

### 📋 Contrato
```json
{
  "numero_contrato": "CT-2024-001",
  "cliente_id": 1,
  "valor_ust": 185.00,
  "data_inicio": "2024-01-15",
  "data_fim": "2024-12-31",
  "status": "ativo"
}
```

### 🔧 Serviço Catálogo
```json
{
  "codigo": "SRV-001",
  "nome": "Desenvolvimento de Software",
  "tipo": "CICLO",
  "complexidade_ust": 0.0
}
```

### 🎯 Projeto
```json
{
  "nome": "Sistema de Vendas",
  "codigo": "PRJ-2024-001",
  "cliente_id": 1,
  "contrato_id": 1,
  "status": "ativo"
}
```

### 📄 Orçamento
```json
{
  "numero_orcamento": "ORC/2024/1/000001",
  "projeto_id": 1,
  "contrato_id": 1,
  "data_emissao": "2024-02-15",
  "status": "Rascunho",
  "versao": "1.0",
  "valor_total_bruto": 50000.00,
  "desconto_percentual": 10.00,
  "valor_total_liquido": 45000.00,
  "itens": [...]
}
```

---

## ⚙ Fluxo Principal: Criar Orçamento

### Passo 1: Preparação
1. Cliente deve estar cadastrado
2. Contrato deve estar ativo e ter `valor_ust` definido
3. Projeto deve existir

### Passo 2: Estrutura de Serviços
Criar a hierarquia no catálogo:
```
POST /catalogo/servicos       → Criar CICLO
POST /catalogo/ciclos         → Registrar ciclo
POST /catalogo/servicos       → Criar FASE
POST /catalogo/fases          → Registrar fase
POST /catalogo/servicos       → Criar ATIVIDADE
POST /catalogo/atividades     → Registrar atividade
```

### Passo 3: Criar Orçamento
```json
POST /orcamentos/
{
  "contrato_id": 1,
  "projeto_id": 1,
  "desconto_percentual": 10.00,
  "itens": [
    {
      "atividade_id": 1,
      "horas_estimadas": 16.0
    },
    {
      "atividade_id": 2,
      "horas_estimadas": 8.5
    }
  ]
}
```

### Validações Obrigatórias
- ❌ Contrato deve estar **ativo**
- ❌ Contrato deve ter `valor_ust` **diferente de NULL**
- ❌ Projeto deve **existir**
- ❌ Pelo menos **1 item com horas > 0**
- ❌ Todas as atividades devem **existir**

---

## 🧮 Regras de Cálculo

### Para cada Item do Orçamento
```
subtotal_ust = complexidade_ust × horas_estimadas
subtotal_bruto = subtotal_ust × valor_ust
```

### Agregações
```
valor_total_bruto = Σ(subtotal_bruto)
valor_desconto = valor_total_bruto × (desconto_percentual / 100)
valor_total_liquido = valor_total_bruto - valor_desconto
```

### Exemplo Completo

**Orçamento com 2 itens:**

| Item | Atividade | Complexidade | Horas | Subtotal UST | Valor UST | Subtotal Bruto |
|------|-----------|--------------|-------|--------------|-----------|----------------|
| 1    | Análise   | 2,5          | 16,0  | 40,00        | 185,00    | 7.400,00       |
| 2    | Design    | 1,8          | 8,5   | 15,30        | 185,00    | 2.830,50       |

**Cálculos finais:**
```
Valor Total Bruto: 10.230,50
Desconto (12%): 1.227,66
Valor Total Líquido: 9.002,84
```

---

## 📚 Endpoints da API

### 🏠 Geral
```
GET  /              → Informações da API
GET  /health        → Health check
GET  /docs          → Swagger UI
GET  /redoc         → ReDoc
```

### 👥 Clientes
```
POST   /clientes/              → Criar cliente
GET    /clientes/              → Listar clientes (com paginação)
GET    /clientes/{cliente_id}  → Obter cliente
PUT    /clientes/{cliente_id}  → Atualizar cliente
DELETE /clientes/{cliente_id}  → Deletar cliente
```

### 📋 Contratos
```
POST   /contratos/                     → Criar contrato
GET    /contratos/                     → Listar contratos
GET    /contratos/{contrato_id}        → Obter contrato
PUT    /contratos/{contrato_id}        → Atualizar contrato
PATCH  /contratos/{contrato_id}/desativar → Desativar contrato
DELETE /contratos/{contrato_id}        → Deletar contrato
```

### 🎯 Projetos
```
POST   /projetos/                      → Criar projeto
GET    /projetos/                      → Listar projetos
GET    /projetos/{projeto_id}          → Obter projeto
PUT    /projetos/{projeto_id}          → Atualizar projeto
PATCH  /projetos/{projeto_id}/desativar → Desativar projeto
DELETE /projetos/{projeto_id}          → Deletar projeto
```

### 🔧 Catálogo (Serviços e Hierarquia)
```
POST   /catalogo/servicos              → Criar serviço
GET    /catalogo/servicos              → Listar serviços
GET    /catalogo/servicos/{servico_id} → Obter serviço

POST   /catalogo/ciclos                → Criar ciclo
GET    /catalogo/ciclos                → Listar ciclos

POST   /catalogo/fases                 → Criar fase
GET    /catalogo/fases                 → Listar fases
GET    /catalogo/fases/{fase_id}       → Obter fase

POST   /catalogo/atividades            → Criar atividade
GET    /catalogo/atividades            → Listar atividades
GET    /catalogo/atividades/{atividade_id} → Obter atividade
```

### 📄 Orçamentos
```
POST   /orcamentos/                    → Criar orçamento
GET    /orcamentos/                    → Listar orçamentos (com filtros)
GET    /orcamentos/{orcamento_id}      → Obter orçamento
PUT    /orcamentos/{orcamento_id}      → Atualizar orçamento (apenas Rascunho)
PATCH  /orcamentos/{orcamento_id}/aprovar → Aprovar orçamento (torna imutável)
DELETE /orcamentos/{orcamento_id}      → Deletar orçamento (apenas Rascunho)
```

---

## 🚀 Como Usar

### 1️⃣ Instalação

**Pré-requisitos:**
- Python 3.9+
- pip

**Clone o repositório:**
```bash
cd python_rush
```

**Crie um ambiente virtual:**
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
# ou source .venv/bin/activate  # Linux/Mac
```

**Instale as dependências:**
```bash
pip install fastapi uvicorn sqlalchemy pydantic python-multipart
```

**Ou use o arquivo requirements.txt:**
```bash
pip install -r requirements.txt
```

### 2️⃣ Executar a API

```bash
uvicorn main:app --reload
```

A API estará disponível em: **http://localhost:8000**

**Documentação interativa:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3️⃣ Fluxo Prático Completo

#### Criar um Cliente
```bash
curl -X POST http://localhost:8000/clientes/ \
  -H "Content-Type: application/json" \
  -d '{
    "razao_social": "Empresa ABC Ltda",
    "cnpj": "11.222.333/0001-44"
  }'
```

**Resposta:**
```json
{
  "id": 1,
  "razao_social": "Empresa ABC Ltda",
  "cnpj": "11.222.333/0001-44"
}
```

#### Criar um Contrato
```bash
curl -X POST http://localhost:8000/contratos/ \
  -H "Content-Type: application/json" \
  -d '{
    "numero_contrato": "CT-2024-001",
    "cliente_id": 1,
    "valor_ust": 185.00,
    "data_inicio": "2024-01-15",
    "data_fim": "2024-12-31",
    "status": "ativo"
  }'
```

#### Criar um Projeto
```bash
curl -X POST http://localhost:8000/projetos/ \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Sistema de Vendas",
    "codigo": "PRJ-2024-001",
    "cliente_id": 1,
    "contrato_id": 1,
    "status": "ativo"
  }'
```

#### Criar Catálogo de Serviços

**1. Criar Serviço CICLO:**
```bash
curl -X POST http://localhost:8000/catalogo/servicos \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "CICLO-001",
    "nome": "Desenvolvimento do Projeto",
    "tipo": "CICLO",
    "complexidade_ust": 0
  }'
```

**2. Registrar Ciclo:**
```bash
curl -X POST http://localhost:8000/catalogo/ciclos \
  -H "Content-Type: application/json" \
  -d '{
    "servico_catalogo_id": 1
  }'
```

**3. Criar Serviço FASE:**
```bash
curl -X POST http://localhost:8000/catalogo/servicos \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "FASE-001",
    "nome": "Análise e Design",
    "tipo": "FASE",
    "complexidade_ust": 0
  }'
```

**4. Registrar Fase:**
```bash
curl -X POST http://localhost:8000/catalogo/fases \
  -H "Content-Type: application/json" \
  -d '{
    "servico_catalogo_id": 2,
    "ciclo_id": 1
  }'
```

**5. Criar Serviço ATIVIDADE:**
```bash
curl -X POST http://localhost:8000/catalogo/servicos \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "ATIV-001",
    "nome": "Levantamento de Requisitos",
    "tipo": "ATIVIDADE",
    "complexidade_ust": 2.5
  }'
```

**6. Registrar Atividade:**
```bash
curl -X POST http://localhost:8000/catalogo/atividades \
  -H "Content-Type: application/json" \
  -d '{
    "servico_catalogo_id": 3,
    "fase_id": 1,
    "complexidade_ust": 2.5
  }'
```

#### Criar Orçamento
```bash
curl -X POST http://localhost:8000/orcamentos/ \
  -H "Content-Type: application/json" \
  -d '{
    "contrato_id": 1,
    "projeto_id": 1,
    "desconto_percentual": 12.5,
    "itens": [
      {
        "atividade_id": 1,
        "horas_estimadas": 16.0
      }
    ]
  }'
```

**Resposta:**
```json
{
  "id": 1,
  "numero_orcamento": "ORC/2024/1/000001",
  "projeto_id": 1,
  "contrato_id": 1,
  "data_emissao": "2024-02-15",
  "status": "Rascunho",
  "versao": "1.0",
  "valor_total_bruto": 7400.00,
  "desconto_percentual": 12.5,
  "valor_total_liquido": 6475.00,
  "itens": [
    {
      "id": 1,
      "atividade_id": 1,
      "horas_estimadas": 16.0,
      "sequencia": 1,
      "subtotal_ust": 40.00,
      "subtotal_bruto": 7400.00
    }
  ]
}
```

#### Listar Orçamentos
```bash
curl -X GET "http://localhost:8000/orcamentos/?skip=0&limit=10"
```

#### Obter Orçamento Específico
```bash
curl -X GET http://localhost:8000/orcamentos/1
```

#### Atualizar Orçamento (apenas se Rascunho)
```bash
curl -X PUT http://localhost:8000/orcamentos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "contrato_id": 1,
    "projeto_id": 1,
    "desconto_percentual": 15.0,
    "itens": [
      {
        "atividade_id": 1,
        "horas_estimadas": 20.0
      }
    ]
  }'
```

#### Aprovar Orçamento
```bash
curl -X PATCH http://localhost:8000/orcamentos/1/aprovar
```

#### Deletar Orçamento (apenas se Rascunho)
```bash
curl -X DELETE http://localhost:8000/orcamentos/1
```

---

## 🛡 Recursos de Segurança

### Validações

✅ **Precisão Monetária:**
- Todos os valores usam `Numeric(18, 4)` no banco
- Cálculos com `Decimal` em Python
- Arredondamento ROUND_HALF_UP

✅ **Integridade de Dados:**
- Contrato com status "inativo" não pode criar orçamentos
- Orçamento aprovado é imutável
- Snapshot de valores (subtotal_ust e subtotal_bruto salvos)

✅ **Validações de Negócio:**
- Pelo menos 1 item com horas > 0
- Valor UST definido no contrato
- Hierarquia correta de Ciclo → Fase → Atividade

✅ **Integridade Referencial:**
- Não deletar cliente/contrato/projeto com dependências
- Verificar existência de entidades antes de operações

---

## 📊 Estrutura de Pastas

```
python_rush/
├── main.py                 # Inicialização da aplicação
├── database.py             # Conexão e configuração do BD
├── models.py               # Modelos SQLAlchemy
├── schemas.py              # Schemas Pydantic
├── auth_routes.py          # Endpoints de autenticação
├── client_routes.py        # Endpoints de clientes
├── contract_routes.py      # Endpoints de contratos
├── catalog_routes.py       # Endpoints do catálogo
├── project_routes.py       # Endpoints de projetos
├── order_routes.py         # Endpoints de orçamentos
├── banco.db                # Banco de dados SQLite
├── requirements.txt        # Dependências Python
├── README.md               # Este arquivo
└── alembic/                # Migrações Alembic (futuro)
```

---

## 🔍 Tecnologias Utilizadas

| Tecnologia | Versão | Propósito |
|------------|--------|----------|
| FastAPI   | 0.104+ | Framework web |
| SQLAlchemy| 2.0+   | ORM para banco de dados |
| Pydantic  | 2.0+   | Validação de dados |
| Uvicorn   | 0.24+  | ASGI server |
| SQLite    | 3.x    | Banco de dados |

---

## ✅ Critérios de Aceitação

### Exemplo 1: Cálculo Correto
```
Contrato: valor_ust = 185.00
Atividade: complexidade_ust = 2.5
Horas: 16.0

Resultado:
ust_item = 40.00
valor_item_bruto = 7.400,00 ✅
```

### Exemplo 2: Desconto Correto
```
valor_total_bruto = 45.000,00
desconto_percentual = 12.5

Resultado:
valor_desconto = 5.625,00
valor_total_liquido = 39.375,00 ✅
```

### Exemplo 3: Validação de Horas
```
Orçamento sem itens com horas > 0
Resultado: ERRO 400 ✅
```

---

## 🐛 Troubleshooting

### Problema: "Banco de dados não criado"
**Solução:** O banco é criado automaticamente ao iniciar a API. Se houver erro:
```python
# Execute em um terminal Python
from database import create_tables
create_tables()
```

### Problema: "Porta 8000 em uso"
**Solução:** Use outra porta:
```bash
uvicorn main:app --reload --port 8001
```

### Problema: "SQLite database is locked"
**Solução:** Isso geralmente ocorre com múltiplas requisições simultâneas. Em produção, use PostgreSQL:
```python
# database.py
DATABASE_URL = "postgresql://user:password@localhost/dbname"
engine = create_engine(DATABASE_URL)
```

---

## 🚀 Próximas Melhorias

- [ ] Autenticação e autorização (JWT)
- [ ] Sistema de auditoria completo
- [ ] Exportação para PDF
- [ ] Versionamento de orçamentos
- [ ] Integração com Stripe/PagSeguro
- [ ] Testes unitários e de integração
- [ ] Docker e docker-compose
- [ ] CI/CD com GitHub Actions
- [ ] PostgreSQL em produção
- [ ] Cache com Redis

---

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

---

## 📄 Licença

Este projeto é fornecido como é para fins educacionais.

---

**Desenvolvido com ❤️ em Python**
