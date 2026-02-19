from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Date
from decimal import Decimal, ROUND_HALF_UP

Base = declarative_base()

#USUARIOS PARA AUTENTICAÇÃO
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    admin = Column(Integer, default=0)  # 0 para usuário comum, 1 para admin

    def __init__(self, username, password_hash, email=None, admin=0):
        self.username = username
        self.password_hash = password_hash
        self.email = email
        self.admin = admin

# SERVIÇOS CATÁLOGO (modelo unificado with hierarchy)
class ServicosCatalogo(Base):
    __tablename__ = "servicos_catalogo"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # CICLO / FASE / ATIVIDADE
    parent_id = Column(Integer, ForeignKey("servicos_catalogo.id"), nullable=True)
    complexidade_ust = Column(Numeric(18, 4), default=Decimal("0.0000"))

    # self-referential relationships
    parent = relationship("ServicosCatalogo", remote_side=[id], backref="children")

    def __init__(self, nome, tipo, parent_id=None, complexidade_ust=Decimal("0.0000")):
        self.nome = nome
        self.tipo = tipo
        self.parent_id = parent_id
        self.complexidade_ust = complexidade_ust




# CLIENTE

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    razao_social = Column(String, nullable=False)
    cnpj = Column(String, unique=True, nullable=False)

    contratos = relationship("Contrato", back_populates="cliente")
    projetos = relationship("Projeto", back_populates="cliente")

    def __init__(self, razao_social, cnpj):
        self.razao_social = razao_social
        self.cnpj = cnpj


# CONTRATO

