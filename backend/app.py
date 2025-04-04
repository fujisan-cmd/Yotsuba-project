from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import pymysql

# .envを読み込む
load_dotenv()

# 環境変数から接続情報を取得
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

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

# Pingテスト用
@app.get("/")
def index():
    return {"message": "Pong!"}

# マイページ取得API
@app.get("/api/my_page/{user_id}")
def get_my_page(user_id: int):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # 基本情報 + 部署 + メールを取得
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

            # スキル取得（description付き）
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

            # 経験取得（description付き）
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
