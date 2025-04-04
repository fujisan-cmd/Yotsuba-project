'use client';

import { useEffect, useState } from 'react';
import styles from './MyPage.module.css';

export default function MyPage() {
  const [data, setData] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

  useEffect(() => {
    fetch('http://localhost:8000/api/my_page/1')
      .then((res) => res.json())
      .then(setData);
  }, []);

  const handleMouseEnter = (description, e) => {
    if (description) {
      const rect = e.target.getBoundingClientRect();
      setTooltip({ visible: true, content: description, x: rect.left, y: rect.top - 30 });
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 });
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        <div className={styles.header}>
          <button className={styles.topButton}>Top</button>
          <button className={styles.mapButton}>関連度マップ</button>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.profileCard}>
            <div className={styles.photo}></div>
            <div className={styles.profileInfo}>
              <h2>{data.name}</h2>
              <p><strong>部署:</strong> {data.department}</p>
              <p><strong>メール:</strong> {data.email}</p>
            </div>
          </div>


          <div className={styles.detailSection}>
            <div className={styles.row}>
              <div className={styles.section}>
                <h3>スキル（できること）</h3>
                <ul className={styles.itemList}>
                  {data.skills.can.map((s, i) => (
                    <li
                      key={i}
                      onMouseEnter={(e) => handleMouseEnter(s.description, e)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {s.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.section}>
                <h3>スキル（やりたいこと）</h3>
                <ul className={styles.itemList}>
                  {data.skills.will.map((s, i) => (
                    <li
                      key={i}
                      onMouseEnter={(e) => handleMouseEnter(s.description, e)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {s.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.section}>
                <h3>経験（できること）</h3>
                <ul className={styles.itemList}>
                  {data.experiences.can.map((e, i) => (
                    <li
                      key={i}
                      onMouseEnter={(e2) => handleMouseEnter(e.description, e2)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {e.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.section}>
                <h3>経験（やりたいこと）</h3>
                <ul className={styles.itemList}>
                  {data.experiences.will.map((e, i) => (
                    <li
                      key={i}
                      onMouseEnter={(e2) => handleMouseEnter(e.description, e2)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {e.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={styles.section}>
              <h3>趣味・特技</h3>
              <p>{data.hobbies_skills}</p>
            </div>

            <div className={styles.section}>
              <h3>自己紹介</h3>
              <p>{data.self_introduction}</p>
            </div>
          </div>
        </div>

        {tooltip.visible && (
          <div className={styles.tooltip} style={{ top: tooltip.y, left: tooltip.x }}>
            {tooltip.content}
          </div>
        )}
      </div>
    </div>
  );
}
