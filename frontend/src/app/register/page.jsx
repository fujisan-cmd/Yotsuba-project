"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import registerUser from "./registerUser"

export default function Home() {
    const formRef = useRef();
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(formRef.current);
        // console.log("email:"+formData.get("email"));
        // console.log("pw:"+formData.get("pw"));
        if (formData.get("email") == ""){
            alert("メールアドレスは必須項目です!");
        }
        else if (formData.get("pw").length < 6){
            alert("パスワードは6文字以上にしてください。");
        }
        else if (formData.get("pw") != formData.get("pw-confirm")){
            alert("入力されたパスワードが一致しません。")
        }
        else {
            console.log("確認完了");
            await registerUser(formData);
            router.push("./mypage-create");
        }

    }

  return (
    <div className="bg-white w-full h-screen">
      <div className="bg-white h-full overflow-hidden">
        <div className="w-full h-full">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* ヘッダー */}
            <div className="absolute top-0 left-0 w-full h-[58px] bg-[#c3e99f]" />

            {/* 登録フォーム */}
            <form ref={formRef} onSubmit={handleSubmit}>
            <div className="relative z-10 w-[600px] bg-[#c7d4e5b2] rounded-xl mt-[58px] p-6">
              {/* ヘッダータイトル */}
              <div className="text-center mb-4 font-normal text-xl">
                🍀Yotsuba
              </div>

              {/* フォーム */}
              <div className="flex flex-col items-center gap-4">
                <p className="block text-center mb-2 font-normal text-xl">
                    メールアドレスを入力してください
                </p>
                <input type="text" name="email" 
                className="w-full h-[37px] bg-white rounded-xl border border-gray-300 px-3">
                </input>
                
                <p className="block text-center mb-2 font-normal text-xl">
                    パスワードを入力してください
                </p>
                <input type="text" name="pw" 
                className="w-full h-[37px] bg-white rounded-xl border border-gray-300 px-3">
                </input>

                <p className="block text-center mb-2 font-normal text-xl">
                    パスワードを再度入力してください
                </p>
                <input type="text" name="pw-confirm" 
                className="w-full h-[37px] bg-white rounded-xl border border-gray-300 px-3">
                </input>

                {/* 送信ボタン */}
                <button
                  type="submit"
                  className="w-[102px] h-[52px] mt-2 bg-white text-black hover:bg-gray-100 rounded-xl font-normal text-xl"
                >
                  作成
                </button>
              </div>
            </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}