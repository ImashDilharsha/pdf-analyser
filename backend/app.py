import os, json, hashlib, psycopg2, jwt, datetime, groq, re
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader
from werkzeug.security import check_password_hash, generate_password_hash
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
jwt_mgr = JWTManager(app)

# --- DB helpers -------------------------------------------------
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
register_vector(conn)
cur = conn.cursor()

# --- ML models --------------------------------------------------
embed_model = SentenceTransformer("all-MiniLM-L6-v2")
groq_client = groq.Groq(api_key=os.getenv("GROQ_API_KEY"))

# --- Auth -------------------------------------------------------
@app.post("/api/register")
def register():
    data = request.get_json()
    username, pw, pw2 = data["username"], data["password"], data["confirmPassword"]
    if pw != pw2:
        return jsonify({"msg":"Passwords mismatch"}), 400
    hashed = generate_password_hash(pw)
    try:
        cur.execute("INSERT INTO users (username,password) VALUES (%s,%s) RETURNING id",(username,hashed))
        uid = cur.fetchone()[0]; conn.commit()
        return jsonify({"msg":"User created"}), 201
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"msg":"Username taken"}), 409

@app.post("/api/login")
def login():
    data = request.get_json()
    username, pw = data["username"], data["password"]
    cur.execute("SELECT id,password FROM users WHERE username=%s",(username,))
    row = cur.fetchone()
    if not row or not check_password_hash(row[1], pw):
        return jsonify({"msg":"Bad credentials"}), 401
    token = create_access_token(identity={"uid":row[0],"username":username})
    return jsonify({"token":token})

# --- Upload -----------------------------------------------------
@app.post("/api/upload")
@jwt_required()
def upload():
    file = request.files["pdf"]
    uid = get_jwt_identity()["uid"]
    reader = PdfReader(file)
    text = ""
    for p in reader.pages:
        text += p.extract_text() or ""
    # store doc
    cur.execute("INSERT INTO documents (user_id,filename,metadata) VALUES (%s,%s,%s) RETURNING id",
                (uid, file.filename, json.dumps({"pages":len(reader.pages)})))
    doc_id = cur.fetchone()[0]
    # chunk & embed
    chunk_size, overlap = 400, 50
    start = 0
    idx = 0
    while start < len(text):
        end = start+chunk_size
        chunk = text[start:end]
        emb = embed_model.encode(chunk)
        cur.execute("INSERT INTO embeddings (doc_id,chunk_index,chunk_text,embedding) VALUES (%s,%s,%s,%s)",
                    (doc_id, idx, chunk, emb))
        idx += 1
        start += chunk_size - overlap
    conn.commit()
    return jsonify({"msg":"uploaded","doc_id":doc_id})

# --- List docs --------------------------------------------------
@app.get("/api/docs")
@jwt_required()
def list_docs():
    uid = get_jwt_identity()["uid"]
    cur.execute("SELECT id,filename,upload_time,metadata FROM documents WHERE user_id=%s ORDER BY upload_time DESC",(uid,))
    rows = cur.fetchall()
    docs = [{"id":r[0],"filename":r[1],"upload_time":r[2].isoformat(),"metadata":r[3]} for r in rows]
    return jsonify(docs)

# --- Chat -------------------------------------------------------
@app.post("/api/chat")
@jwt_required()
def chat():
    data = request.get_json()
    uid = get_jwt_identity()["uid"]
    doc_id = data.get("doc_id")   # optional
    question = data["question"]
    # retrieve top chunks
    qemb = embed_model.encode(question)
    cur.execute("""SELECT chunk_text FROM embeddings
                   WHERE doc_id = %s
                   ORDER BY embedding <=> %s LIMIT 5""",
                (doc_id, qemb))
    top = [r[0] for r in cur.fetchall()]
    context = "\n".join(top)
    # groq prompt
    prompt = f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
    reply = groq_client.chat.completions.create(
        model="mixtral-8x7b-32768",
        messages=[{"role":"user","content":prompt}],
        max_tokens=300,
        temperature=0.25
    ).choices[0].message.content
    # store chat
    cur.execute("INSERT INTO chats (user_id,doc_id,role,message) VALUES (%s,%s,'user',%s)",(uid,doc_id,question))
    cur.execute("INSERT INTO chats (user_id,doc_id,role,message) VALUES (%s,%s,'assistant',%s)",(uid,doc_id,reply))
    conn.commit()
    return jsonify({"reply":reply})

# --- Health -----------------------------------------------------
@app.get("/")
def health():
    return "PDF-AnalyseR backend alive"