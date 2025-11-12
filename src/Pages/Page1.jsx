import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, User2 } from "lucide-react";
import PageTransition from "../Components/PageTransition";

export default function Page1() {
  const [gender, setGender] = useState("");
  const [hairLength, setHairLength] = useState("");
  const navigate = useNavigate();
  const ready = gender && hairLength;

  return (
    <PageTransition>
      <div className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md mx-auto">
        <h1 className="text-4xl font-semibold text-primary mb-2 text-center">
          Find Your Style ❤️
        </h1>
        <p className="text-gray-500 mb-8 text-center">
          Let’s personalize your look
        </p>

        <div className="space-y-8">
          {/* Gender */}
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-600 font-semibold mb-3 block">
              Gender
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "male", icon: User, label: "Male" },
                { value: "female", icon: User2, label: "Female" },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setGender(value)}
                  className={`p-6 rounded-xl border-2 flex flex-col items-center font-medium transition-all duration-200 ${
                    gender === value
                      ? "bg-primary text-white border-primary shadow-lg scale-105"
                      : "border-gray-300 hover:border-primary bg-white"
                  }`}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Hair Length */}
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-600 font-semibold mb-3 block">
              Hair Length
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["short", "medium", "long"].map((len) => (
                <button
                  key={len}
                  onClick={() => setHairLength(len)}
                  className={`py-4 rounded-lg border-2 font-medium capitalize transition-all duration-200 ${
                    hairLength === len
                      ? "bg-accent text-white border-accent shadow-lg"
                      : "bg-white border-gray-300 hover:border-accent"
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          disabled={!ready}
          onClick={() => navigate("/photo", { state: { gender, hairLength } })}
          className={`mt-10 w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
            ready
              ? "bg-gradient-to-r from-primary to-accent hover:scale-105 shadow-md"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Continue →
        </button>
      </div>
    </PageTransition>
  );
}
