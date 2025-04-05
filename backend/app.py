from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
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
               'CREATE (p)-[:FRIEND]->(:Person {name: $friend_name})',
               name=name, friend_name=friend_name)
        
def search_all(tx):
    result = tx.run('MATCH (n) OPTIONAL MATCH (n)-[r]-() RETURN n,r')
    return [r for r in result]

def node_to_dict(node):
    if isinstance(node, dict):
        return node
    elif hasattr(node, "items"):
        return dict(node.items())
    return node

# Pingテスト用
@app.get("/")
def index():
    return {"message": "Pong!"}

@app.get("/graph_info")
def get_graph_info():
    with driver.session() as session:
        session.execute_write(clear_db)
        session.execute_write(add_person_node, 'Taro')
        session.execute_write(add_person_node, 'Hanako')
        session.execute_write(add_friend_relationship, 'Taro', 'Hanako')
        result = session.execute_read(search_all)
        json_str = json.dumps(result, default=node_to_dict, indent=2)
    return json_str

# マイページ取得API
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
    type: str  # can または will
    description: str = ""

class ExperienceInput(BaseModel):
    name: str
    type: str  # can または will
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
            # ユーザー登録（すでにいる場合はスキップしてOK）
            cursor.execute("""
                INSERT IGNORE INTO users (id, email)
                VALUES (%s, %s)
            """, (data.user_id, data.email))

            # マイページ登録
            cursor.execute("""
                INSERT INTO my_pages (user_id, name, department_id, self_introduction, hobbies_skills)
                VALUES (%s, %s, %s, %s, %s)
            """, (data.user_id, data.name, data.department_id, data.self_introduction, data.hobbies_skills))

            # スキル登録
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

            # 経験登録
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
