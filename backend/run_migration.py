"""
Run database migration to add audio_duration_seconds column
"""
import psycopg2
from app.config import settings

# Connect to database
conn = psycopg2.connect(settings.DATABASE_URL)
cursor = conn.cursor()

try:
    # Add the column
    cursor.execute("""
        ALTER TABLE answers
        ADD COLUMN IF NOT EXISTS audio_duration_seconds FLOAT;
    """)

    conn.commit()
    print("✅ Migration successful: Added audio_duration_seconds column to answers table")

except Exception as e:
    conn.rollback()
    print(f"❌ Migration failed: {e}")

finally:
    cursor.close()
    conn.close()
