from fastapi import FastAPI, HTTPException, Query, Header, Depends
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
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from janome.tokenizer import Tokenizer
from sklearn.feature_extraction.text import TfidfVectorizer

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

# def add_person_node(tx, name):
#     tx.run('CREATE (p:Person {name: $name}) RETURN p', {'name': name})

# def add_friend_relationship(tx, name, friend_name=None):
#     if not friend_name:
#         tx.run('CREATE (p:Person {name: $name}) RETURN p', {'name': name})
#     else:
#         tx.run('MATCH (p:Person {name: $name}) '
#                'MERGE (f:Person {name: $friend_name})'
#                'CREATE (p)-[:FRIEND]->(f)',
#                name=name, friend_name=friend_name)

def update_similarity_relationship(tx, user_a, user_b, user_a_name, user_b_name, relation_type, sim_score):
    # relation_typeには"HOBBY", "SKILL", "HOBBY_SKILL"などが入る想定
    query = """
    MERGE (a:User { user_id: $user_a })
    SET a.name = $user_a_name
    MERGE (b:User { user_id: $user_b })
    SET b.name = $user_b_name
    MERGE (a)-[r:%s]-(b)
    SET r.similarity = $sim_score
    """ % relation_type
    tx.run(query, user_a=user_a, user_b=user_b, user_a_name=user_a_name, user_b_name=user_b_name, sim_score=sim_score)

