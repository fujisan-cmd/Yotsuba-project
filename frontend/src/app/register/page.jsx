"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import registerUser from "./registerUser";

export default function Home() {
  const formRef = useRef();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("reg_email") || "";
    const storedPw = sessionStorage.getItem("reg_password") || "";
    setEmail(storedEmail);
    setPassword(storedPw);
    setPasswordConfirm(storedPw);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(formRef.current);

    if (email === "") {
      alert("メールアドレスは必須項目です!");
    } else if (password.length < 6) {
      alert("パスワードは6文字以上にしてください。");
    } else if (password !== passwordConfirm) {
      alert("入力されたパスワードが一致しません。");
    } else {
      sessionStorage.setItem("reg_email", email);
      sessionStorage.setItem("reg_password", password);
      formData.set("email", email);
      formData.set("pw", password);
      await registerUser(formData);
      router.push("./mypage-create");
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem("reg_email");
    sessionStorage.removeItem("reg_password");
    router.push("/login");
  };

  return (
    <div
      className="w-full h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/top.jpg')" }}
    >
      <div className="bg-white/80 h-full overflow-hidden">
        <div className="w-full h-full">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* ヘッダー */}
            <div className="absolute top-0 left-0 w-full h-[58px] bg-[#c3e99f]" />

            {/* 登録フォーム */}
            <form ref={formRef} onSubmit={handleSubmit}>
            <div className="relative z-10 w-[600px] bg-[#c7d4e5b2] rounded-xl mt-[58px] p-6">
                <div className="text-center mb-4 font-normal text-xl">🍀Yotsuba</div>

                <div className="flex flex-col items-center gap-4">
                  <p className="block text-center mb-2 font-normal text-xl">
                    メールアドレスを入力してください
                  </p>
                  <input
                    type="text"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    spellCheck="false"
                    className="w-full h-[37px] bg-white rounded-xl border border-gray-300 px-3"
                  />

                  <p className="block text-center mb-2 font-normal text-xl">
                    パスワードを入力してください
                  </p>
                  <input
                    type="text"
                    name="pw"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    spellCheck="false"
                    className="w-full h-[37px] bg-white rounded-xl border border-gray-300 px-3"
                  />

                  <p className="block text-center mb-2 font-normal text-xl">
                    パスワードを再度入力してください
                  </p>
                  <input
                    type="text"
                    name="pw-confirm"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    spellCheck="false"
                    className="w-full h-[37px] bg-white rounded-xl border border-gray-300 px-3"
                  />

                  {/* ボタンエリア */}
                  <div className="flex flex-row gap-4 justify-center mt-2">
                    <button
                      type="submit"
                      className="w-[102px] h-[52px] bg-white text-black hover:bg-gray-100 rounded-xl font-normal text-xl"
                    >
                      作成
                    </button>

                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-[102px] h-[52px] bg-white text-black hover:bg-gray-100 rounded-xl font-normal text-xl"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
