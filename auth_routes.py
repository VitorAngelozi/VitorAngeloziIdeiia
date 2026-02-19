import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
from models import Usuario
from schemas import UsuarioCreate, UsuarioLogin, UsuarioResponse

# Configurações JWT
# Em produção, defina a variável de ambiente SECRET_KEY com um valor seguro.
# Gere um com: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "sua-chave-secreta-muito-segura-aqui-mude-em-producao",
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas

auth_router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Fazer hash de senha usando SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def criar_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Criar um JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verificar_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Verificar se o token JWT é válido e retornar o usuário.
    Esta função é usada como dependency em endpoints que exigem autenticação.
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
        )

    usuario = db.query(Usuario).filter(Usuario.username == username).first()
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado"
        )

    return usuario


def verificar_admin(usuario: Usuario = Depends(verificar_token)) -> Usuario:
    """
    Verificar se o usuário é admin.
    Esta função é usada como dependency em endpoints que exigem permissão de admin.
    """
    if usuario.admin != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem realizar esta ação",
        )
    return usuario


@auth_router.get("/me", response_model=UsuarioResponse)
def obter_usuario_atual(usuario_atual: Usuario = Depends(verificar_token)):
    """
    Obter as informações do usuário logado atualmente.
    """
    return usuario_atual


@auth_router.post(
    "/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED
)
def registrar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    """
    Criar um novo usuário.

    - **username**: Nome de usuário único
    - **password**: Senha do usuário
    - **email**: Email do usuário (opcional)
    """
    # Verificar se usuário já existe
    usuario_existente = (
        db.query(Usuario).filter(Usuario.username == usuario.username).first()
    )
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário já existe com esse username",
        )

    # Verificar se email já existe (se fornecido)
    if usuario.email:
        email_existente = (
            db.query(Usuario).filter(Usuario.email == usuario.email).first()
        )
        if email_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email já cadastrado"
            )

    # Criar novo usuário
    novo_usuario = Usuario(
        username=usuario.username,
        password_hash=hash_password(usuario.password),
        email=usuario.email,
        admin=0,  # Novos usuários são criados como usuários normais
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario


@auth_router.post("/login")
def login(credenciais: UsuarioLogin, db: Session = Depends(get_db)):
    """
    Fazer login com username e password.

    Retorna um token JWT para usar em requisições autenticadas.
    """
    usuario = db.query(Usuario).filter(Usuario.username == credenciais.username).first()

    if not usuario or usuario.password_hash != hash_password(credenciais.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username ou password incorretos",
        )

    # Criar token JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = criar_access_token(
        data={"sub": usuario.username}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario.id,
            "username": usuario.username,
            "email": usuario.email,
            "admin": usuario.admin,
        },
    }


# ========== GERENCIAMENTO DE USUÁRIOS (ADMIN ONLY) ==========


@auth_router.get("/usuarios", response_model=list[UsuarioResponse])
def listar_usuarios(
    db: Session = Depends(get_db), usuario_admin: Usuario = Depends(verificar_admin)
):
    """
    Listar todos os usuários [ADMIN ONLY].
    """
    usuarios = db.query(Usuario).all()
    return usuarios


@auth_router.get("/usuarios/{user_id}", response_model=UsuarioResponse)
def obter_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    """
    Obter informações de um usuário.
    - Admin pode ver qualquer usuário
    - Usuário comum pode ver apenas suas próprias informações
    """
    usuario_alvo = db.query(Usuario).filter(Usuario.id == user_id).first()

    if not usuario_alvo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
        )

    # Verificar permissão
    if usuario_atual.admin != 1 and usuario_atual.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode visualizar suas próprias informações",
        )

    return usuario_alvo


@auth_router.delete("/usuarios/{user_id}", status_code=204)
def deletar_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Deletar um usuário [ADMIN ONLY].

    Não é permitido deletar a si mesmo.
    """
    if user_id == usuario_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode deletar sua própria conta",
        )

    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
        )

    db.delete(usuario)
    db.commit()


@auth_router.post("/usuarios/{user_id}/promote", response_model=UsuarioResponse)
def promover_admin(
    user_id: int,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Promover um usuário a administrador [ADMIN ONLY].
    """
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
        )

    if usuario.admin == 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário já é administrador"
        )

    usuario.admin = 1
    db.commit()
    db.refresh(usuario)

    return usuario


@auth_router.post("/usuarios/{user_id}/demote", response_model=UsuarioResponse)
def remover_admin(
    user_id: int,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Remover permissões de administrador de um usuário [ADMIN ONLY].

    Não é permitido remover admin de si mesmo.
    """
    if user_id == usuario_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode remover suas próprias permissões de admin",
        )

    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
        )

    if usuario.admin != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário não é administrador",
        )

    usuario.admin = 0
    db.commit()
    db.refresh(usuario)

    return usuario
