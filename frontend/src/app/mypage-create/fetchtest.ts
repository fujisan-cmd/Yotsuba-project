import { useEffect, useState } from 'react';

export interface SkillEntry {
  name: string;
  type: 'can' | 'will';
  description: string;
}

export interface ExperienceEntry {
  name: string;
  type: 'can' | 'will';
  description: string;
}

export function useFormData() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/form-data`);
        const data = await res.json();

        setDepartments(Array.isArray(data.departments) ? data.departments : []);
        setSkills(Array.isArray(data.skills) ? data.skills : []);
        setExperiences(Array.isArray(data.experiences) ? data.experiences : []);
      } catch (error) {
        console.error('フォームデータの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, []);

  return { departments, skills, experiences, loading };
}

export async function submitMyPageForm(payload: {
  name: string;
  email: string;
  department_id: number;
  self_introduction: string;
  hobbies_skills: string;
  skills: SkillEntry[];
  experiences: ExperienceEntry[];
}) {
  try {
    const userId = Math.floor(Math.random() * 100000); // 仮の user_id
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/my_page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, user_id: userId }),
    });

    if (!res.ok) {
      console.error('送信エラー:', await res.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('フォーム送信中にエラーが発生しました:', error);
    return false;
  }
}
