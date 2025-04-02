from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json
import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

uri = os.getenv("NEO4J_URI")
user = os.getenv("NEO4J_USER")
password = os.getenv("NEO4J_PASSWORD")
driver = GraphDatabase.driver(uri, auth=(user, password))

app = FastAPI()

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    """Neo4jのNodeオブジェクトを辞書に変換"""
    if isinstance(node, dict):  # すでに辞書ならそのまま
        return node
    elif hasattr(node, "items"):  # Nodeオブジェクトの場合
        return dict(node.items())
    return node  # そのまま返す

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