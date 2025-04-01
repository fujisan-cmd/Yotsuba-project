// page.tsx や MyPage.tsx

'use client';

import { useEffect, useState } from 'react';
import { fetchMyPage } from './fetchtest';

export default function MyPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchMyPage(1).then(setData).catch((err) => {
      console.error(err);
    });
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>部署: {data.department}</p>
      <p>自己紹介: {data.self_introduction}</p>
      <p>趣味・特技: {data.hobbies_skills}</p>

      <h3>スキル（できること）</h3>
      <ul>{data.skills.can.map((s) => <li key={s}>{s}</li>)}</ul>

      <h3>スキル（やりたいこと）</h3>
      <ul>{data.skills.will.map((s) => <li key={s}>{s}</li>)}</ul>

      <h3>経験（できること）</h3>
      <ul>{data.experiences.can.map((e) => <li key={e}>{e}</li>)}</ul>

      <h3>経験（やりたいこと）</h3>
      <ul>{data.experiences.will.map((e) => <li key={e}>{e}</li>)}</ul>
    </div>
  );
}
