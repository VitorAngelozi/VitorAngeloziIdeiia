from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth_routes import verificar_admin, verificar_token
from database import get_db
from models import Cliente, Usuario
from schemas import ClienteCreate, ClienteResponse

client_router = APIRouter(prefix="/clientes", tags=["clientes"])


@client_router.post("/", response_model=ClienteResponse, status_code=201)
def criar_cliente(
    dados: ClienteCreate,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Cria um novo cliente.
    """
    # Verifica se CNPJ já existe
    existe = db.query(Cliente).filter(Cliente.cnpj == dados.cnpj).first()
    if existe:
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado")

    novo_cliente = Cliente(razao_social=dados.razao_social, cnpj=dados.cnpj)

    db.add(novo_cliente)
    db.commit()
    db.refresh(novo_cliente)

    return novo_cliente


@client_router.get("/", response_model=list[ClienteResponse])
def listar_clientes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    """
    Lista todos os clientes com paginação.
    """
    return db.query(Cliente).offset(skip).limit(limit).all()


@client_router.get("/{cliente_id}", response_model=ClienteResponse)
def obter_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    """
    Obtém detalhes de um cliente específico.
    """
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    return cliente


@client_router.put("/{cliente_id}", response_model=ClienteResponse)
def atualizar_cliente(
    cliente_id: int,
    dados: ClienteCreate,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Atualiza dados de um cliente.
    """
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    # Verifica se novo CNPJ não pertence a outro cliente
    outro_cliente = (
        db.query(Cliente)
        .filter(Cliente.cnpj == dados.cnpj, Cliente.id != cliente_id)
        .first()
    )

    if outro_cliente:
        raise HTTPException(
            status_code=400, detail="CNPJ já cadastrado para outro cliente"
        )

    cliente.razao_social = dados.razao_social
    cliente.cnpj = dados.cnpj

    db.commit()
    db.refresh(cliente)

    return cliente


@client_router.delete("/{cliente_id}", status_code=204)
def deletar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Deleta um cliente (apenas se não houver contratos/projetos associados).
    """
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    # Verifica se possui contratos ou projetos
    if cliente.contratos or cliente.projetos:
        raise HTTPException(
            status_code=400,
            detail="Não é possível deletar cliente com contratos ou projetos associados",
        )

    db.delete(cliente)
    db.commit()
