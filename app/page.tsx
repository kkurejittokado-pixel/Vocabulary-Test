"use client";
import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";


export default function QuizApp() {
  const [image, setImage] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [message, setMessage] = useState("");

  // 修正後
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY as string);

  // 画像を読み込む処理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    setQuizzes([]); // 新しい画像にしたらリセット
  };

  // AIにクイズを作ってもらう処理
  const generateQuiz = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ 
        model: "google/gemini-2.5-flash", // 安定版
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = "この画像から特徴的なものを探し、英単語クイズを3問作成してください。以下のJSON配列形式で返してください: [{\"word\": \"English\", \"meaning\": \"日本語の意味\", \"choices\": [\"A\", \"B\", \"C\", \"D\"], \"answer\": \"English\"}]";
      const imagePart = { inlineData: { data: image.split(',')[1], mimeType: "image/jpeg" } };

      const result = await model.generateContent([prompt, imagePart]);
      const data = JSON.parse(result.response.text());
      setQuizzes(data);
      setCurrentIdx(0);
      setMessage("");
    } catch (err) {
      alert("エラーが発生しました。APIキーを確認してください。");
    }
    setLoading(false);
  };

  // 正解判定
  const checkAnswer = (selected: string) => {
    if (selected === quizzes[currentIdx].answer) {
      setMessage("✨ 正解！すごい！");
      if (currentIdx < quizzes.length - 1) {
        setTimeout(() => {
          setCurrentIdx(currentIdx + 1);
          setMessage("");
        }, 1500);
      }
    } else {
      setMessage("❌ 惜しい！もう一度選んでみて。");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans">
      <h1 className="text-2xl font-bold text-blue-600 mb-6">画像で英単語クイズ 📸</h1>

      {/* 1. 画像アップロード部分 */}
      {!image ? (
        <label className="w-full max-w-sm h-64 border-4 border-dashed border-blue-200 rounded-3xl flex flex-col items-center justify-center bg-white cursor-pointer active:bg-blue-50 transition-colors">
          <span className="text-4xl mb-2">📷</span>
          <span className="text-gray-500 font-medium">写真を撮ってスタート</span>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
        </label>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <img src={image} className="w-full h-48 object-cover rounded-2xl shadow-lg" alt="Uploaded" />
          
          {quizzes.length === 0 && !loading && (
            <button onClick={generateQuiz} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-transform">
              AIでクイズを生成する
            </button>
          )}
        </div>
      )}

      {/* 2. ロード中表示 */}
      {loading && (
        <div className="mt-10 text-center animate-pulse text-blue-500 font-bold">
          AIが画像をスキャンして問題を考えています...
        </div>
      )}

      {/* 3. クイズ表示部分 */}
      {quizzes.length > 0 && (
        <div className="w-full max-w-sm mt-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-blue-100 text-center">
            <p className="text-sm text-blue-400 font-bold mb-1">第 {currentIdx + 1} 問</p>
            <h2 className="text-2xl font-bold mb-6">「{quizzes[currentIdx].meaning}」を英語で？</h2>
            
            <div className="grid grid-cols-1 gap-3">
              {quizzes[currentIdx].choices.map((choice: string) => (
                <button
                  key={choice}
                  onClick={() => checkAnswer(choice)}
                  className="py-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-100 rounded-xl font-bold active:scale-95 transition-all"
                >
                  {choice}
                </button>
              ))}
            </div>
            {message && <p className={`mt-4 font-bold ${message.includes('正解') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
          </div>
        </div>
      )}
    </main>
  );
}