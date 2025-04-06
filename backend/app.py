from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json

app = FastAPI()

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

@app.post("/login")
def login_user(user: dict):
    email = user.get("email")
    password = user.get("password")
    if email == "test@example.com" and password == "password123":
        return {"message": "ログイン成功"}
    else:
        raise HTTPException(status_code=401, detail="ログイン失敗：IDかパスワードが間違っています")