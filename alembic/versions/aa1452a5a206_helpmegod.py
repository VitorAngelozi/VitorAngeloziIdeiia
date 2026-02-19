"""helpmegod

Revision ID: aa1452a5a206
Revises: 361e3778343a
Create Date: 2026-02-18 02:15:45.126501

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa1452a5a206'
down_revision: Union[str, Sequence[str], None] = '361e3778343a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    Nothing to do here; the database was manually adjusted already and
    SQLite cannot alter constraints in place. This migration exists only to
    advance the revision head so autogen won't repeatedly try to make the
    same changes.
    """
    pass


def downgrade() -> None:
    """Downgrade schema.

    Not supported: undoing the manual structural changes is complex and
    unnecessary for development purposes.
    """
    raise NotImplementedError("Cannot downgrade past this migration")
