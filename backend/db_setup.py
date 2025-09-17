import os, psycopg2
from dotenv import load_dotenv
load_dotenv()

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
conn.autocommit = True
cur = conn.cursor()

# enable pgvector
cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")

# users
cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);
""")

# documents
cur.execute("""
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    upload_time TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);
""")

# embeddings (for semantic search / compare)
cur.execute("""
CREATE TABLE IF NOT EXISTS embeddings (
    id SERIAL PRIMARY KEY,
    doc_id INT REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT,
    chunk_text TEXT,
    embedding vector(384)   -- all-MiniLM-L6-v2 dimension
);
""")

# chat history
cur.execute("""
CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    doc_id INT REFERENCES documents(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user','assistant')),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
""")

cur.close(); conn.close()
print("DB & tables ready ✅")