"use client";
import { useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

export default function Page(){
    // const drawGraph = async () => {
    //         const res = await fetchGraph();
    //     };
    const data = {
        "nodes": [ 
            { 
              "id": "id1",
              "name": "Taro",
              "val": 1 
            },
            { 
              "id": "id2",
              "name": "Hanako",
              "val": 10 
            },
        ],
        "links": [
            {
                "source": "id1",
                "target": "id2"
            },
        ]
    }
    
    return(
        <>
        <button className="btn btn-neutral w-full border-0 bg-blue-200 text-black hover:text-white">
            Get Graph Data
        </button>
        <ForceGraph2D graphData={data}>
        </ForceGraph2D>
        </>
    );
}