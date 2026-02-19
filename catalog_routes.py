from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth_routes import verificar_admin, verificar_token
from database import get_db
from models import ServicosCatalogo, Usuario
from schemas import (
    CatalogoCreate,
    CatalogoResponse,
    CatalogoUpdate,
)

catalog_router = APIRouter(prefix="/catalogo", tags=["catálogo"])


# ========== CAT�LOGO UNIFICADO ==========
# Implementa CRUD �nico para os tr�s tipos de item. A hierarquia � mantida
# atrav�s do campo parent_id e do tipo.

# Regras de valida��o s�o aplicadas abaixo.


@catalog_router.post("/", response_model=CatalogoResponse, status_code=201)
def criar_catalogo(
    dados: CatalogoCreate,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """Cria novo catálogo com validação de hierarquia."""
    # regras de hierarquia
    if dados.tipo == "CICLO":
        if dados.parent_id is not None:
            raise HTTPException(status_code=400, detail="Ciclo n�o pode ter parent_id")
    elif dados.tipo == "FASE":
        if dados.parent_id is None:
            raise HTTPException(
                status_code=400, detail="Fase precisa de parent_id de ciclo"
            )
        parent = db.query(ServicosCatalogo).get(dados.parent_id)
        if not parent or parent.tipo != "CICLO":
            raise HTTPException(status_code=400, detail="Parent inv�lido para fase")
    elif dados.tipo == "ATIVIDADE":
        if dados.parent_id is None:
            raise HTTPException(
                status_code=400, detail="Atividade precisa de parent_id de fase"
            )
        parent = db.query(ServicosCatalogo).get(dados.parent_id)
        if not parent or parent.tipo != "FASE":
            raise HTTPException(
                status_code=400, detail="Parent inv�lido para atividade"
            )
        if dados.complexidade_ust is None:
            raise HTTPException(status_code=400, detail="Atividade requer complexidade")

    novo = ServicosCatalogo(
        nome=dados.nome,
        tipo=dados.tipo,
        parent_id=dados.parent_id,
        complexidade_ust=dados.complexidade_ust or Decimal("0.0000"),
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


@catalog_router.get("/", response_model=list[CatalogoResponse])
def listar_catalogo(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    tipo: str = Query(None),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    query = db.query(ServicosCatalogo)
    if tipo:
        query = query.filter(ServicosCatalogo.tipo == tipo)
    return query.offset(skip).limit(limit).all()


@catalog_router.get("/{id}", response_model=CatalogoResponse)
def obter_catalogo(
    id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    item = db.query(ServicosCatalogo).filter(ServicosCatalogo.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item n�o encontrado")
    return item


@catalog_router.put("/{id}", response_model=CatalogoResponse)
def atualizar_catalogo(
    id: int,
    dados: CatalogoUpdate,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    item = db.query(ServicosCatalogo).filter(ServicosCatalogo.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item n�o encontrado")
    if dados.nome:
        item.nome = dados.nome
    if dados.parent_id is not None:
        # validate new hierarchy
        parent = db.query(ServicosCatalogo).get(dados.parent_id)
        if not parent:
            raise HTTPException(status_code=400, detail="Parent inv�lido")
        if item.tipo == "CICLO":
            raise HTTPException(status_code=400, detail="Ciclo n�o pode ter parent")
        if item.tipo == "FASE" and parent.tipo != "CICLO":
            raise HTTPException(status_code=400, detail="Parent deve ser ciclo")
        if item.tipo == "ATIVIDADE" and parent.tipo != "FASE":
            raise HTTPException(status_code=400, detail="Parent deve ser fase")
        item.parent_id = dados.parent_id
    if dados.complexidade_ust is not None:
        if item.tipo != "ATIVIDADE":
            raise HTTPException(
                status_code=400, detail="Somente atividade tem complexidade"
            )
        item.complexidade_ust = dados.complexidade_ust
    db.commit()
    db.refresh(item)
    return item


@catalog_router.delete("/{id}", status_code=204)
def deletar_catalogo(
    id: int,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    item = db.query(ServicosCatalogo).filter(ServicosCatalogo.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item n�o encontrado")
    # bloqueia se possuir filhos
    if item.children:
        raise HTTPException(
            status_code=400, detail="N�o � poss�vel excluir item com filhos"
        )
    db.delete(item)
    db.commit()
