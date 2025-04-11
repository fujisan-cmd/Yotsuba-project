from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body
from pydantic import BaseModel
import requests
import json
import os
from dotenv import load_dotenv
from neo4j import GraphDatabase
import pymysql

# .envを読み込む
load_dotenv()

# 環境変数から接続情報を取得
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# Neo4j接続情報
NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_connection():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
        ssl={"ssl": {}}
    )

def clear_db(tx):
    tx.run('MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE n,r')

def add_person_node(tx, name):
    tx.run('CREATE (p:Person {name: $name}) RETURN p', {'name': name})

def add_friend_relationship(tx, name, friend_name=None):
    if not friend_name:
        tx.run('CREATE (p:Person {name: $name}) RETURN p', {'name': name})
    else:
        tx.run('MATCH (p:Person {name: $name}) '
               'MERGE (f:Person {name: $friend_name})'
               'CREATE (p)-[:FRIEND]->(f)',
               name=name, friend_name=friend_name)
        
def search_all(tx):
    result = tx.run('MATCH (n)-[r]->(m) RETURN n, r, m')
    nodes = []
    links = []
    node_ids = set()
    link_set = set()

    for record in result:
        n = record['n']
        m = record['m']
        r = record['r']

        for node in [n, m]:
            if node.id not in node_ids:
                nodes.append({
                    'id': str(node.id),
                    'name': node.get('name', ''),
                    'val': node.get('val', 0)
                })
                node_ids.add(node.id)

        if r is not None:
            source_id = str(n.id)
            target_id = str(m.id)
            rel_type = r.type
            key = (source_id, target_id, rel_type)
            if key not in link_set:
                links.append({
                    'source': source_id,
                    'target': target_id,
                    'type': rel_type
                })
                link_set.add(key)

    return json.dumps({'nodes': nodes, 'links': links}, indent=2)

def node_to_dict(node):
    if isinstance(node, dict):
        return node
    elif hasattr(node, "items"):
        return dict(node.items())
    return node

@app.get("/")
def index():
    return {"message": "Pong!"}

class Email(BaseModel):
    email: str

@app.post("/api/check-email")
def check_email(email: Email):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
            SELECT 1 FROM users WHERE email = %s) AS email_exists
        """, {email.email})
        result = cursor.fetchone()
    conn.close()
    return {"exists": bool(result["email_exists"])}

class UserBasic(BaseModel):
    email: str
    password: str

@app.post("/api/register")
def register_user(userinfo: UserBasic):
    print(userinfo.email)
    return {"result": "OK"}
    # if result:
    #     result_json = json.loads(result)
    #     return result_json if result_json else None
    # return None

@app.get("/graph_info")
def get_graph_info():
    with driver.session() as session:
        session.execute_write(clear_db)
        session.execute_write(add_person_node, 'Taro')
        session.execute_write(add_person_node, 'Hanako')
        session.execute_write(add_person_node, 'Jiro')
        session.execute_write(add_friend_relationship, 'Taro', 'Hanako')
        session.execute_write(add_friend_relationship, 'Taro', 'Jiro')
        result = session.execute_read(search_all)
    return result

@app.get("/api/my_page/{user_id}")
def get_my_page(user_id: int):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    mp.name,
                    d.name AS department,
                    u.email,
                    mp.self_introduction,
                    mp.hobbies_skills
                FROM my_pages mp
                LEFT JOIN departments d ON mp.department_id = d.id
                JOIN users u ON mp.user_id = u.id
                WHERE mp.user_id = %s
            """, (user_id,))
            mypage = cursor.fetchone()

            if not mypage:
                raise HTTPException(status_code=404, detail="マイページが見つかりません")

            cursor.execute("""
                SELECT s.name, mps.type, mps.description
                FROM my_page_skills mps
                JOIN skills s ON mps.skill_id = s.id
                WHERE mps.user_id = %s AND mps.deleted_at IS NULL
            """, (user_id,))
            skills = cursor.fetchall()
            mypage["skills"] = {
                "can": [
                    {"name": s["name"], "description": s.get("description", "")}
                    for s in skills if s["type"] == "can"
                ],
                "will": [
                    {"name": s["name"], "description": s.get("description", "")}
                    for s in skills if s["type"] == "will"
                ]
            }

            cursor.execute("""
                SELECT e.name, mpe.type, mpe.description
                FROM my_page_experiences mpe
                JOIN experiences e ON mpe.experience_id = e.id
                WHERE mpe.user_id = %s AND mpe.deleted_at IS NULL
            """, (user_id,))
            experiences = cursor.fetchall()
            mypage["experiences"] = {
                "can": [
                    {"name": e["name"], "description": e.get("description", "")}
                    for e in experiences if e["type"] == "can"
                ],
                "will": [
                    {"name": e["name"], "description": e.get("description", "")}
                    for e in experiences if e["type"] == "will"
                ]
            }

        conn.close()
        return mypage

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SkillInput(BaseModel):
    name: str
    type: str
    description: str = ""

