from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth_routes import verificar_admin, verificar_token
from database import get_db
from models import Cliente, Contrato, Projeto, Usuario
from schemas import ProjetoCreate, ProjetoResponse, ProjetoUpdate

project_router = APIRouter(prefix="/projetos", tags=["projetos"])


@project_router.post("/", response_model=ProjetoResponse, status_code=201)
def criar_projeto(
    dados: ProjetoCreate,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Cria um novo projeto.

    Validações:
    - Cliente deve existir
    - Contrato (se fornecido) deve existir
    - codigo deve ser único
    """
    # Verifica se cliente existe
    cliente = db.query(Cliente).filter(Cliente.id == dados.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    # Verifica se contrato existe (se fornecido)
    if dados.contrato_id:
        contrato = db.query(Contrato).filter(Contrato.id == dados.contrato_id).first()
        if not contrato:
            raise HTTPException(status_code=404, detail="Contrato não encontrado")

    # Verifica se código é único
    existe = db.query(Projeto).filter(Projeto.codigo == dados.codigo).first()
    if existe:
        raise HTTPException(status_code=400, detail="Código de projeto já existe")

    novo_projeto = Projeto(
        nome=dados.nome,
        codigo=dados.codigo,
        cliente_id=dados.cliente_id,
        contrato_id=dados.contrato_id,
        status=dados.status,
    )

    db.add(novo_projeto)
    db.commit()
    db.refresh(novo_projeto)

    return novo_projeto


@project_router.get("/", response_model=list[ProjetoResponse])
def listar_projetos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    cliente_id: int = Query(None),
    contrato_id: int = Query(None),
    status: str = Query(None),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    """
    Lista projetos com filtros opcionais.

    Filtros:
    - cliente_id: filtrar por cliente
    - contrato_id: filtrar por contrato
    - status: filtrar por status (ativo/inativo)
    """
    query = db.query(Projeto)

    if cliente_id:
        query = query.filter(Projeto.cliente_id == cliente_id)

    if contrato_id:
        query = query.filter(Projeto.contrato_id == contrato_id)

    if status:
        query = query.filter(Projeto.status == status)

    return query.offset(skip).limit(limit).all()


@project_router.get("/{projeto_id}", response_model=ProjetoResponse)
def obter_projeto(
    projeto_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    """
    Obtém detalhes de um projeto específico.
    """
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()

    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    return projeto


@project_router.put("/{projeto_id}", response_model=ProjetoResponse)
def atualizar_projeto(
    projeto_id: int,
    dados: ProjetoUpdate,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Atualiza um projeto.
    """
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()

    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    if dados.nome:
        projeto.nome = dados.nome

    if dados.status:
        projeto.status = dados.status

    db.commit()
    db.refresh(projeto)

    return projeto


@project_router.patch("/{projeto_id}/desativar", response_model=ProjetoResponse)
def desativar_projeto(
    projeto_id: int,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Desativa um projeto (muda status para 'inativo').
    """
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()

    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    projeto.status = "inativo"

    db.commit()
    db.refresh(projeto)

    return projeto


@project_router.delete("/{projeto_id}", status_code=204)
def deletar_projeto(
    projeto_id: int,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Deleta um projeto (apenas se não houver orçamentos associados).
    """
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()

    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    if projeto.orcamentos:
        raise HTTPException(
            status_code=400,
            detail="Não é possível deletar projeto com orçamentos associados",
        )

    db.delete(projeto)
    db.commit()
