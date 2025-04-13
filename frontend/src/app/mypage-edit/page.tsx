'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './MyPage.module.css';
import { fetchFormData, fetchMyPage, updateMyPage } from './fetchtest';

export default function EditMyPage() {
  const router = useRouter();

  const [formOptions, setFormOptions] = useState({
    departments: [],
    skills: [],
    experiences: [],
  });

  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [selfIntroduction, setSelfIntroduction] = useState('');
  const [hobbiesSkills, setHobbiesSkills] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedExperiences, setSelectedExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = sessionStorage.getItem('user_id');
    const token = sessionStorage.getItem('token');
    if (!userId) return router.push('/login');

    Promise.all([fetchFormData(), fetchMyPage(token)])
      .then(([options, user]) => {
        setFormOptions(options);
        setName(user.name || '');
        setDepartment(user.department || '');
        setSelfIntroduction(user.self_introduction || '');
        setHobbiesSkills(user.hobbies_skills || '');
        setSelectedSkills([
          ...user.skills.can,
          ...user.skills.will
        ]);
        setSelectedExperiences([
          ...user.experiences.can,
          ...user.experiences.will
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSkillChange = (idx, key, value) => {
    const updated = [...selectedSkills];
    updated[idx][key] = value;
    setSelectedSkills(updated);
  };

  const handleExperienceChange = (idx, key, value) => {
    const updated = [...selectedExperiences];
    updated[idx][key] = value;
    setSelectedExperiences(updated);
  };

  const addSkill = () => {
    setSelectedSkills([...selectedSkills, { name: '', type: 'can', description: '' }]);
  };

  const addExperience = () => {
    setSelectedExperiences([...selectedExperiences, { name: '', type: 'can', description: '' }]);
  };

  const handleSubmit = async () => {
    const userId = sessionStorage.getItem('user_id');
    const token = sessionStorage.getItem('token');
    if (!userId) return;

    const payload = {
      name,
      department,
      self_introduction: selfIntroduction,
      hobbies_skills: hobbiesSkills,
      skills: selectedSkills,
      experiences: selectedExperiences,
    };

    try {
      await updateMyPage(token, payload);
      alert('更新しました！');
      router.push('/mypage');
    } catch {
      alert('保存に失敗しました');
    }
  };

  const handleCancel = () => {
    router.push('/mypage');
  };

  if (loading) return <div className={styles.container}>読み込み中...</div>;

  return (
    <div className="w-full h-screen bg-cover bg-center" style={{ backgroundImage: "url('/top.jpg')" }}>
      <div className={styles.overlay}>
        <div className="w-full h-full">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute top-0 left-0 w-full h-[58px] bg-[#c3e99f]" />
            <div className="relative z-10 w-[900px] bg-white bg-opacity-70 backdrop-blur-sm rounded-xl mt-[58px] p-6 overflow-y-auto max-h-[calc(100vh-100px)]">
              <div className="text-center mb-4 font-normal text-xl">🍀Yotsuba</div>
              <div className={styles.container}>
                <h1 className={styles.title}>マイページ編集</h1>

                <div className={styles.gridTwoCols}>
                  <div>
                    <label className={styles.label}>氏名</label>
                    <input value={name} onChange={e => setName(e.target.value)} className={styles.input} />
                  </div>
                  <div>
                    <label className={styles.label}>部署</label>
                    <select value={department} onChange={e => setDepartment(e.target.value)} className={styles.input}>
                      <option value=''>選択してください</option>
                      {formOptions.departments.map(dep => (
                        <option key={dep.id} value={dep.name}>{dep.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={styles.label}>自己紹介</label>
                  <textarea value={selfIntroduction} onChange={e => setSelfIntroduction(e.target.value)} className={styles.textarea} />
                </div>
                <div>
                  <label className={styles.label}>趣味・特技</label>
                  <textarea value={hobbiesSkills} onChange={e => setHobbiesSkills(e.target.value)} className={styles.textarea} />
                </div>

                <div>
                  <h2 className={styles.subtitle}>スキル</h2>
                  {selectedSkills.map((skill, idx) => (
                    <div key={idx} className={styles.gridThreeCols}>
                      <select value={skill.name} onChange={e => handleSkillChange(idx, 'name', e.target.value)} className={styles.input}>
                        <option value=''>選択</option>
                        {formOptions.skills.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                      <select value={skill.type} onChange={e => handleSkillChange(idx, 'type', e.target.value)} className={styles.input}>
                        <option value='can'>できる</option>
                        <option value='will'>やりたい</option>
                      </select>
                      <input value={skill.description} placeholder='補足' onChange={e => handleSkillChange(idx, 'description', e.target.value)} className={styles.input} />
                      <button type='button' className={styles.deleteButton} onClick={() => {
                        const updated = [...selectedSkills];
                        updated.splice(idx, 1);
                        setSelectedSkills(updated);
                      }}>削除</button>
                    </div>
                  ))}
                  <button onClick={addSkill} className={styles.addButton}>＋ スキル追加</button>
                </div>

                <div>
                  <h2 className={styles.subtitle}>経験</h2>
                  {selectedExperiences.map((exp, idx) => (
                    <div key={idx} className={styles.gridThreeCols}>
                      <select value={exp.name} onChange={e => handleExperienceChange(idx, 'name', e.target.value)} className={styles.input}>
                        <option value=''>選択</option>
                        {formOptions.experiences.map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
                      </select>
                      <select value={exp.type} onChange={e => handleExperienceChange(idx, 'type', e.target.value)} className={styles.input}>
                        <option value='can'>できる</option>
                        <option value='will'>やりたい</option>
                      </select>
                      <input value={exp.description} placeholder='補足' onChange={e => handleExperienceChange(idx, 'description', e.target.value)} className={styles.input} />
                      <button type='button' className={styles.deleteButton} onClick={() => {
                        const updated = [...selectedExperiences];
                        updated.splice(idx, 1);
                        setSelectedExperiences(updated);
                      }}>削除</button>
                    </div>
                  ))}
                  <button onClick={addExperience} className={styles.addButton}>＋ 経験追加</button>
                </div>

                <div className="flex flex-row gap-4 justify-center mt-4">
                  <button onClick={handleSubmit} className={styles.buttonWhite}>保存する</button>
                  <button type="button" onClick={handleCancel} className={styles.buttonWhite}>キャンセル</button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
