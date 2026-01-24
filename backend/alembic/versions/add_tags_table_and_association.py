"""Add tags table and association

Revision ID: add_tags_table_assoc
Revises: 55cdd58588c9
Create Date: 2026-01-24 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_tags_table_assoc'
down_revision = '55cdd58588c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tags table
    op.create_table(
        'tags',
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('name')
    )
    
    # Create post_tags association table
    op.create_table(
        'post_tags',
        sa.Column('post_id', sa.UUID(), nullable=False),
        sa.Column('tag_name', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_name'], ['tags.name'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('post_id', 'tag_name')
    )
    
    # Create index on tag_name for faster lookups
    op.create_index('ix_post_tags_tag_name', 'post_tags', ['tag_name'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_post_tags_tag_name', table_name='post_tags')
    
    # Drop association table
    op.drop_table('post_tags')
    
    # Drop tags table
    op.drop_table('tags')
