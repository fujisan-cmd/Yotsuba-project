'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './MyPage.module.css';
import { useFormData, submitMyPageForm, SkillEntry, ExperienceEntry } from './fetchtest';

export default function CreateMyPage() {
  const { departments, skills, experiences, loading } = useFormData();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState(0);
  const [selfIntroduction, setSelfIntroduction] = useState('');
  const [hobbiesSkills, setHobbiesSkills] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<SkillEntry[]>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<ExperienceEntry[]>([]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('reg_email') || '';
    const storedPassword = sessionStorage.getItem('reg_password') || '';
    setEmail(storedEmail);
    setPassword(storedPassword);
  }, []);

  const addSkill = () => {
    setSelectedSkills([...selectedSkills, { name: '', type: 'can', description: '' }]);
  };

  const addExperience = () => {
    setSelectedExperiences([...selectedExperiences, { name: '', type: 'can', description: '' }]);
  };

  const handleSubmit = async () => {
    if (!departmentId) {
      alert('部署を選択してください。');
      return;
    }

    const payload = {
      email,
      password,
      name,
      department_id: departmentId,
      self_introduction: selfIntroduction,
      hobbies_skills: hobbiesSkills,
      skills: selectedSkills,
      experiences: selectedExperiences,
    };

    const result = await submitMyPageForm(payload);

    if (result && result.user_id) {
      sessionStorage.setItem('user_id', String(result.user_id));
      sessionStorage.removeItem('reg_email');
      sessionStorage.removeItem('reg_password');
      alert('マイページを作成しました！');
      router.push('/mypage-success');
    } else {
      alert('エラーが発生しました');
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('reg_email');
    sessionStorage.removeItem('reg_password');
    router.push('/login');
  };

  if (loading) {
    return <div className={styles.container}>読み込み中...</div>;
  }

  return (
    <div className="w-full h-screen bg-cover bg-center" style={{ backgroundImage: "url('/top.jpg')" }}>
      <div className={styles.overlay}>
        <div className="w-full h-full">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute top-0 left-0 w-full h-[58px] bg-[#c3e99f]" />
            <div className="relative z-10 w-[900px] bg-white bg-opacity-70 backdrop-blur-sm rounded-xl mt-[58px] p-6 overflow-y-auto max-h-[calc(100vh-100px)]">
              <div className="text-center mb-4 font-normal text-xl">🍀Yotsuba</div>
              <div className={styles.container}>
                <h1 className={styles.title}>マイページ作成</h1>

                <div className={styles.gridTwoCols}>
                  <div>
                    <label className={styles.label}>氏名</label>
                    <input value={name} onChange={e => setName(e.target.value)} className={styles.input} />
                  </div>
                  <div>
                    <label className={styles.label}>部署</label>
                    <select value={departmentId} onChange={e => setDepartmentId(Number(e.target.value))} className={styles.input}>
                      <option value=''>選択してください</option>
                      {departments.map(dep => (
                        <option key={dep.id} value={dep.id}>{dep.name}</option>
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
                      <select value={skill.name} onChange={e => {
                        const newSkills = [...selectedSkills];
                        newSkills[idx].name = e.target.value;
                        setSelectedSkills(newSkills);
                      }} className={styles.input}>
                        <option value=''>選択</option>
                        {skills.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                      <select value={skill.type} onChange={e => {
                        const newSkills = [...selectedSkills];
                        newSkills[idx].type = e.target.value as 'can' | 'will';
                        setSelectedSkills(newSkills);
                      }} className={styles.input}>
                        <option value='can'>できる</option>
                        <option value='will'>やりたい</option>
                      </select>
                      <input value={skill.description} placeholder='補足' onChange={e => {
                        const newSkills = [...selectedSkills];
                        newSkills[idx].description = e.target.value;
                        setSelectedSkills(newSkills);
                      }} className={styles.input} />
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
                      <select value={exp.name} onChange={e => {
                        const newExps = [...selectedExperiences];
                        newExps[idx].name = e.target.value;
                        setSelectedExperiences(newExps);
                      }} className={styles.input}>
                        <option value=''>選択</option>
                        {experiences.map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
                      </select>
                      <select value={exp.type} onChange={e => {
                        const newExps = [...selectedExperiences];
                        newExps[idx].type = e.target.value as 'can' | 'will';
                        setSelectedExperiences(newExps);
                      }} className={styles.input}>
                        <option value='can'>できる</option>
                        <option value='will'>やりたい</option>
                      </select>
                      <input value={exp.description} placeholder='補足' onChange={e => {
                        const newExps = [...selectedExperiences];
                        newExps[idx].description = e.target.value;
                        setSelectedExperiences(newExps);
                      }} className={styles.input} />
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
                  <button
                    onClick={handleSubmit}
                    className={styles.buttonWhite}
                  >
                    マイページを作成
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className={styles.buttonWhite}
                  >
                    キャンセル
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
