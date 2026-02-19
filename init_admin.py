"""
Script para inicializar o primeiro usuário administrador.
Execute uma única vez:
    python init_admin.py
"""

from database import SessionLocal
from models import Usuario
from auth_routes import hash_password


def criar_admin_inicial():
    """Cria um usuário admin padrão se não existir nenhum admin no DB."""
    db = SessionLocal()
    
    try:
        # Verificar se já existe algum admin
        admin_existente = db.query(Usuario).filter(Usuario.admin == 1).first()
        if admin_existente:
            print(f"✓ Admin já existe: {admin_existente.username}")
            return
        
        # Criar admin padrão
        admin = Usuario(
            username="admin",
            password_hash=hash_password("admin123"),
            email="admin@exemplo.com",
            admin=1
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print(f"✓ Admin criado com sucesso!")
        print(f"  Username: admin")
        print(f"  Password: admin123")
        print(f"  Email: admin@exemplo.com")
        print()
        print("⚠️  MUDE A SENHA DO ADMIN EM PRODUÇÃO!")
        
    except Exception as e:
        print(f"✗ Erro ao criar admin: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    criar_admin_inicial()
