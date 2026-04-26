"""
Run database migration to add target_company column
"""
import psycopg2
from app.config import settings

conn = psycopg2.connect(settings.DATABASE_URL)
cursor = conn.cursor()

try:
    cursor.execute("""
        ALTER TABLE interviews
        ADD COLUMN IF NOT EXISTS target_company VARCHAR;
    """)

    conn.commit()
    print("✅ Migration successful: Added target_company column to interviews table")

except Exception as e:
    conn.rollback()
    print(f"❌ Migration failed: {e}")

finally:
    cursor.close()
    conn.close()
