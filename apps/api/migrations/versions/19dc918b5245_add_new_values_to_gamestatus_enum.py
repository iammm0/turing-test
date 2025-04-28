# alembic/versions/xxxx_add_gamestatus_values.py

from alembic import op

# revision identifiers, used by Alembic.
revision = "xxxx_add_gamestatus_values"
down_revision = "上一个版本的 revision id"
branch_labels = None
depends_on = None

def upgrade():
    # 为 ENUM 类型 gamestatus 添加新值
    op.execute("ALTER TYPE gamestatus ADD VALUE IF NOT EXISTS 'ACTIVE'")
    op.execute("ALTER TYPE gamestatus ADD VALUE IF NOT EXISTS 'CHAT'")
    op.execute("ALTER TYPE gamestatus ADD VALUE IF NOT EXISTS 'JUDGED'")
    op.execute("ALTER TYPE gamestatus ADD VALUE IF NOT EXISTS 'ENDED'")

def downgrade():
    # 注意：PostgreSQL 不支持删除 ENUM 值，通常不做 downgrade
    pass
