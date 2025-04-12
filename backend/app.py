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
import jwt
import datetime
from typing import Optional
from fastapi import Request


load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

app = FastAPI()

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
            key = (str(n.id), str(m.id), r.type)
            if key not in link_set:
                links.append({
                    'source': str(n.id),
                    'target': str(m.id),
                    'type': r.type
                })
                link_set.add(key)
    return json.dumps({'nodes': nodes, 'links': links}, indent=2)

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
        """, (email.email,))
        result = cursor.fetchone()
    conn.close()
    return {"exists": bool(result["email_exists"])}

class UserBasic(BaseModel):
    email: str
    password: str

def get_user_by_credentials(email, password):
    """
        DBにemailとPWで照合し、合致していれば次のようなJSONを返す
        ex. return {'id': 1}
    """
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT id FROM users WHERE email = %s AND password = %s
        """, (email, password))
        user = cursor.fetchone()
    conn.close()
    return user

JWT_KEY = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
def create_JWT(id: str):
    payload = {
        "user_id": id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2) # 有効期限
    }
    token = jwt.encode(payload, JWT_KEY, algorithm="HS256")
    return token

@app.post("/api/login")
def login(request: UserBasic):
    # print(request.email)
    # print(request.password)
    user = get_user_by_credentials(request.email, request.password)
    if user:
        token = create_JWT(id=user["id"])
        return {"token": token}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

# @app.post("/api/register")
# def register_user(userinfo: UserBasic):
#     print(userinfo.email)
#     return {"result": "OK"}
#     # if result:
#     #     result_json = json.loads(result)
#     #     return result_json if result_json else None
#     # return None

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

class SkillInput(BaseModel):
    name: str
    type: str
    description: str = ""

class ExperienceInput(BaseModel):
    name: str
    type: str
    description: str = ""

class RegisterFullRequest(BaseModel):
    email: str
    password: str
    name: str
    department_id: int
    self_introduction: str
    hobbies_skills: str
    skills: list[SkillInput] = []
    experiences: list[ExperienceInput] = []

@app.post("/api/register_full")
def register_full(data: RegisterFullRequest):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO users (email, password)
                VALUES (%s, %s)
            """, (data.email, data.password))
            user_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO my_pages (user_id, name, department_id, self_introduction, hobbies_skills)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, data.name, data.department_id, data.self_introduction, data.hobbies_skills))

            for skill in data.skills:
                cursor.execute("SELECT id FROM skills WHERE name = %s", (skill.name,))
                skill_row = cursor.fetchone()
                skill_id = skill_row["id"] if skill_row else None
                if not skill_id:
                    cursor.execute("INSERT INTO skills (name) VALUES (%s)", (skill.name,))
                    skill_id = cursor.lastrowid
                cursor.execute("""
                    INSERT INTO my_page_skills (user_id, skill_id, type, description)
                    VALUES (%s, %s, %s, %s)
                """, (user_id, skill_id, skill.type, skill.description))

            for exp in data.experiences:
                cursor.execute("SELECT id FROM experiences WHERE name = %s", (exp.name,))
                exp_row = cursor.fetchone()
                exp_id = exp_row["id"] if exp_row else None
                if not exp_id:
                    cursor.execute("INSERT INTO experiences (name) VALUES (%s)", (exp.name,))
                    exp_id = cursor.lastrowid
                cursor.execute("""
                    INSERT INTO my_page_experiences (user_id, experience_id, type, description)
                    VALUES (%s, %s, %s, %s)
                """, (user_id, exp_id, exp.type, exp.description))

        conn.commit()
        conn.close()

        return {
            "message": "ユーザーとマイページを登録しました",
            "user_id": user_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"登録失敗: {str(e)}")

class LoginRequest(BaseModel):
    email: str
    password: str

# @app.post("/api/login")
# def login(data: LoginRequest):
#     conn = get_connection()
#     try:
#         with conn.cursor() as cursor:
#             cursor.execute("""
#                 SELECT id FROM users
#                 WHERE email = %s AND password = %s
#             """, (data.email, data.password))
#             user = cursor.fetchone()
#         if user:
#             return {"user_id": user["id"]}
#         else:
#             raise HTTPException(status_code=401, detail="メールアドレスまたはパスワードが正しくありません")
#     finally:
#         conn.close()