class ExperienceInput(BaseModel):
    name: str
    type: str
    description: str = ""

class MyPageCreateRequest(BaseModel):
    user_id: int
    name: str
    department_id: int
    self_introduction: str
    hobbies_skills: str
    email: str
    skills: list[SkillInput] = []
    experiences: list[ExperienceInput] = []

@app.post("/api/my_page")
def create_my_page(data: MyPageCreateRequest):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT IGNORE INTO users (id, email)
                VALUES (%s, %s)
            """, (data.user_id, data.email))

            cursor.execute("""
                INSERT INTO my_pages (user_id, name, department_id, self_introduction, hobbies_skills)
                VALUES (%s, %s, %s, %s, %s)
            """, (data.user_id, data.name, data.department_id, data.self_introduction, data.hobbies_skills))

            for skill in data.skills:
                cursor.execute("SELECT id FROM skills WHERE name = %s", (skill.name,))
                skill_row = cursor.fetchone()
                if skill_row:
                    skill_id = skill_row["id"]
                else:
                    cursor.execute("INSERT INTO skills (name) VALUES (%s)", (skill.name,))
                    skill_id = cursor.lastrowid
                cursor.execute("""
                    INSERT INTO my_page_skills (user_id, skill_id, type, description)
                    VALUES (%s, %s, %s, %s)
                """, (data.user_id, skill_id, skill.type, skill.description))

            for exp in data.experiences:
                cursor.execute("SELECT id FROM experiences WHERE name = %s", (exp.name,))
                exp_row = cursor.fetchone()
                if exp_row:
                    exp_id = exp_row["id"]
                else:
                    cursor.execute("INSERT INTO experiences (name) VALUES (%s)", (exp.name,))
                    exp_id = cursor.lastrowid
                cursor.execute("""
                    INSERT INTO my_page_experiences (user_id, experience_id, type, description)
                    VALUES (%s, %s, %s, %s)
                """, (data.user_id, exp_id, exp.type, exp.description))

        conn.commit()
        conn.close()
        return {"message": "マイページを作成しました"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login_user(user: dict = Body(...)):
    email = user.get("email")
    password = user.get("password")

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, email, password, registration_status, registered_at
                FROM users
                WHERE email = %s
            """, (email,))
            result = cursor.fetchone()

        conn.close()

        if result and result["password"] == password:
            return {
                "message": "ログイン成功",
                "user_id": result["id"],
                "email": result["email"],
                "registration_status": result["registration_status"],
                "registered_at": str(result["registered_at"])
            }
        else:
            raise HTTPException(status_code=401, detail="ログイン失敗：IDかパスワードが間違っています")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"サーバーエラー：{str(e)}")

@app.get("/search")
def search(q: str = Query()):
    if q is None:
        return {"result": "検索キーワードを入力してください"}
    return {"result": f"キーワードは {q} です"}


@app.get("/api/form-data")
def get_form_data():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name FROM departments")
            departments = cursor.fetchall()

            cursor.execute("SELECT id, name FROM skills")
            skills = cursor.fetchall()

            cursor.execute("SELECT id, name FROM experiences")
            experiences = cursor.fetchall()

        conn.close()
        return {
            "departments": departments,
            "skills": skills,
            "experiences": experiences
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
