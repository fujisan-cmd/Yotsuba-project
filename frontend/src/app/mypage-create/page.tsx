'use client';

import { useEffect, useState } from 'react';
import styles from './MyPage.module.css';
import { useFormData, submitMyPageForm, SkillEntry, ExperienceEntry } from './fetchtest';

export default function CreateMyPage() {
  const { departments, skills, experiences } = useFormData();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState(0);
  const [selfIntroduction, setSelfIntroduction] = useState('');
  const [hobbiesSkills, setHobbiesSkills] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<SkillEntry[]>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<ExperienceEntry[]>([]);

  const addSkill = () => {
    setSelectedSkills([...selectedSkills, { name: '', type: 'can', description: '' }]);
  };

  const addExperience = () => {
    setSelectedExperiences([...selectedExperiences, { name: '', type: 'can', description: '' }]);
  };

  const handleSubmit = async () => {
    const payload = {
      name,
      email,
      department_id: departmentId,
      self_introduction: selfIntroduction,
      hobbies_skills: hobbiesSkills,
      skills: selectedSkills,
      experiences: selectedExperiences,
    };
    const ok = await submitMyPageForm(payload);
    if (ok) alert('マイページを作成しました！');
    else alert('エラーが発生しました');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>マイページ作成</h1>
      <div className={styles.gridTwoCols}>
        <div>
          <label className={styles.label}>氏名</label>
          <input value={name} onChange={e => setName(e.target.value)} className={styles.input} spellCheck="false" />
        </div>
        <div>
          <label className={styles.label}>メールアドレス</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className={styles.input} spellCheck="false" />
        </div>
        <div className={styles.fullWidth}>
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
        <textarea value={selfIntroduction} onChange={e => setSelfIntroduction(e.target.value)} className={styles.textarea} spellCheck="false" />
      </div>
      <div>
        <label className={styles.label}>趣味・特技</label>
        <textarea value={hobbiesSkills} onChange={e => setHobbiesSkills(e.target.value)} className={styles.textarea} spellCheck="false" />
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
            }} className={styles.input} spellCheck="false" />
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
            }} className={styles.input} spellCheck="false" />
            <button type='button' className={styles.deleteButton} onClick={() => {
              const updated = [...selectedExperiences];
              updated.splice(idx, 1);
              setSelectedExperiences(updated);
            }}>削除</button>
          </div>
        ))}
        <button onClick={addExperience} className={styles.addButton}>＋ 経験追加</button>
      </div>

      <button onClick={handleSubmit} className={styles.submitButton}>マイページを作成</button>
    </div>
  );
}
