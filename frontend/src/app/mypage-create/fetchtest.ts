'use client';

import { useEffect, useState } from 'react';

export interface OptionType {
  id: number;
  name: string;
}

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

const BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;

export function useFormData() {
  const [departments, setDepartments] = useState<OptionType[]>([]);
  const [skills, setSkills] = useState<OptionType[]>([]);
  const [experiences, setExperiences] = useState<OptionType[]>([]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/departments`)
      .then((res) => res.json())
      .then(setDepartments);

    fetch(`${BASE_URL}/api/skills`)
      .then((res) => res.json())
      .then(setSkills);

    fetch(`${BASE_URL}/api/experiences`)
      .then((res) => res.json())
      .then(setExperiences);
  }, []);

  return { departments, skills, experiences };
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
    const res = await fetch(`${BASE_URL}/api/my_page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('レスポンス本文:', detail);
      return false;
    }

    return true;
  } catch (e) {
    console.error('送信エラー:', e);
    return false;
  }
}
