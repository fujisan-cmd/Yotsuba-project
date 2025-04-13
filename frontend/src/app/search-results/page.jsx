'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import fetchSearch from '../search/fetchSearch';

export default function SearchResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedParams = sessionStorage.getItem('searchParams');
    if (!savedParams) return;

    const urlParams = new URLSearchParams(savedParams);
    const paramObject = {};

    for (const [key, value] of urlParams.entries()) {
      if (paramObject[key]) {
        paramObject[key] = [].concat(paramObject[key], value);
      } else {
        paramObject[key] = value;
      }
    }

    console.log('🧾 検索パラメータ（オブジェクト）:', paramObject);

    const fetchResults = async () => {
      const data = await fetchSearch(paramObject);
      console.log("🔍 検索結果:", data);
      setResults(data);
      setLoading(false);
    };

    fetchResults();
  }, []);

  const handleBack = () => {
    router.push('/search');
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/login');
  };

  const goToOtherPage = (userId) => {
    sessionStorage.setItem('target_user_id', userId);
    router.push('/mypage-other');
  };

  return (
    <div style={{
      backgroundImage: "url('/search.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      padding: '40px',
      fontFamily: 'sans-serif',
      position: 'relative'
    }}>
      {/* ✅ ヘッダー背景 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '58px',
        backgroundColor: '#c3e99f',
        zIndex: 10
      }} />

      {/* ✅ ヘッダーのボタン群 */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '20px',
        zIndex: 20,
        display: 'flex',
        gap: '12px'
      }}>
        <button
          className="px-4 py-2 bg-white rounded hover:bg-gray-100"
          onClick={() => router.push('/mypage')}
        >
          マイページ
        </button>
        <button
          className="px-4 py-2 bg-white rounded hover:bg-gray-100"
          onClick={handleLogout}
        >
          ログアウト
        </button>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '80px auto 0',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '30px',
        borderRadius: '16px',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          textAlign: 'center',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '24px'
        }}>
          検索結果
        </h1>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <button
            onClick={handleBack}
            style={{
              backgroundColor: '#4caf50',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔍 検索画面に戻る
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center' }}>読み込み中...</p>
        ) : results.length > 0 ? (
          <ul style={{ paddingLeft: '0', listStyle: 'none' }}>
            {results.map((user, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#fff',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  marginBottom: '10px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ flex: '1' }}>
                  <strong>{user.name}</strong>（{user.department}） - {user.email}
                </div>
                <button
                  onClick={() => goToOtherPage(user.id)}
                  style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    marginLeft: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  ▶︎ マイページへ
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ textAlign: 'center' }}>該当するメンバーが見つかりませんでした</p>
        )}
      </div>
    </div>
  );
}
