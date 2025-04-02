"use client";
import { useState } from "react";
import fetchtest from "./fetchtest";
import neo4j_fetchtest from "./neo4j_fetchtest";

export default function Page(){
    const [APIresult, setAPIresult] = useState(["Ping..."]);
    const [Neo4Jresult, setNeo4Jresult] = useState([""]);
    const APItest = async () => {
        const pong = await fetchtest();
        setAPIresult(pong.message);
    };
    const Neo4Jtest = async () => {
        const res = await neo4j_fetchtest();
        setNeo4Jresult(res);
    };

    return(
        <>
        <p>これはテストページだよ。</p>
        <button onClick={APItest} className="btn btn-neutral w-full border-0 bg-blue-200 text-black hover:text-white">
            Ping
        </button>
        <p>{APIresult}</p>

        <button onClick={Neo4Jtest} className="btn btn-neutral w-full border-0 bg-blue-200 text-black hover:text-white">
            Get Graph Data
        </button>
        <p>{Neo4Jresult}</p>
        </>
    );
}