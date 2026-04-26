import psycopg2
from app.config import settings

# Connect to database
conn = psycopg2.connect(settings.DATABASE_URL)
cursor = conn.cursor()

# Drop the enum type if it exists
cursor.execute("DROP TYPE IF EXISTS interviewstatus CASCADE;")
conn.commit()

cursor.close()
conn.close()

print("Dropped interviewstatus enum type successfully!")
