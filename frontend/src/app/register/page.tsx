"use client";

export default function Home() {
  const formFields = [
    { id: "email", label: "メールアドレスを入力してください" },
    { id: "password", label: "パスワードを入力してください" },
    { id: "confirmPassword", label: "パスワードを再度入力してください" },
  ];

  return (
    <div className="bg-white w-full h-screen">
      <div className="bg-white h-full overflow-hidden">
        <div className="w-full h-full">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* ヘッダー */}
            <div className="absolute top-0 left-0 w-full h-[58px] bg-[#c3e99f]" />

            {/* 登録フォーム */}
            <div className="relative z-10 w-[600px] bg-[#c7d4e5b2] rounded-xl mt-[58px] p-6">
              {/* ヘッダータイトル */}
              <div className="text-center mb-4 font-normal text-xl">
                🍀Yotsuba
              </div>

              {/* フォーム */}
              <form className="flex flex-col items-center gap-4">
                {formFields.map((field) => (
                  <div key={field.id} className="w-full">
                    <label
                      htmlFor={field.id}
                      className="block text-center mb-2 font-normal text-xl"
                    >
                      {field.label}
                    </label>
                    <input
                      id={field.id}
                      type={
                        field.id.includes("password") ? "password" : "text"
                      }
                      className="w-full h-[37px] bg-white rounded-xl border border-gray-300 px-3"
                    />
                  </div>
                ))}

                {/* 送信ボタン */}
                <button
                  type="submit"
                  className="w-[102px] h-[52px] mt-2 bg-white text-black hover:bg-gray-100 rounded-xl font-normal text-xl"
                >
                  作成
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
