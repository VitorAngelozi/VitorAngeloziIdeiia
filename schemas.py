from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


# ========== USUÁRIO ==========
class UsuarioCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None


class UsuarioResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    admin: int

    class Config:
        from_attributes = True


class UsuarioLogin(BaseModel):
    username: str
    password: str


# ========== CLIENTE ==========
class ClienteCreate(BaseModel):
    razao_social: str
    cnpj: str


class ClienteResponse(ClienteCreate):
    id: int

    class Config:
        from_attributes = True


# ========== CONTRATO ==========
class ContratoCreate(BaseModel):
    numero_contrato: str
    cliente_id: int
    valor_ust: Decimal = Field(..., ge=0, decimal_places=4)
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    status: str = "ativo"


class ContratoUpdate(BaseModel):
    numero_contrato: Optional[str] = None
    valor_ust: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    status: Optional[str] = None


class ContratoResponse(ContratoCreate):
    id: int

    class Config:
        from_attributes = True


# ========== SERVIÇOS CATÁLOGO ==========
class ServicosCatalogoCreate(BaseModel):
    codigo: str
    nome: str
    tipo: str = Field(..., pattern="^(CICLO|FASE|ATIVIDADE)$")
    complexidade_ust: Optional[Decimal] = Field(
        None,
        ge=0,
        decimal_places=4,
        description="Obrigatório apenas se tipo for ATIVIDADE",
    )

    # validações especiais podem ser feitas no endpoint


class ServicosCatalogoUpdate(BaseModel):
    nome: Optional[str] = None
    complexidade_ust: Optional[Decimal] = Field(
        None,
        ge=0,
        decimal_places=4,
        description="Somente para atividades",
    )


class ServicosCatalogoResponse(BaseModel):
    id: int
    nome: str
    tipo: str
    complexidade_ust: Optional[Decimal] = None

    class Config:
        from_attributes = True


# ========== CATALOGO UNIFICADO ==========
class CatalogoCreate(BaseModel):
    nome: str = Field(..., min_length=1, description="Nome do item, não pode estar vazio")
    tipo: str = Field(..., pattern="^(CICLO|FASE|ATIVIDADE)$")
    parent_id: Optional[int] = None
    complexidade_ust: Optional[Decimal] = Field(None, ge=0, decimal_places=4)

    class Config:
        extra = "forbid"


class CatalogoUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, description="Nome do item, não pode estar vazio se fornecido")
    parent_id: Optional[int] = None
    complexidade_ust: Optional[Decimal] = Field(None, ge=0, decimal_places=4)

    class Config:
        extra = "forbid"


class CatalogoResponse(BaseModel):
    id: int
    nome: str
    tipo: str
    parent_id: Optional[int] = None
    complexidade_ust: Optional[Decimal] = None

    class Config:
        from_attributes = True


# ========== PROJETO ==========
class ProjetoCreate(BaseModel):
    nome: str
    codigo: str
    cliente_id: int
    contrato_id: Optional[int] = None
    status: str = "ativo"


class ProjetoUpdate(BaseModel):
    nome: Optional[str] = None
    status: Optional[str] = None


class ProjetoResponse(ProjetoCreate):
    id: int

    class Config:
        from_attributes = True


# ========== ORÇAMENTO ==========
class ItemOrcamentoCreate(BaseModel):
    atividade_id: int
    horas_estimadas: Decimal = Field(..., ge=0, decimal_places=4)
    observacoes: Optional[str] = None


class ItemOrcamentoResponse(BaseModel):
    id: int
    atividade_id: int
    horas_estimadas: Decimal
    complexidade_snapshot: Decimal
    sequencia: int
    subtotal_ust: Decimal
    subtotal_bruto: Decimal
    observacoes: Optional[str] = None

    class Config:
        from_attributes = True


class OrcamentoCreate(BaseModel):
    contrato_id: int
    projeto_id: int
    desconto_percentual: Decimal = Field(
        default=Decimal("0"), ge=0, le=100, decimal_places=4
    )
    observacoes: Optional[str] = None
    itens: List[ItemOrcamentoCreate]


class OrcamentoResponse(BaseModel):
    id: int
    numero_orcamento: str
    projeto_id: int
    contrato_id: int
    data_emissao: date
    status: str
    versao: str
    valor_total_bruto: Decimal
    desconto_percentual: Decimal
    valor_total_liquido: Decimal
    observacoes: Optional[str] = None
    itens: List[ItemOrcamentoResponse]

    class Config:
        from_attributes = True


class OrcamentoDetailResponse(OrcamentoResponse):
    pass


# ========== AUDITORIA ==========
class HistoricoAuditoriaResponse(BaseModel):
    id: int
    tipo_alteracao: str
    orcamento_id: int
    item_orcamento_id: Optional[int] = None
    usuario_id: Optional[int] = None
    valor_anterior: Decimal
    valor_novo: Decimal
    data_alteracao: str
    motivo: Optional[str] = None

    class Config:
        from_attributes = True


# ========== ATUALIZAÇÃO DE HORAS E DESCONTO ==========
class AtualizarHorasItem(BaseModel):
    horas_estimadas: Decimal = Field(..., ge=0, decimal_places=4)
    motivo: Optional[str] = None


class AtualizarDescontoOrcamento(BaseModel):
    desconto_percentual: Decimal = Field(..., ge=0, le=100, decimal_places=4)
    motivo: Optional[str] = None


# ========== TOKEN ==========
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