@app.get("/api/my_page/{user_id}")
def get_my_page(user_id: int):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT u.id, u.email, mp.name, d.name AS department,
                       mp.self_introduction, mp.hobbies_skills
                FROM users u
                JOIN my_pages mp ON u.id = mp.user_id
                LEFT JOIN departments d ON mp.department_id = d.id
                WHERE u.id = %s
            """, (user_id,))
            user_info = cursor.fetchone()

            if not user_info:
                raise HTTPException(status_code=404, detail="ユーザーが見つかりません")

            cursor.execute("""
                SELECT s.name, mps.type, mps.description
                FROM my_page_skills mps
                JOIN skills s ON mps.skill_id = s.id
                WHERE mps.user_id = %s
            """, (user_id,))
            skills_rows = cursor.fetchall()
            skills = {
                "can": [s for s in skills_rows if s["type"] == "can"],
                "will": [s for s in skills_rows if s["type"] == "will"]
            }

            cursor.execute("""
                SELECT e.name, mpe.type, mpe.description
                FROM my_page_experiences mpe
                JOIN experiences e ON mpe.experience_id = e.id
                WHERE mpe.user_id = %s
            """, (user_id,))
            exps_rows = cursor.fetchall()
            experiences = {
                "can": [e for e in exps_rows if e["type"] == "can"],
                "will": [e for e in exps_rows if e["type"] == "will"]
            }

        conn.close()
        return {
            "id": user_info["id"],
            "email": user_info["email"],
            "name": user_info["name"],
            "department": user_info["department"],
            "self_introduction": user_info["self_introduction"],
            "hobbies_skills": user_info["hobbies_skills"],
            "skills": skills,
            "experiences": experiences
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"取得失敗: {str(e)}")

@app.get("/api/search_my_page")
def search_my_page(
    name: Optional[str] = None,
    department: Optional[str] = None,
    skill: Optional[str] = None,
    experience: Optional[str] = None,
    freeword: Optional[str] = None
):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            base_sql = """
                SELECT DISTINCT u.id, mp.name, d.name AS department, u.email,
                                mp.self_introduction, mp.hobbies_skills
                FROM users u
                JOIN my_pages mp ON u.id = mp.user_id
                LEFT JOIN departments d ON mp.department_id = d.id
                LEFT JOIN my_page_skills mps ON u.id = mps.user_id
                LEFT JOIN skills s ON mps.skill_id = s.id
                LEFT JOIN my_page_experiences mpe ON u.id = mpe.user_id
                LEFT JOIN experiences e ON mpe.experience_id = e.id
            """
            where_clauses = []
            params = []

            if name:
                where_clauses.append("mp.name LIKE %s")
                params.append(f"%{name}%")
            if department:
                where_clauses.append("d.name = %s")
                params.append(department)
            if skill:
                where_clauses.append("s.name = %s")
                params.append(skill)
            if experience:
                where_clauses.append("e.name = %s")
                params.append(experience)
            if freeword:
                where_clauses.append("(mp.self_introduction LIKE %s OR mp.hobbies_skills LIKE %s)")
                params.extend([f"%{freeword}%", f"%{freeword}%"])

            if where_clauses:
                base_sql += " WHERE " + " AND ".join(where_clauses)

            # 🔍 ログ出力
            print("SQL文:", base_sql)
            print("パラメータ:", params)

            cursor.execute(base_sql, params)
            result = cursor.fetchall()

        conn.close()
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"検索失敗: {str(e)}")

class UpdateRequest(BaseModel):
    user_id: int
    name: str
    department: str
    self_introduction: str
    hobbies_skills: str
    skills: list[SkillInput] = []
    experiences: list[ExperienceInput] = []

@app.post("/api/update_my_page")
def update_my_page(data: UpdateRequest):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # 🔁 部署ID取得
            cursor.execute("SELECT id FROM departments WHERE name = %s", (data.department,))
            dept_row = cursor.fetchone()
            if not dept_row:
                raise HTTPException(status_code=400, detail="指定された部署が存在しません")
            department_id = dept_row["id"]

            # ✏️ my_pages 更新
            cursor.execute("""
                UPDATE my_pages
                SET name = %s, department_id = %s, self_introduction = %s, hobbies_skills = %s
                WHERE user_id = %s
            """, (data.name, department_id, data.self_introduction, data.hobbies_skills, data.user_id))

            # 🔄 既存スキル・経験 削除
            cursor.execute("DELETE FROM my_page_skills WHERE user_id = %s", (data.user_id,))
            cursor.execute("DELETE FROM my_page_experiences WHERE user_id = %s", (data.user_id,))

            # ➕ スキル再登録
            for skill in data.skills:
                cursor.execute("SELECT id FROM skills WHERE name = %s", (skill.name,))
                row = cursor.fetchone()
                skill_id = row["id"] if row else None
                if not skill_id:
                    cursor.execute("INSERT INTO skills (name) VALUES (%s)", (skill.name,))
                    skill_id = cursor.lastrowid
                cursor.execute("""
                    INSERT INTO my_page_skills (user_id, skill_id, type, description)
                    VALUES (%s, %s, %s, %s)
                """, (data.user_id, skill_id, skill.type, skill.description))

            # ➕ 経験再登録
            for exp in data.experiences:
                cursor.execute("SELECT id FROM experiences WHERE name = %s", (exp.name,))
                row = cursor.fetchone()
                exp_id = row["id"] if row else None
                if not exp_id:
                    cursor.execute("INSERT INTO experiences (name) VALUES (%s)", (exp.name,))
                    exp_id = cursor.lastrowid
                cursor.execute("""
                    INSERT INTO my_page_experiences (user_id, experience_id, type, description)
                    VALUES (%s, %s, %s, %s)
                """, (data.user_id, exp_id, exp.type, exp.description))

        conn.commit()
        conn.close()

        return {"message": "マイページを更新しました"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失敗: {str(e)}")