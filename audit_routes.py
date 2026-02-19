from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import HistoricoAuditoria
from schemas import HistoricoAuditoriaResponse

audit_router = APIRouter(prefix="/auditoria", tags=["auditoria"])


@audit_router.get(
    "/orcamentos/{orcamento_id}", response_model=list[HistoricoAuditoriaResponse]
)
def listar_auditoria_orcamento(
    orcamento_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Lista o histórico de auditoria de um orçamento.

    Mostra todas as alterações de horas e descontos com:
    - Quem alterou (usuario_id)
    - Quando alterou (data_alteracao)
    - Valor anterior → novo valor
    - Motivo da alteração (se fornecido)
    """
    registros = (
        db.query(HistoricoAuditoria)
        .filter(HistoricoAuditoria.orcamento_id == orcamento_id)
        .order_by(HistoricoAuditoria.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return registros


@audit_router.get(
    "/itens/{item_orcamento_id}", response_model=list[HistoricoAuditoriaResponse]
)
def listar_auditoria_item(
    item_orcamento_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Lista o histórico de auditoria de um item de orçamento.

    Mostra todas as alterações de horas com:
    - Quem alterou (usuario_id)
    - Quando alterou (data_alteracao)
    - Horas anterior → novas horas
    - Motivo da alteração (se fornecido)
    """
    registros = (
        db.query(HistoricoAuditoria)
        .filter(HistoricoAuditoria.item_orcamento_id == item_orcamento_id)
        .order_by(HistoricoAuditoria.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return registros


def registrar_auditoria(
    db: Session,
    tipo_alteracao: str,
    orcamento_id: int,
    valor_anterior,
    valor_novo,
    item_orcamento_id: Optional[int] = None,
    usuario_id: Optional[int] = None,
    motivo: Optional[str] = None,
):
    """
    Função auxiliar para registrar alterações no histórico de auditoria.

    Parâmetros:
    - tipo_alteracao: "HORAS_ITEM" ou "DESCONTO_ORCAMENTO"
    - orcamento_id: ID do orçamento afetado
    - valor_anterior: Valor antes da alteração
    - valor_novo: Valor após a alteração
    - item_orcamento_id: ID do item (se for alteração de horas)
    - usuario_id: ID do usuário que fez a alteração
    - motivo: Motivo da alteração (opcional)
    """
    from decimal import Decimal

    auditoria = HistoricoAuditoria(
        tipo_alteracao=tipo_alteracao,
        orcamento_id=orcamento_id,
        item_orcamento_id=item_orcamento_id,
        usuario_id=usuario_id,
        valor_anterior=Decimal(str(valor_anterior)),
        valor_novo=Decimal(str(valor_novo)),
        data_alteracao=datetime.now().isoformat(),
        motivo=motivo,
    )

    db.add(auditoria)
    db.commit()

    return auditoria
