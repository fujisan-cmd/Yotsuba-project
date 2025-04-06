"use client";
import { useState } from "react";
import fetchtest from "./fetchtest";

export default function Page(){
    const [APIresult, setAPIresult] = useState(["Ping..."]);
    const APItest = async () => {
        const pong = await fetchtest();
        setAPIresult(pong.message);
    };

    return(
        <>
        <p>これはテストページだよ。</p>
        <button onClick={APItest} className="btn btn-neutral w-full border-0 bg-blue-200 text-black hover:text-white">
            Ping
        </button>
        <p>{APIresult}</p>
        </>
    );
}