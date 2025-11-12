import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Download, RotateCcw } from "lucide-react";
import PageTransition from "../Components/PageTransition";

export default function Page3() {
  const { state } = useLocation();
  const { result, originalPhoto } = state || {};
  const [showBefore, setShowBefore] = useState(true);
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-semibold text-primary text-center mb-4">
          Your AI Hairstyle ✨
        </h1>
        <div className="flex justify-center gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-lg font-medium ${
              showBefore ? "bg-accent text-white" : "bg-gray-200"
            }`}
            onClick={() => setShowBefore(true)}
          >
            Before
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium ${
              !showBefore ? "bg-accent text-white" : "bg-gray-200"
            }`}
            onClick={() => setShowBefore(false)}
          >
            After
          </button>
        </div>

        <img
          src={showBefore ? originalPhoto : result.generatedImage}
          alt="AI result"
          className="rounded-xl w-full mb-6 aspect-square object-cover shadow-md"
        />

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-800 font-medium leading-relaxed">
            {result.suggestion}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = result.generatedImage;
              a.download = "hairstyle.jpg";
              a.click();
            }}
            className="w-full py-3 bg-accent text-white rounded-lg flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Image
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 border border-gray-300 rounded-lg flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Try Another Style
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
