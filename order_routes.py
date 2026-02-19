from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from audit_routes import registrar_auditoria
from auth_routes import verificar_admin, verificar_token
from database import get_db
from models import (
    Contrato,
    ItemOrcamento,
    Orcamento,
    Projeto,
    Usuario,
    calcular_item_orcamento,
)
from models import (
    ServicosCatalogo as Atividade,
)
from schemas import (
    AtualizarDescontoOrcamento,
    AtualizarHorasItem,
    ItemOrcamentoCreate,
    OrcamentoCreate,
    OrcamentoDetailResponse,
    OrcamentoResponse,
)
from services.orcamento_service import recalculate_orcamento

order_router = APIRouter(prefix="/orcamentos", tags=["orcamentos"])


def gerar_numero_orcamento(db: Session, contrato_id: int):
    ano = date.today().year
    # contar apenas orçamentos do mesmo contrato para sequência local
    count = db.query(Orcamento).filter(Orcamento.contrato_id == contrato_id).count() + 1
    return f"ORC/{ano}/{contrato_id}/{str(count).zfill(6)}"


@order_router.post("/", response_model=OrcamentoResponse, status_code=201)
def criar_orcamento(
    dados: OrcamentoCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    """
    Cria um novo orçamento com lista de atividades.

    Validações:
    - Contrato deve estar ativo
    - Contrato deve ter valor_ust definido
    - Projeto deve existir
    - Pelo menos 1 item com horas > 0
    """

    # 🔹 Verifica contrato
    contrato = (
        db.query(Contrato)
        .filter(Contrato.id == dados.contrato_id, Contrato.status == "ativo")
        .first()
    )

    if not contrato:
        raise HTTPException(status_code=400, detail="Contrato inválido ou inativo")

    if contrato.valor_ust is None:
        raise HTTPException(status_code=400, detail="Contrato sem valor_ust definido")

    # 🔹 Verifica projeto
    projeto = db.query(Projeto).filter(Projeto.id == dados.projeto_id).first()

    if not projeto:
        raise HTTPException(status_code=400, detail="Projeto não encontrado")

    if not dados.itens:
        raise HTTPException(
            status_code=400, detail="Orçamento deve ter pelo menos 1 item"
        )

    numero_orc = gerar_numero_orcamento(db, contrato.id)

    novo_orcamento = Orcamento(
        numero_orcamento=numero_orc,
        projeto_id=projeto.id,
        contrato_id=contrato.id,
        data_emissao=date.today(),
        status="Rascunho",
        versao="1.0",
    )

    db.add(novo_orcamento)
    db.flush()  # pega id antes do commit

    total_bruto = Decimal("0.0000")
    tem_horas_validas = False

    for index, item in enumerate(dados.itens):
        atividade = (
            db.query(Atividade).filter(Atividade.id == item.atividade_id).first()
        )

        if not atividade:
            raise HTTPException(
                status_code=400, detail=f"Atividade {item.atividade_id} não encontrada"
            )

        if item.horas_estimadas > 0:
            tem_horas_validas = True

        # Obter complexidade da atividade (não pode ser sobrescrita)
        complexidade_snapshot = atividade.complexidade_ust

        ust_item, valor_item_bruto = calcular_item_orcamento(
            item.horas_estimadas,
            complexidade_snapshot,
            contrato.valor_ust,
        )

        novo_item = ItemOrcamento(
            orcamento_id=novo_orcamento.id,
            atividade_id=atividade.id,
            horas_estimadas=item.horas_estimadas,
            complexidade_snapshot=complexidade_snapshot,
            valor_ust_snapshot=contrato.valor_ust,
            sequencia=index + 1,
            subtotal_ust=ust_item,
            subtotal_bruto=valor_item_bruto,
            observacoes=item.observacoes,
        )

        total_bruto += valor_item_bruto
        db.add(novo_item)

    if not tem_horas_validas:
        raise HTTPException(
            status_code=400, detail="Pelo menos 1 item deve ter horas_estimadas > 0"
        )

    desconto = total_bruto * (dados.desconto_percentual / Decimal("100"))

    valor_liquido = total_bruto - desconto

    novo_orcamento.valor_total_bruto = total_bruto
    novo_orcamento.desconto_percentual = dados.desconto_percentual
    novo_orcamento.valor_total_liquido = valor_liquido
    novo_orcamento.observacoes = dados.observacoes

    db.commit()
    db.refresh(novo_orcamento)

    return novo_orcamento


@order_router.get("/{orcamento_id}", response_model=OrcamentoDetailResponse)
def obter_orcamento(
    orcamento_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    """
    Obtém os detalhes de um orçamento específico.
    """
    orcamento = db.query(Orcamento).filter(Orcamento.id == orcamento_id).first()

    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    # Se estiver em rascunho, recalcula usando complexidade atual das atividades
    recalculate_orcamento(db, orcamento, persist=True)

    return orcamento


@order_router.get("/", response_model=list[OrcamentoResponse])
def listar_orcamentos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    contrato_id: int = Query(None),
    projeto_id: int = Query(None),
    status: str = Query(None),
    db: Session = Depends(get_db),
):
    """
    Lista orçamentos com filtros opcionais.

    Filtros:
    - skip: quantidade de registros a pular
    - limit: quantidade de registros a retornar
    - contrato_id: filtrar por contrato
    - projeto_id: filtrar por projeto
    - status: filtrar por status (Rascunho/Aprovado)
    """
    query = db.query(Orcamento)

    if contrato_id:
        query = query.filter(Orcamento.contrato_id == contrato_id)

    if projeto_id:
        query = query.filter(Orcamento.projeto_id == projeto_id)

    if status:
        query = query.filter(Orcamento.status == status)

    resultados = query.offset(skip).limit(limit).all()

    # Recalcular automaticamente orçamentos em rascunho antes de retornar
    for o in resultados:
        if getattr(o, "status", None) == "Rascunho":
            try:
                recalculate_orcamento(db, o, persist=True)
            except Exception:
                # não falhar listagem inteira por conta de um recálculo
                pass

    return resultados


@order_router.put("/{orcamento_id}", response_model=OrcamentoResponse)
def atualizar_orcamento(
    orcamento_id: int,
    dados: OrcamentoCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    """
    Atualiza um orçamento (apenas se status='Rascunho').
    Registra todas as alterações de horas e desconto no histórico de auditoria.
    """
    orcamento = db.query(Orcamento).filter(Orcamento.id == orcamento_id).first()

    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    if orcamento.status == "Aprovado":
        raise HTTPException(
            status_code=400, detail="Não é possível alterar orçamento aprovado"
        )

    # Registrar alteração de desconto
    desconto_anterior = orcamento.desconto_percentual
    if dados.desconto_percentual != desconto_anterior:
        registrar_auditoria(
            db=db,
            tipo_alteracao="DESCONTO_ORCAMENTO",
            orcamento_id=orcamento_id,
            valor_anterior=desconto_anterior,
            valor_novo=dados.desconto_percentual,
            usuario_id=usuario_atual.id,
            motivo="Alteração via PUT /orcamentos/{orcamento_id}",
        )

    # Mapear itens antigos por atividade para auditoria
    itens_antigos = (
        db.query(ItemOrcamento).filter(ItemOrcamento.orcamento_id == orcamento_id).all()
    )
    itens_antigos_dict = {item.atividade_id: item for item in itens_antigos}

    # Remove itens antigos
    db.query(ItemOrcamento).filter(ItemOrcamento.orcamento_id == orcamento_id).delete()

    # Valida contrato
    contrato = (
        db.query(Contrato)
        .filter(Contrato.id == dados.contrato_id, Contrato.status == "ativo")
        .first()
    )

    if not contrato:
        raise HTTPException(status_code=400, detail="Contrato inválido ou inativo")

    if not dados.itens:
        raise HTTPException(
            status_code=400, detail="Orçamento deve ter pelo menos 1 item"
        )

    total_bruto = Decimal("0.0000")
    tem_horas_validas = False

    # Recalcula itens
    for index, item in enumerate(dados.itens):
        atividade = (
            db.query(Atividade).filter(Atividade.id == item.atividade_id).first()
        )

        if not atividade:
            raise HTTPException(
                status_code=400, detail=f"Atividade {item.atividade_id} não encontrada"
            )

        if item.horas_estimadas > 0:
            tem_horas_validas = True

        # Obter complexidade da atividade (não pode ser sobrescrita)
        complexidade_snapshot = atividade.complexidade_ust

        ust_item, valor_item_bruto = calcular_item_orcamento(
            item.horas_estimadas,
            complexidade_snapshot,
            contrato.valor_ust,
        )

        novo_item = ItemOrcamento(
            orcamento_id=orcamento.id,
            atividade_id=atividade.id,
            horas_estimadas=item.horas_estimadas,
            complexidade_snapshot=complexidade_snapshot,
            valor_ust_snapshot=contrato.valor_ust,
            sequencia=index + 1,
            subtotal_ust=ust_item,
            subtotal_bruto=valor_item_bruto,
            observacoes=item.observacoes,
        )

        # Registrar alteração de horas se houver item antigo
        if item.atividade_id in itens_antigos_dict:
            item_antigo = itens_antigos_dict[item.atividade_id]
            if item.horas_estimadas != item_antigo.horas_estimadas:
                registrar_auditoria(
                    db=db,
                    tipo_alteracao="HORAS_ITEM",
                    orcamento_id=orcamento_id,
                    item_orcamento_id=item_antigo.id,
                    valor_anterior=item_antigo.horas_estimadas,
                    valor_novo=item.horas_estimadas,
                    usuario_id=usuario_atual.id,
                    motivo="Alteração via PUT /orcamentos/{orcamento_id}",
                )

        total_bruto += valor_item_bruto
        db.add(novo_item)

    if not tem_horas_validas:
        raise HTTPException(
            status_code=400, detail="Pelo menos 1 item deve ter horas_estimadas > 0"
        )

    desconto = total_bruto * (dados.desconto_percentual / Decimal("100"))
    valor_liquido = total_bruto - desconto

    orcamento.contrato_id = dados.contrato_id
    orcamento.projeto_id = dados.projeto_id
    orcamento.valor_total_bruto = total_bruto
    orcamento.desconto_percentual = dados.desconto_percentual
    orcamento.valor_total_liquido = valor_liquido
    orcamento.observacoes = dados.observacoes
    orcamento.versao = str(float(orcamento.versao) + 0.1)

    db.commit()
    db.refresh(orcamento)

    return orcamento


@order_router.patch("/{orcamento_id}/aprovar", response_model=OrcamentoResponse)
def aprovar_orcamento(
    orcamento_id: int,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Aprova um orçamento e o torna imutável.
    """
    orcamento = db.query(Orcamento).filter(Orcamento.id == orcamento_id).first()

    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    if orcamento.status == "Aprovado":
        raise HTTPException(status_code=400, detail="Orçamento já está aprovado")

    orcamento.status = "Aprovado"
    db.commit()
    db.refresh(orcamento)

    return orcamento


@order_router.patch("/{orcamento_id}/desconto", response_model=OrcamentoResponse)
def atualizar_desconto(
    orcamento_id: int,
    dados: AtualizarDescontoOrcamento,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_admin),
):
    """
    Atualiza o desconto de um orçamento com auditoria.
    Apenas orçamentos em rascunho podem ser modificados.

    Registra no histórico:
    - Desconto anterior → novo desconto
    - Quem alterou (quando disponível)
    - Motivo da alteração
    """
    orcamento = db.query(Orcamento).filter(Orcamento.id == orcamento_id).first()

    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    if orcamento.status == "Aprovado":
        raise HTTPException(
            status_code=400, detail="Não é possível alterar orçamento aprovado"
        )

    desconto_anterior = orcamento.desconto_percentual

    # Calcular novo valor líquido
    desconto = orcamento.valor_total_bruto * (
        dados.desconto_percentual / Decimal("100")
    )
    valor_liquido = orcamento.valor_total_bruto - desconto

    # Atualizar orçamento
    orcamento.desconto_percentual = dados.desconto_percentual
    orcamento.valor_total_liquido = valor_liquido

    # Registrar auditoria
    registrar_auditoria(
        db=db,
        tipo_alteracao="DESCONTO_ORCAMENTO",
        orcamento_id=orcamento_id,
        valor_anterior=desconto_anterior,
        valor_novo=dados.desconto_percentual,
        usuario_id=usuario_atual.id,
        motivo=dados.motivo
        or "Alteração via PATCH /orcamentos/{orcamento_id}/desconto",
    )

    db.commit()
    db.refresh(orcamento)

    return orcamento


@order_router.patch(
    "/{orcamento_id}/itens/{item_orcamento_id}", response_model=OrcamentoResponse
)
def atualizar_horas_item(
    orcamento_id: int,
    item_orcamento_id: int,
    dados: AtualizarHorasItem,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    """Atualiza horas de um item especificado dentro de um orçamento.
    Rota corrigida para seguir padrão REST apropriado.
    """
    """
    Atualiza as horas estimadas de um item de orçamento com auditoria.
    Apenas orçamentos em rascunho podem ser modificados.

    Registra no histórico:
    - Horas anterior → novas horas
    - Quem alterou (quando disponível)
    - Motivo da alteração
    """
    item = (
        db.query(ItemOrcamento)
        .filter(
            ItemOrcamento.id == item_orcamento_id,
            ItemOrcamento.orcamento_id == orcamento_id,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404, detail="Item de orçamento não encontrado neste orçamento"
        )

    orcamento = db.query(Orcamento).filter(Orcamento.id == orcamento_id).first()

    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    if orcamento.status == "Aprovado":
        raise HTTPException(
            status_code=400, detail="Não é possível alterar orçamento aprovado"
        )

    # Obter dados necessários
    atividade = db.query(Atividade).filter(Atividade.id == item.atividade_id).first()
    contrato = db.query(Contrato).filter(Contrato.id == orcamento.contrato_id).first()

    if not atividade or not contrato:
        raise HTTPException(
            status_code=400, detail="Atividade ou contrato não encontrados"
        )

    horas_anterior = item.horas_estimadas

    # Calcular novo valor do item usando complexidade da atividade
    ust_item, valor_item_bruto = calcular_item_orcamento(
        dados.horas_estimadas,
        atividade.complexidade_ust,
        contrato.valor_ust,
    )

    # Calcular diferença de valores
    diferenca_bruto = valor_item_bruto - item.subtotal_bruto

    # Atualizar item
    item.horas_estimadas = dados.horas_estimadas
    item.subtotal_ust = ust_item
    item.subtotal_bruto = valor_item_bruto

    # Atualizar totais no orçamento
    novo_total_bruto = orcamento.valor_total_bruto + diferenca_bruto
    desconto = novo_total_bruto * (orcamento.desconto_percentual / Decimal("100"))
    novo_valor_liquido = novo_total_bruto - desconto

    orcamento.valor_total_bruto = novo_total_bruto
    orcamento.valor_total_liquido = novo_valor_liquido

    # Registrar auditoria
    registrar_auditoria(
        db=db,
        tipo_alteracao="HORAS_ITEM",
        orcamento_id=orcamento.id,
        item_orcamento_id=item_orcamento_id,
        valor_anterior=horas_anterior,
        valor_novo=dados.horas_estimadas,
        usuario_id=usuario_atual.id,
        motivo=dados.motivo
        or "Alteração via PATCH /orcamentos/item/{item_orcamento_id}/horas",
    )

    db.commit()
    db.refresh(orcamento)

    return orcamento


@order_router.delete("/{orcamento_id}", status_code=204)
def deletar_orcamento(
    orcamento_id: int,
    db: Session = Depends(get_db),
    usuario_admin: Usuario = Depends(verificar_admin),
):
    """
    Deleta um orçamento (apenas se status='Rascunho').
    """
    orcamento = db.query(Orcamento).filter(Orcamento.id == orcamento_id).first()

    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    if orcamento.status == "Aprovado":
        raise HTTPException(
            status_code=400, detail="Não é possível deletar orçamento aprovado"
        )

    db.delete(orcamento)
    db.commit()


@order_router.post("/{orcamento_id}/itens", response_model=OrcamentoResponse)
def adicionar_item_orcamento(
    orcamento_id: int,
    item_data: ItemOrcamentoCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    """
    Adiciona um novo item a um orçamento em rascunho.
    """
    orcamento = db.query(Orcamento).filter(Orcamento.id == orcamento_id).first()

    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    if orcamento.status == "Aprovado":
        raise HTTPException(
            status_code=400, detail="Não é possível alterar orçamento aprovado"
        )

    # Validar atividade
    atividade = (
        db.query(Atividade).filter(Atividade.id == item_data.atividade_id).first()
    )
    if not atividade:
        raise HTTPException(status_code=400, detail="Atividade não encontrada")

    # Obter contrato
    contrato = db.query(Contrato).filter(Contrato.id == orcamento.contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=400, detail="Contrato não encontrado")

    # Obter complexidade da atividade (não pode ser sobrescrita)
    complexidade_snapshot = atividade.complexidade_ust

    # Calcular valores
    ust_item, valor_item_bruto = calcular_item_orcamento(
        item_data.horas_estimadas,
        complexidade_snapshot,
        contrato.valor_ust,
    )

    # Determinar sequência
    max_seq = (
        db.query(ItemOrcamento)
        .filter(ItemOrcamento.orcamento_id == orcamento_id)
        .count()
    )

    # Criar novo item
    novo_item = ItemOrcamento(
        orcamento_id=orcamento_id,
        atividade_id=item_data.atividade_id,
        horas_estimadas=item_data.horas_estimadas,
        complexidade_snapshot=complexidade_snapshot,
        valor_ust_snapshot=contrato.valor_ust,
        sequencia=max_seq + 1,
        subtotal_ust=ust_item,
        subtotal_bruto=valor_item_bruto,
        observacoes=item_data.observacoes,
    )

    db.add(novo_item)

    # Atualizar totais do orçamento
    novo_total_bruto = orcamento.valor_total_bruto + valor_item_bruto
    desconto = novo_total_bruto * (orcamento.desconto_percentual / Decimal("100"))
    novo_valor_liquido = novo_total_bruto - desconto

    orcamento.valor_total_bruto = novo_total_bruto
    orcamento.valor_total_liquido = novo_valor_liquido

    db.commit()
    db.refresh(orcamento)

    return orcamento


@order_router.delete(
    "/{orcamento_id}/itens/{item_orcamento_id}", response_model=OrcamentoResponse
)
def remover_item_orcamento(
    orcamento_id: int,
    item_orcamento_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(verificar_token),
):
    """
    Remove um item de um orçamento em rascunho.
    """
    orcamento = db.query(Orcamento).filter(Orcamento.id == orcamento_id).first()

    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    if orcamento.status == "Aprovado":
        raise HTTPException(
            status_code=400, detail="Não é possível alterar orçamento aprovado"
        )

    item = (
        db.query(ItemOrcamento)
        .filter(
            ItemOrcamento.id == item_orcamento_id,
            ItemOrcamento.orcamento_id == orcamento_id,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404, detail="Item não encontrado neste orçamento"
        )

    # Subtrair valor do item dos totais
    novo_total_bruto = orcamento.valor_total_bruto - item.subtotal_bruto
    desconto = novo_total_bruto * (orcamento.desconto_percentual / Decimal("100"))
    novo_valor_liquido = novo_total_bruto - desconto

    orcamento.valor_total_bruto = novo_total_bruto
    orcamento.valor_total_liquido = novo_valor_liquido

    # Se era o único item, marcar que orçamento ficou vazio
    if len(orcamento.itens) == 1:
        raise HTTPException(
            status_code=400, detail="Orçamento deve ter pelo menos 1 item"
        )

    db.delete(item)
    db.commit()
    db.refresh(orcamento)

    return orcamento
