'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../mypage/MyPage.module.css';
import { fetchMyPage } from './fetchtest';

export default function OtherUserPage() {
  const [data, setData] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });
  const router = useRouter();

  useEffect(() => {
    const userId = sessionStorage.getItem("target_user_id");
    if (!userId) {
      alert("ユーザー情報が見つかりません");
      router.push("/search");
      return;
    }

    fetchMyPage(Number(userId))
      .then(setData)
      .catch(error => {
        console.error("他ユーザーのマイページ取得に失敗:", error);
      });
  }, []);

  const handleMouseEnter = (description: string, e: any) => {
    if (description) {
      const rect = e.target.getBoundingClientRect();
      setTooltip({ visible: true, content: description, x: rect.left, y: rect.top - 30 });
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 });
  };

  const handleBack = () => {
    router.push("/mymap");
  };

  if (!data) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      {/* ✅ ヘッダー背景 */}
      <div className="absolute top-0 left-0 w-full h-[58px] bg-[#fcd34d] z-10" />

      {/* ✅ ヘッダーの戻るボタン */}
      <div className="absolute top-2 right-4 z-20 flex gap-4">
        <button className="px-4 py-2 bg-white rounded hover:bg-gray-100" onClick={handleBack}>
          ← 関連度マップに戻る
        </button>
      </div>

      <div className={styles.pageWrapper}>
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
