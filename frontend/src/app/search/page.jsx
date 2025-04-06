'use client';
import { useState } from "react";
import Link from "next/link";
import fetchSearch from "./fetchSearch"

export default function Page(){
    const [inputVal, setinputVal] = useState('');
    const [searchRes, setsearchRes] = useState('');
    const handleSearch = async () => {
        const res = await fetchSearch(inputVal);
        setsearchRes(res);
    }

    return(
        <>
        <header>
            <button>マイページ</button>
        </header>
        <main>
            <input 
                type="text" value={inputVal}
                onChange={(e)=>setinputVal(e.target.value)}
                placeholder="検索ワードを入力"/>
            <button onClick={handleSearch}>検索</button>
            <p>検索結果は{searchRes.result}</p>
        </main>
        </>
    );
}