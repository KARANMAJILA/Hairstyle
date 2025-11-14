import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Webcam from "react-webcam";
import { Camera, Upload, X, ArrowLeft } from "lucide-react";
import PageTransition from "../Components/PageTransition";

export default function Page2() {
  const { state } = useLocation();
  const { gender, hairLength } = state || {};
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [isCamera, setIsCamera] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [loading, setLoading] = useState(false);   // ✅ FIXED LINE

  // Hairstyle DB
  const hairstyles = {
    male: {
      short: [
        "Crew Cut",
        "Buzz Fade",
        "Caesar",
        "French Crop",
        "Ivy League",
        "Flat Top",
        "High Fade",
        "Textured Crop",
        "Undercut",
        "Slicked Back Short",
        "Messy Crop",
        "Skin Fade",
      ],
      medium: [
        "Quiff",
        "Slicked Back",
        "Modern Shag",
        "Pompadour",
        "Bro Flow",
        "Medium Waves",
        "Textured Top",
        "Side Part",
        "Taper Fade",
        "Swept Back",
        "Faux Hawk",
        "Beach Waves",
      ],
      long: [
        "Long & Wavy",
        "Man Bun",
        "Shoulder Length",
        "Surfer Style",
        "Samurai Bun",
        "Long Layers",
        "Dreadlocks",
        "Locs",
        "Long Curls",
        "Viking Braids",
        "Half Bun",
        "Mullet Modern",
      ],
    },
    female: {
      short: [
        "Pixie Cut",
        "Bob",
        "Undercut",
        "Shaggy Bob",
        "Blunt Cut",
        "Curly Crop",
        "French Pixie",
        "Asymmetrical Bob",
        "Short Layers",
        "Modern Pixie",
        "Choppy Layers",
        "Textured Crop",
      ],
      medium: [
        "Layered",
        "Balayage",
        "Wolf Cut",
        "Lob",
        "Curtain Bangs",
        "Feathered",
        "Textured Waves",
        "Face-Framing Layers",
        "Shag Cut",
        "Piece-y Layers",
        "Side Swept",
        "Shoulder Length Waves",
      ],
      long: [
        "Wavy",
        "Braided",
        "Straight & Long",
        "Loose Curls",
        "Layered Lengths",
        "Fishtail Braid",
        "Beach Waves",
        "Beachy Blonde",
        "Mermaid Waves",
        "Silk Press",
        "Long Layers",
        "Flowing Curls",
      ],
    },
  };

  const availableHairstyles = hairstyles[gender]?.[hairLength] || [];

  // 🔥 FIX — Ask permission BEFORE rendering webcam
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      stream.getTracks().forEach((t) => t.stop());

      setIsCamera(true);
    } catch (err) {
      alert("Camera access denied or unavailable.");
      console.error(err);
    }
  };

  // Capture photo
  const capture = () => {
    if (!webcamRef.current) return;

    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) {
      alert("Camera not ready. Try again.");
      return;
    }

    setPhoto(screenshot);
    setIsCamera(false);
  };

  // Submit to backend
  const handleSubmit = async () => {
    if (!photo || !selectedStyle)
      return alert("Please upload a photo and select a hairstyle.");

    setLoading(true);

    try {
      const blob = await fetch(photo).then((r) => r.blob());
      const formData = new FormData();
      formData.append("photo", blob, "photo.jpg");
      formData.append("gender", gender);
      formData.append("hairLength", hairLength);
      formData.append("selectedHairstyle", selectedStyle);

      const res = await fetch("https://baclendai-2.onrender.com/api/generate-hairstyle", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "AI generation failed");
        return;
      }

      navigate("/result", { state: { result: data, originalPhoto: photo } });
    } catch (error) {
      alert("Error connecting to AI server.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start px-4 sm:px-6 md:px-0">

        {/* LEFT SIDE */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-primary flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>

          {/* Upload / Camera */}
          {!photo && !isCamera && (
            <div className="space-y-4">
              <button
                onClick={openCamera}
                className="w-full p-6 border-2 border-gray-300 rounded-xl flex flex-col items-center hover:border-accent transition"
              >
                <Camera className="w-8 h-8 mb-2" />
                Take a Photo
              </button>

              <label className="w-full p-6 border-2 border-dashed rounded-xl flex flex-col items-center hover:border-accent cursor-pointer transition">
                <Upload className="w-8 h-8 mb-2" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setPhoto(URL.createObjectURL(e.target.files[0]))
                  }
                />
              </label>
            </div>
          )}

          {/* CAMERA VIEW */}
          {isCamera && (
            <div className="w-full">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                mirrored={true}
                playsInline={true}
                className="rounded-xl shadow-lg w-full"
                videoConstraints={{
                  facingMode: "user",
                  width: 1280,
                  height: 720,
                }}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={capture}
                  className="flex-1 bg-accent text-white rounded-lg py-3"
                >
                  Capture
                </button>
                <button
                  onClick={() => setIsCamera(false)}
                  className="flex-1 border rounded-lg py-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Photo Preview */}
          {photo && (
            <div className="relative mt-4">
              <img
                src={photo}
                alt="preview"
                className="rounded-xl object-cover w-full aspect-square"
              />
              <button
                onClick={() => setPhoto(null)}
                className="absolute top-3 right-3 bg-black/60 p-2 rounded-full text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-600 mb-3 font-semibold">
            Step 2: Choose Hairstyle
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 mb-8 max-h-96 overflow-y-auto pr-2">
            {availableHairstyles.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={`p-3 rounded-lg border font-medium text-sm ${
                  selectedStyle === style
                    ? "bg-accent text-white border-accent shadow-lg scale-105"
                    : "border-gray-300 hover:border-accent hover:shadow"
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          {selectedStyle && (
            <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border">
              <p className="text-sm text-gray-600">Selected Style:</p>
              <p className="text-lg font-bold text-accent">{selectedStyle}</p>
            </div>
          )}

          <button
            disabled={!photo || !selectedStyle || loading}
            onClick={handleSubmit}
            className={`w-full py-4 rounded-xl font-semibold text-white ${
              photo && selectedStyle
                ? "bg-gradient-to-r from-primary to-accent"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {loading ? "Generating..." : "Generate My Style"}
          </button>
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="w-24 h-24 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white mt-8 text-xl font-semibold animate-pulse">
            Transforming your look...
          </p>
        </div>
      )}
    </PageTransition>
  );
}
