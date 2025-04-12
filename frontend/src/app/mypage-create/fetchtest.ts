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
  password: string;
  department_id: number;
  self_introduction: string;
  hobbies_skills: string;
  skills: SkillEntry[];
  experiences: ExperienceEntry[];
}): Promise<{ user_id: number } | false> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/register_full`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('送信エラー:', text);
      return false;
    }

    const result = await res.json(); // { user_id: number }
    return result;
  } catch (error) {
    console.error('フォーム送信中にエラーが発生しました:', error);
    return false;
  }
}
