from decimal import Decimal
from sqlalchemy.orm import Session

from models import ItemOrcamento, ServicosCatalogo as Atividade, calcular_item_orcamento


def recalculate_orcamento(db: Session, orcamento, persist: bool = True):
    """
    Recalcula todos os valores de um orçamento em rascunho usando a
    complexidade atual das atividades no catálogo.

    Atualiza os campos dos itens:
    - complexidade_snapshot
    - subtotal_ust
    - subtotal_bruto

    Atualiza os totais do orçamento:
    - valor_total_bruto
    - valor_total_liquido

    Se `persist` for True, faz commit das alterações.
    """
    if not orcamento or getattr(orcamento, "status", None) != "Rascunho":
        return orcamento

    total_bruto = Decimal("0.0000")

    # Recarregar itens (garante que temos itens atualizados do DB)
    db.refresh(orcamento)
    itens = list(orcamento.itens or [])

    for item in itens:
        atividade = db.query(Atividade).filter(Atividade.id == item.atividade_id).first()
        if not atividade:
            # se atividade removida, manter snapshot existente
            total_bruto += Decimal(item.subtotal_bruto or 0)
            continue

        complexidade_snapshot = atividade.complexidade_ust

        ust_item, valor_item_bruto = calcular_item_orcamento(
            item.horas_estimadas,
            complexidade_snapshot,
            item.valor_ust_snapshot or 0,
        )

        item.complexidade_snapshot = complexidade_snapshot
        item.subtotal_ust = ust_item
        item.subtotal_bruto = valor_item_bruto

        total_bruto += valor_item_bruto

    desconto = (total_bruto * (orcamento.desconto_percentual or Decimal("0")) / Decimal("100"))
    valor_liquido = total_bruto - desconto

    orcamento.valor_total_bruto = total_bruto
    orcamento.valor_total_liquido = valor_liquido

    if persist:
        db.commit()
        db.refresh(orcamento)

    return orcamento
