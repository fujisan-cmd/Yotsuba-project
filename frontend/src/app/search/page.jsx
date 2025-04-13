'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import fetchFormData from './fetchFormData';

export default function SearchPage() {
  const initialFormData = {
    name: '',
    departments: [],
    skills: [],
    experiences: [],
    freeword: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [formOptions, setFormOptions] = useState({
    departments: [],
    skills: [],
    experiences: [],
  });
  const [formLoading, setFormLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("🚀 process.env.NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
  }, []);

  useEffect(() => {
    fetchFormData()
      .then(data => {
        setFormOptions({
          departments: data.departments || [],
          skills: data.skills || [],
          experiences: data.experiences || [],
        });
      })
      .catch(err => {
        console.error('フォームデータの取得に失敗:', err);
      })
      .finally(() => {
        setFormLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value, selectedOptions } = e.target;
    if (e.target.multiple) {
      const values = Array.from(selectedOptions).map(opt => opt.value);
      setFormData(prev => ({ ...prev, [name]: values }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSearch = () => {
    const { name, departments, skills, experiences, freeword } = formData;
    const query = new URLSearchParams();
    if (name && name.trim() !== '') query.append('name', name.trim());
    if (departments.length) departments.forEach(dep => query.append('department', dep));
    if (skills.length) skills.forEach(skill => query.append('skill', skill));
    if (experiences.length) experiences.forEach(exp => query.append('experience', exp));
    if (freeword && freeword.trim() !== '') query.append('freeword', freeword.trim());

    console.log("🔎 保存する検索条件:", query.toString());
    sessionStorage.setItem('searchParams', query.toString());
    router.push('/search-results');
  };

  const handleClear = () => {
    setFormData(initialFormData);
  };

  const handleGoToMyPage = () => {
    const myId = sessionStorage.getItem('user_id');
    if (myId) {
      router.push(`/mypage`);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/login');
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
      {/* ✅ ヘッダー背景とボタン */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '58px',
        backgroundColor: '#c3e99f',
        zIndex: 10
      }} />
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '16px',
        zIndex: 20,
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={handleGoToMyPage}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          マイページ
        </button>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ログアウト
        </button>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '30px',
        borderRadius: '16px',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginTop: '80px'
      }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          メンバー検索
        </h1>

        {formLoading ? (
          <p style={{ textAlign: 'center' }}>読み込み中...</p>
        ) : (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="text"
              name="name"
              placeholder="名前"
              value={formData.name}
              onChange={handleChange}
              style={inputStyle}
            />

            <div>
              <label style={labelStyle}>📁 部署一覧</label>
              <select name="departments" multiple value={formData.departments} onChange={handleChange} style={selectStyle}>
                {formOptions.departments.map(dep => (
                  <option key={dep.id} value={dep.name}>{dep.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>🛠 スキル一覧</label>
              <select name="skills" multiple value={formData.skills} onChange={handleChange} style={selectStyle}>
                {formOptions.skills.map(skill => (
                  <option key={skill.id} value={skill.name}>{skill.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>📚 経験一覧</label>
              <select name="experiences" multiple value={formData.experiences} onChange={handleChange} style={selectStyle}>
                {formOptions.experiences.map(exp => (
                  <option key={exp.id} value={exp.name}>{exp.name}</option>
                ))}
              </select>
            </div>

            <input
              type="text"
              name="freeword"
              placeholder="自己紹介や特技など"
              value={formData.freeword}
              onChange={handleChange}
              style={inputStyle}
            />

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <button type="button" onClick={handleSearch} style={buttonStyleGreen}>検索</button>
              <button type="button" onClick={handleClear} style={buttonStyleRed}>条件クリア</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// スタイル定義
const inputStyle = {
  padding: '10px',
  fontSize: '1rem',
  borderRadius: '6px',
  border: '1px solid #ccc',
  width: '100%',
};

const selectStyle = {
  padding: '10px',
  fontSize: '1rem',
  borderRadius: '6px',
  border: '1px solid #ccc',
  width: '100%',
  height: '100px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '4px',
  fontWeight: 'bold',
};

const buttonStyleGreen = {
  padding: '10px 20px',
  fontWeight: 'bold',
  backgroundColor: '#4caf50',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  width: '120px'
};

const buttonStyleRed = {
  padding: '10px 20px',
  fontWeight: 'bold',
  backgroundColor: '#f44336',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  width: '120px'
};
