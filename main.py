import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import SessionLocal, create_tables
from models import Usuario

# Criar tabelas ao iniciar
create_tables()

app = FastAPI(
    title="API de Gestão de Orçamentos com UST",
    description="Sistema robusto de orçamentos corporativos baseado em Unidade de Serviço Técnico",
    version="1.0.0",
)

# CORS middleware
# Em produção, defina FRONTEND_URL com a URL do seu site no Render
# Ex: https://seu-frontend.onrender.com
FRONTEND_URL = os.environ.get("FRONTEND_URL", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL] if FRONTEND_URL != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def criar_admin_automatico():
    """
    Cria um usuário administrador padrão na inicialização da aplicação,
    caso ele ainda não exista no banco de dados.
    """
    from auth_routes import hash_password

    db = SessionLocal()
    try:
        admin_existente = db.query(Usuario).filter(Usuario.admin == 1).first()
        if admin_existente:
            print(f"✓ Admin encontrado: {admin_existente.username}")
            return

        admin = Usuario(
            username="admin",
            password_hash=hash_password("admin123"),
            email="admin@exemplo.com",
            admin=1,
        )
        db.add(admin)
        db.commit()
        print("✓ Admin criado automaticamente!")
        print("  └─ Username: admin")
        print("  └─ Password: admin123")
        print("  └─ Email: admin@exemplo.com")
        print("  ⚠️  Mude a senha em produção!")

    except Exception as e:
        print(f"✗ Erro ao criar admin: {e}")
        db.rollback()
    finally:
        db.close()


# Chama diretamente (compatível com qualquer versão do FastAPI/Starlette)
criar_admin_automatico()


from audit_routes import audit_router
from auth_routes import auth_router
from catalog_routes import catalog_router
from client_routes import client_router
from contract_routes import contract_router
from order_routes import order_router
from project_routes import project_router

app.include_router(auth_router)
app.include_router(client_router)
app.include_router(contract_router)
app.include_router(catalog_router)
app.include_router(project_router)
app.include_router(order_router)
app.include_router(audit_router)


@app.get("/")
def read_root():
    return {
        "message": "API de Gestão de Orçamentos com UST",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "clientes": "/clientes",
            "contratos": "/contratos",
            "catálogo": "/catalogo",
            "projetos": "/projetos",
            "orçamentos": "/orcamentos",
            "autenticação": "/auth",
        },
    }
