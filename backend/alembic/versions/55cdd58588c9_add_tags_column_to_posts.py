"""Add tags column to posts

Revision ID: 55cdd58588c9
Revises: 7efc3c986af5
Create Date: 2026-01-19 13:00:32.185239

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '55cdd58588c9'
down_revision = '7efc3c986af5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Only add the tags column - SQLite doesn't support ALTER COLUMN for type changes
    op.add_column('posts', sa.Column('tags', sa.Text(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # Remove the tags column
    op.drop_column('posts', 'tags')
    # ### end Alembic commands ###
