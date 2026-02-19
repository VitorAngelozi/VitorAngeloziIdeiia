from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth_routes import verificar_admin, verificar_token
from database import get_db
from models import Cliente, Contrato, Usuario
from schemas import ContratoCreate, ContratoResponse, ContratoUpdate

contract_router = APIRouter(prefix="/contratos", tags=["contratos"])


@contract_router.post("/", response_model=ContratoResponse, status_code=201)
def criar_contrato(
    dados: ContratoCreate,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Cria um novo contrato.

    Validações:
    - Cliente deve existir
    - numero_contrato deve ser único
    - valor_ust deve ser >= 0
    """
    # Verifica se cliente existe
    cliente = db.query(Cliente).filter(Cliente.id == dados.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    # Verifica se número de contrato é único
    existe = (
        db.query(Contrato)
        .filter(Contrato.numero_contrato == dados.numero_contrato)
        .first()
    )
    if existe:
        raise HTTPException(status_code=400, detail="Número de contrato já existe")

    novo_contrato = Contrato(
        numero_contrato=dados.numero_contrato,
        cliente_id=dados.cliente_id,
        valor_ust=dados.valor_ust,
        data_inicio=dados.data_inicio,
        data_fim=dados.data_fim,
        status=dados.status,
    )

    db.add(novo_contrato)
    db.commit()
    db.refresh(novo_contrato)

    return novo_contrato


@contract_router.get("/", response_model=list[ContratoResponse])
def listar_contratos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    cliente_id: int = Query(None),
    status: str = Query(None),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    """
    Lista contratos com filtros opcionais.

    Filtros:
    - cliente_id: filtrar por cliente
    - status: filtrar por status (ativo/inativo)
    """
    query = db.query(Contrato)

    if cliente_id:
        query = query.filter(Contrato.cliente_id == cliente_id)

    if status:
        query = query.filter(Contrato.status == status)

    return query.offset(skip).limit(limit).all()


@contract_router.get("/{contrato_id}", response_model=ContratoResponse)
def obter_contrato(
    contrato_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    """
    Obtém detalhes de um contrato específico.
    """
    contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()

    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")

    return contrato


@contract_router.put("/{contrato_id}", response_model=ContratoResponse)
def atualizar_contrato(
    contrato_id: int,
    dados: ContratoUpdate,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Atualiza um contrato.

    Nota: A alteração de valor_ust não afeta orçamentos já aprovados (snapshot).
    """
    contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()

    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")

    # Verifica se novo número de contrato é único (se fornecido)
    if dados.numero_contrato:
        existe = (
            db.query(Contrato)
            .filter(
                Contrato.numero_contrato == dados.numero_contrato,
                Contrato.id != contrato_id,
            )
            .first()
        )
        if existe:
            raise HTTPException(status_code=400, detail="Número de contrato já existe")
        contrato.numero_contrato = dados.numero_contrato

    if dados.valor_ust is not None:
        contrato.valor_ust = dados.valor_ust

    if dados.status:
        contrato.status = dados.status

    db.commit()
    db.refresh(contrato)

    return contrato


@contract_router.patch("/{contrato_id}/desativar", response_model=ContratoResponse)
def desativar_contrato(
    contrato_id: int,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Desativa um contrato (muda status para 'inativo').
    """
    contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()

    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")

    contrato.status = "inativo"

    db.commit()
    db.refresh(contrato)

    return contrato


@contract_router.delete("/{contrato_id}", status_code=204)
def deletar_contrato(
    contrato_id: int,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Deleta um contrato (apenas se não houver orçamentos associados).
    """
    contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()

    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")

    if contrato.orcamentos:
        raise HTTPException(
            status_code=400,
            detail="Não é possível deletar contrato com orçamentos associados",
        )

    db.delete(contrato)
    db.commit()
