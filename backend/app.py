from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pymysql
import requests
import json

app = FastAPI()

# MySQL接続情報
DB_HOST = "rdbs-002-step3-2-oshima13.mysql.database.azure.com"
DB_USER = "tech0gen9student"
DB_PASSWORD = "vY7JZNfU"
DB_NAME = "step3db"

def get_connection():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
        ssl={"ssl": {}}
    )

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def index():
    return {"message": "Pong!"}
    
# マイページ
@app.get("/api/my_page/{user_id}")
def get_my_page(user_id: int):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # ユーザー基本情報＋マイページ情報を取得（JOIN）
            cursor.execute("""
                SELECT 
                    mp.name,
                    d.name AS department,
                    mp.self_introduction,
                    mp.hobbies_skills
                FROM my_pages mp
                LEFT JOIN departments d ON mp.department_id = d.id
                WHERE mp.user_id = %s
            """, (user_id,))
            mypage = cursor.fetchone()

            if not mypage:
                raise HTTPException(status_code=404, detail="マイページが見つかりません")

            # スキル取得
            cursor.execute("""
                SELECT s.name, mps.type
                FROM my_page_skills mps
                JOIN skills s ON mps.skill_id = s.id
                WHERE mps.user_id = %s AND mps.deleted_at IS NULL
            """, (user_id,))
            skills = cursor.fetchall()
            mypage["skills"] = {
                "can": [s["name"] for s in skills if s["type"] == "can"],
                "will": [s["name"] for s in skills if s["type"] == "will"]
            }

            # 経験取得
            cursor.execute("""
                SELECT e.name, mpe.type
                FROM my_page_experiences mpe
                JOIN experiences e ON mpe.experience_id = e.id
                WHERE mpe.user_id = %s AND mpe.deleted_at IS NULL
            """, (user_id,))
            experiences = cursor.fetchall()
            mypage["experiences"] = {
                "can": [e["name"] for e in experiences if e["type"] == "can"],
                "will": [e["name"] for e in experiences if e["type"] == "will"]
            }

        conn.close()
        return mypage

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))