class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    numero_contrato = Column(String, unique=True, nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    valor_ust = Column(Numeric(18, 4), default=Decimal("0.0000"))
    data_inicio = Column(Date)
    data_fim = Column(Date)
    status = Column(String)

    cliente = relationship("Cliente", back_populates="contratos")
    projetos = relationship("Projeto", back_populates="contrato")
    orcamentos = relationship("Orcamento", back_populates="contrato")

    def __init__(
        self,
        numero_contrato,
        cliente_id,
        valor_ust=Decimal("0.0000"),
        data_inicio=None,
        data_fim=None,
        status="ativo",
    ):
        self.numero_contrato = numero_contrato
        self.cliente_id = cliente_id
        self.valor_ust = valor_ust
        self.data_inicio = data_inicio
        self.data_fim = data_fim
        self.status = status


# PROJETO

class Projeto(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)
    codigo = Column(String, unique=True, nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    contrato_id = Column(Integer, ForeignKey("contratos.id"), nullable=True)
    status = Column(String)

    cliente = relationship("Cliente", back_populates="projetos")
    contrato = relationship("Contrato", back_populates="projetos")
    orcamentos = relationship("Orcamento", back_populates="projeto")

    def __init__(self, nome, codigo, cliente_id, contrato_id=None, status="ativo"):
        self.nome = nome
        self.codigo = codigo
        self.cliente_id = cliente_id
        self.contrato_id = contrato_id
        self.status = status


# ORÇAMENTO

class Orcamento(Base):
    __tablename__ = "orcamentos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    numero_orcamento = Column(String, unique=True, nullable=False)
    projeto_id = Column(Integer, ForeignKey("projetos.id"), nullable=False)
    contrato_id = Column(Integer, ForeignKey("contratos.id"), nullable=False)
    data_emissao = Column(Date)
    data_validade = Column(Date)
    status = Column(String, default="Rascunho")
    versao = Column(String)
    valor_total_bruto = Column(Numeric(18, 4), default=Decimal("0.0000"))
    desconto_percentual = Column(Numeric(18, 4), default=Decimal("0.0000"))
    valor_total_liquido = Column(Numeric(18, 4), default=Decimal("0.0000"))
    observacoes = Column(String, nullable=True)  # Observações gerais do orçamento

    projeto = relationship("Projeto", back_populates="orcamentos")
    contrato = relationship("Contrato", back_populates="orcamentos")
    itens = relationship("ItemOrcamento", back_populates="orcamento", cascade="all, delete-orphan")


# ITEM ORÇAMENTO

class ItemOrcamento(Base):
    __tablename__ = "itens_orcamento"

    id = Column(Integer, primary_key=True, autoincrement=True)
    orcamento_id = Column(Integer, ForeignKey("orcamentos.id"), nullable=False)
    atividade_id = Column(Integer, ForeignKey("servicos_catalogo.id"), nullable=False)
    horas_estimadas = Column(Numeric(18, 4), default=Decimal("0.0000"))
    complexidade_snapshot = Column(Numeric(18, 4), default=Decimal("0.0000"))  # snapshot da atividade
    valor_ust_snapshot = Column(Numeric(18, 4), default=Decimal("0.0000"))
    sequencia = Column(Integer)
    subtotal_ust = Column(Numeric(18, 4), default=Decimal("0.0000"))
    subtotal_bruto = Column(Numeric(18, 4), default=Decimal("0.0000"))
    observacoes = Column(String, nullable=True)  # Observações por item

    orcamento = relationship("Orcamento", back_populates="itens")
    atividade = relationship("ServicosCatalogo")

    def __init__(
        self,
        orcamento_id,
        atividade_id,
        horas_estimadas=Decimal("0.0000"),
        complexidade_snapshot=Decimal("0.0000"),
        valor_ust_snapshot=Decimal("0.0000"),
        sequencia=0,
        subtotal_ust=Decimal("0.0000"),
        subtotal_bruto=Decimal("0.0000"),
        observacoes=None,
    ):
        self.orcamento_id = orcamento_id
        self.atividade_id = atividade_id
        self.horas_estimadas = horas_estimadas
        self.complexidade_snapshot = complexidade_snapshot
        self.valor_ust_snapshot = valor_ust_snapshot
        self.sequencia = sequencia
        self.subtotal_ust = subtotal_ust
        self.subtotal_bruto = subtotal_bruto
        self.observacoes = observacoes


# AUDITORIA

class HistoricoAuditoria(Base):
    __tablename__ = "historico_auditoria"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tipo_alteracao = Column(String, nullable=False)  # "HORAS_ITEM" ou "DESCONTO_ORCAMENTO"
    orcamento_id = Column(Integer, ForeignKey("orcamentos.id"), nullable=False)
    item_orcamento_id = Column(Integer, ForeignKey("itens_orcamento.id"), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    valor_anterior = Column(Numeric(18, 4), nullable=False)
    valor_novo = Column(Numeric(18, 4), nullable=False)
    data_alteracao = Column(String, nullable=False)  # ISO format datetime
    motivo = Column(String, nullable=True)

    def __init__(
        self,
        tipo_alteracao,
        orcamento_id,
        valor_anterior,
        valor_novo,
        data_alteracao,
        item_orcamento_id=None,
        usuario_id=None,
        motivo=None,
    ):
        self.tipo_alteracao = tipo_alteracao
        self.orcamento_id = orcamento_id
        self.item_orcamento_id = item_orcamento_id
        self.usuario_id = usuario_id
        self.valor_anterior = valor_anterior
        self.valor_novo = valor_novo
        self.data_alteracao = data_alteracao
        self.motivo = motivo


# REGRA DE NEGÓCIO

def calcular_item_orcamento(horas_estimadas, complexidade_ust, valor_ust):
    """
    Calcula os valores de um item de orçamento.
    
    Args:
        horas_estimadas: Horas estimadas para o item (Decimal)
        complexidade_ust: Complexidade UST do item (obtida da Atividade)
        valor_ust: Valor da UST do contrato (Decimal)
    
    Returns:
        Tupla (ust_item, valor_item_bruto)
    """
    horas = Decimal(horas_estimadas)
    complexidade = Decimal(complexidade_ust)
    valor_ust = Decimal(valor_ust)

    ust_item = (complexidade * horas).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    valor_item_bruto = (ust_item * valor_ust).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

    return ust_item, valor_item_bruto