"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import fetchtest from "./fetchtest";
import neo4j_fetchtest from "./neo4j_fetchtest";

// SSRを無効にしてForceGraph2Dを読み込む
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
  });

export default function Page(){
    const [APIresult, setAPIresult] = useState(["Ping..."]);
    const [graphic, setgraphic] = useState(null);
    const APItest = async () => {
        const pong = await fetchtest();
        setAPIresult(pong.message);
    };
    const Neo4Jtest = async () => {
        const res = await neo4j_fetchtest();
        const parsed = typeof res === "string" ? JSON.parse(res) : res;
        setgraphic(parsed);
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
        
        {graphic && (
            <div>
            <ForceGraph2D graphData={graphic}>
            </ForceGraph2D>
            </div>
        )}
        </>
    );
}