@app.get("/api/update_graph")
def update_graph(dict_sim):
    # まずRDBからuser_id, nameの一覧を取得
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT user_id, name FROM my_pages
        """)
        rows = cursor.fetchall()
    conn.close()

    user_ids = [row["user_id"] for row in rows]
    names = [row["name"] for row in rows] # user_idに対応する名前のリスト

    # 閾値を超えた関係を抽出、neo4j呼び出す
    th_skill = 0.8
    th_experience = 0.5
    th_hobby = 0.1
    th_intro = 0.4
    skill_similarity = dict_sim["skill"]
    experience_similarity = dict_sim["experience"]
    hobby_similarity = dict_sim["hobby"]
    intro_similarity = dict_sim["intro"]
    with driver.session() as session:
        num_users = len(user_ids)
        for i in range(num_users):
            for j in range(i + 1, num_users):
                sim_skill = skill_similarity[i][j]  # 類似度行列から該当スコアを抽出
                if sim_skill >= th_skill:
                    session.execute_write(update_similarity_relationship, \
                                          user_ids[i], user_ids[j], names[i], names[j], "skill", sim_skill)
                sim_experience = experience_similarity[i][j]  # 類似度行列から該当スコアを抽出
                if sim_experience >= th_experience:
                    session.execute_write(update_similarity_relationship, \
                                          user_ids[i], user_ids[j], names[i], names[j], "experience", sim_experience)
                sim_hobby = hobby_similarity[i][j]  # 類似度行列から該当スコアを抽出
                if sim_hobby >= th_hobby:
                    session.execute_write(update_similarity_relationship, \
                                          user_ids[i], user_ids[j], names[i], names[j], "hobby", sim_hobby)
                sim_intro = intro_similarity[i][j]  # 類似度行列から該当スコアを抽出
                if sim_intro >= th_intro:
                    session.execute_write(update_similarity_relationship, \
                                          user_ids[i], user_ids[j], names[i], names[j], "intro", sim_intro)

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
        return {
            "user_id": user["id"],
            "token": token
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

def verify_token(Authorization: str = Header(None)):
    """
        戻り値の例: {'user_id': 99222, 'exp': 1744469405}
    """
    if not Authorization:
        raise HTTPException(status_code=401, detail="Authorization header is missing")
    
    try:
        token = Authorization.split(" ")[1]
        payload = jwt.decode(token, JWT_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/api/me")
def get_me(user_payload=Depends(verify_token)):
    user_id = user_payload["user_id"]

    # decodeして得たuser_idをもとにDBから情報を取得
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    users.id, users.email, my_pages.name, 
                    departments.name AS department,
                    my_pages.self_introduction, my_pages.hobbies_skills
                FROM users
                JOIN my_pages ON users.id = my_pages.user_id
                LEFT JOIN departments ON my_pages.department_id = departments.id
                WHERE users.id = %s
            """, (user_id,))
            user_info = cursor.fetchone()

            if not user_info:
                raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
            
            cursor.execute("""
                SELECT 
                    skills.name, my_page_skills.type, my_page_skills.description
                FROM my_page_skills
                JOIN skills ON my_page_skills.skill_id = skills.id
                WHERE my_page_skills.user_id = %s
            """, (user_id,))
            skills_rows = cursor.fetchall()
            skills = {
                "can": [s for s in skills_rows if s["type"] == "can"],
                "will": [s for s in skills_rows if s["type"] == "will"]
            }

            cursor.execute("""
                SELECT 
                    experiences.name, my_page_experiences.type, my_page_experiences.description
                FROM my_page_experiences
                JOIN experiences ON my_page_experiences.experience_id = experiences.id
                WHERE my_page_experiences.user_id = %s
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

# def search_all(tx):
#     query = """MATCH (u:User)
#             WITH collect({
#                 id: u.user_id,
#                 name: u.name,
#                 // 例として、ノードのサイズは接続数から算出（必要に応じて集計方法を変更してください）
#                 size: size([(u)--() | 1])
#             }) AS nodes
#             MATCH (a:User)-[r]-(b:User)
#             WITH nodes, collect({
#                 source: a.user_id,
#                 target: b.user_id,
#                 similarity: r.similarity,
#                 relation_type: type(r)
#             }) AS links
#             RETURN nodes, links
#             """
#     result = tx.run(query)
#     record = result.single()
#     return {"nodes": record["nodes"], "links": record["links"]}

def search_all(tx, user_id):
    query = """
            MATCH (u:User {user_id: $user_id})-[r]-(other:User)
            WITH u, other, r,
                COUNT { (u)--() } AS center_degree,
                COUNT { (other)--() } AS other_degree
            WITH collect(DISTINCT {
                    id: u.user_id,
                    name: u.name,
                    size: center_degree
                }) + collect(DISTINCT {
                    id: other.user_id,
                    name: other.name,
                    size: other_degree
                }) AS nodes,
                collect(DISTINCT {
                    source: u.user_id,
                    target: other.user_id,
                    similarity: r.similarity,
                    relation_type: type(r)
                }) AS links
            RETURN nodes, links
            """
    result = tx.run(query, user_id=user_id)
    print("result:", result)
    record = result.single()
    return {"nodes": record["nodes"], "links": record["links"]}

@app.get("/graph_info")
def get_graph_info(user_payload=Depends(verify_token)):
    user_id = user_payload["user_id"]

    try:
        with driver.session() as session:
            data = session.execute_read(search_all, user_id)
        return json.dumps(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"取得失敗: {str(e)}")

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

def fetch_user_data():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    my_pages.user_id,
                    my_pages.hobbies_skills,
                    my_pages.self_introduction,
                    GROUP_CONCAT(DISTINCT skills.name),
                    GROUP_CONCAT(DISTINCT experiences.name)
                FROM my_pages
                LEFT JOIN my_page_skills
                    ON my_page_skills.user_id = my_pages.user_id
                LEFT JOIN skills
                    ON skills.id = my_page_skills.skill_id
                LEFT JOIN my_page_experiences
                    ON my_page_experiences.user_id = my_pages.user_id
                LEFT JOIN experiences
                    ON experiences.id = my_page_experiences.experience_id
                GROUP BY my_pages.user_id, my_pages.hobbies_skills, my_pages.self_introduction;
            """)
            rows = cursor.fetchall()  # 辞書形式で全行取得
    finally:
        conn.close()

    # 取得した各行の「GROUP_CONCAT」結果をカンマ区切り文字列からリストに変換
    user_data = []
    for row in rows:
        skills_str = row.get("GROUP_CONCAT(DISTINCT skills.name)")
        experiences_str = row.get("GROUP_CONCAT(DISTINCT experiences.name)")
        
        skills = skills_str.split(',') if skills_str else []
        experiences = experiences_str.split(',') if experiences_str else []

        user_entry = {
            "user_id": row["user_id"],
            "hobbies_skills": row["hobbies_skills"],
            "self_introduction": row["self_introduction"],
            "skills": skills,
            "experiences": experiences
        }
        user_data.append(user_entry)
    
    # 念のためuser_id昇順に並べ直し
    sorted_data = sorted(user_data, key=lambda d: d["user_id"])
    hobbies = [user["hobbies_skills"] for user in sorted_data]
    self_intro = [user["self_introduction"] for user in sorted_data]
    print("user_data:", sorted_data)
    return sorted_data, hobbies, self_intro

@app.get("/api/DBfetch")
def calc_similarity():
    """
        自己紹介・趣味・スキル・経験の4項目でそれぞれ類似度行列を算出し、線形結合をとる関数.
    """
    # STEP1 経験とスキルの類似度
    current_dir = os.path.dirname(os.path.abspath(__file__))
    skill_embeddings = np.load(os.path.join(current_dir, 'output_embeddings', 'skill_embeddings_dict.npy'), allow_pickle=True).item()
    experience_embeddings = np.load(os.path.join(current_dir, 'output_embeddings', 'exp_embeddings_dict.npy'), allow_pickle=True).item()

    user_data, hobbies, self_intro = fetch_user_data()
    # 項目を.npyファイルを参照してベクトルに変換する関数(項目が複数の場合も対応)
    def aggregate_vector(items, embeddings):
        vecs = [embeddings[item] for item in items if item in embeddings]
        # 埋め込みが存在しない場合は、ゼロベクトルを返す
        return np.mean(vecs, axis=0) if vecs else np.zeros(next(iter(embeddings.values())).shape)
        
    user_ids = []
    user_skill_vectors = []
    user_experience_vectors = []

    for user in user_data:
        user_ids.append(user["user_id"])
        user_skill_vectors.append(aggregate_vector(user["skills"], skill_embeddings))
        user_experience_vectors.append(aggregate_vector(user["experiences"], experience_embeddings))

    skill_similarity_matrix = cosine_similarity(user_skill_vectors)
    experience_similarity_matrix = cosine_similarity(user_experience_vectors)
    print("スキル類似度行列:")
    print(skill_similarity_matrix)
    print("経験類似度行列:")
    print(experience_similarity_matrix)

    # STEP2. 趣味と自己紹介の類似度
    t = Tokenizer()
    def analyzer(x):
        """
        美しい花が咲いている -> ['美しい', '花', 'が', '咲いて', 'いる']とする関数
        """
        return [token.surface for token in t.tokenize(x)]
    
    vectorizer = TfidfVectorizer(analyzer=analyzer)
    hobby_matrix = vectorizer.fit_transform(hobbies) # テキストデータのベクトル化
    intro_matrix = vectorizer.fit_transform(self_intro)
    hobby_similarity_matrix = cosine_similarity(hobby_matrix)
    intro_similarity_matrix = cosine_similarity(intro_matrix)
    print("趣味類似度行列:")
    print(hobby_similarity_matrix)
    print("自己紹介類似度行列:")
    print(intro_similarity_matrix)

    total_similarity_matrix = 0.3*skill_similarity_matrix \
        + 0.3*experience_similarity_matrix \
            + 0.2*hobby_similarity_matrix \
                + 0.2*intro_similarity_matrix
    print("総合的な類似度行列:")
    print(total_similarity_matrix)
    return {"skill": skill_similarity_matrix, 
            "experience": experience_similarity_matrix, 
            "hobby": hobby_similarity_matrix, 
            "intro": intro_similarity_matrix}

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

        dict_sim = calc_similarity()
        update_graph(dict_sim)
        return {
            "message": "ユーザーとマイページを登録しました",
            "user_id": user_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"登録失敗: {str(e)}")

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
    name: str
    department: str
    self_introduction: str
    hobbies_skills: str
    skills: list[SkillInput] = []
    experiences: list[ExperienceInput] = []

@app.post("/api/update_my_page")
def update_my_page(data: UpdateRequest, token_data: dict = Depends(verify_token)):
    user_id = token_data["user_id"]

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
            """, (data.name, department_id, data.self_introduction, data.hobbies_skills, user_id))

            # 🔄 既存スキル・経験 削除
            cursor.execute("DELETE FROM my_page_skills WHERE user_id = %s", (user_id,))
            cursor.execute("DELETE FROM my_page_experiences WHERE user_id = %s", (user_id,))

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
                """, (user_id, skill_id, skill.type, skill.description))

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
                """, (user_id, exp_id, exp.type, exp.description))

        conn.commit()
        conn.close()

        return {"message": "マイページを更新しました"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失敗: {str(e)}")