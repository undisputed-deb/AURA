"""
Run migration to remove unique constraint from answers table
"""
from app.database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        print("Removing unique constraint from answers.question_id...")
        conn.execute(text("ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_question_id_key"))
        conn.commit()
        print("✅ Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
