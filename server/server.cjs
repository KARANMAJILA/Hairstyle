const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
const generatedDir = path.join(__dirname, 'generated');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  },
});

let client;
try {
  client = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
  });
  console.log('✅ Google GenAI client initialized');
} catch (error) {
  console.error('❌ Failed to initialize Google GenAI:', error.message);
  process.exit(1);
}

//some hairstyle object 
const hairstyles = {
  male: {
    short: [
      'Crew Cut',
      'Buzz Fade',
      'Caesar',
      'French Crop',
      'Ivy League',
      'Flat Top',
    ],
    medium: [
      'Quiff',
      'Slicked Back',
      'Modern Shag',
      'Pompadour',
      'Bro Flow',
      'Medium Waves',
    ],
    long: [
      'Long & Wavy',
      'Man Bun',
      'Shoulder Length',
      'Surfer Style',
      'Samurai Bun',
      'Long Layers',
    ],
  },
  female: {
    short: [
      'Pixie Cut',
      'Bob',
      'Undercut',
      'Shaggy Bob',
      'Blunt Cut',
      'Curly Crop',
    ],
    medium: [
      'Layered',
      'Balayage',
      'Wolf Cut',
      'Lob',
      'Curtain Bangs',
      'Feathered',
    ],
    long: [
      'Wavy',
      'Braided',
      'Straight & Long',
      'Loose Curls',
      'Layered Lengths',
      'Fishtail Braid',
    ],
  },
};

const getImageBase64 = async (imagePath) => {
  try {
    const imageBuffer = await fs.promises.readFile(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('Error reading image:', error);
    throw error;
  }
};

// Generate Hairstyle Image using Gemini 2.5 Flash Image
const generateHairstyleImage = async (
  hairstyle,
  hairLength,
  imageBase64
) => {
  try {
    console.log('🎨 Generating hairstyle image...');

    const prompt = `You are a professional hairstylist AI. Apply a new hairstyle transformation.

CRITICAL INSTRUCTIONS:
1. ONLY modify the person's HAIR - Nothing else
2. Keep EVERYTHING else EXACTLY the same:
   - Face (same features, skin tone, expression)
   - Eyes, nose, mouth, facial structure
   - Clothing and outfit (DO NOT change)
   - Background (DO NOT change)
   - Body position and pose
   - Shoulders and neck
3. Apply ONLY the ${hairstyle} hairstyle to the head
4. Make the hair transformation natural and realistic
5. Ensure the hairstyle matches the ${hairLength} length reference
6. Professional quality salon photo
7. Maintain perfect consistency with everything else in the image

The hairstyle to apply: ${hairstyle}
Hair length reference: ${hairLength}

Generate a realistic hairstyle transformation where ONLY the hair changes.
Keep person's identity, features, clothing, and background completely unchanged.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    console.log('📦 Response received');

    // Extract image from response
    const parts = response.candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        console.log('✅ Image generated successfully');
        return part.inlineData.data;
      }
    }

    throw new Error('No image data in response');
  } catch (error) {
    console.error('❌ Image generation error:', error.message);
    throw error;
  }
};

const analyzeAndRecommendHairstyles = async (
  hairLength,
  selectedHairstyle,
  imageBase64
) => {
  try {
    console.log('🧠 Analyzing face features and detecting gender...');

    const genderDetectionResponse = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: 'Analyze this photo and identify if the person appears to be male or female. Just respond with one word: "male" or "female".' },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const detectedGender = genderDetectionResponse.candidates[0].content.parts[0].text.toLowerCase().trim();
    const gender = detectedGender.includes('female') ? 'female' : 'male';
    console.log(` Auto-detected gender: ${gender}`);

    const availableStyles = hairstyles[gender][hairLength];

    const prompt = `You are a professional hairstylist AI analyzing face features for hairstyle recommendations.

Analyze this person's face (face shape, bone structure, facial features, hair type, skin tone) and recommend which hairstyles would suit them BEST and which would NOT suit them.

Available hairstyles for ${gender} with ${hairLength} hair: ${availableStyles.join(', ')}

For the hairstyle "${selectedHairstyle}" that they selected:
1. Does it suit them? (Yes/No)
2. Why or why not? (1-2 sentences max, considering face shape and features)
3. Which 2-3 hairstyles from the list would suit them BEST? (just the names)
4. Any hairstyles that would NOT suit them? (just names, optional)

Keep response concise and professional. Consider:
- Face shape (round, oval, square, heart, etc.)
- Facial features and proportions
- Hair texture and type
- Overall aesthetic balance

Format your response as:
Selected Style Verdict: [Yes/No]
Reason: [reason]
Best Suited: [style1, style2, style3]
Not Recommended: [style1, style2] (if any)`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const recommendation = response.candidates[0].content.parts[0].text;
    console.log('✅ Analysis complete');
    
    return {
      detectedGender: gender,
      recommendation: recommendation
    };
  } catch (error) {
    console.error('❌ Recommendation error:', error.message);
    return {
      detectedGender: 'unknown',
      recommendation: `This ${selectedHairstyle} style can look great on you! The AI couldn't fully analyze features, but you've made a great choice!`
    };
  }
};

app.post('/api/generate-hairstyle', upload.single('photo'), async (req, res) => {
  let uploadedFilePath = null;

  try {
    const { gender, hairLength, selectedHairstyle } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Photo is required',
      });
    }

    if (!hairLength || !selectedHairstyle) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: hairLength, selectedHairstyle',
      });
    }

    uploadedFilePath = req.file.path;
    console.log('\n📸 New request received');
    console.log(`📁 File: ${req.file.filename}`);

    const imageBase64 = await getImageBase64(uploadedFilePath);

    console.log(' Processing with AI...');
    const { detectedGender, recommendation } = await analyzeAndRecommendHairstyles(
      hairLength,
      selectedHairstyle,
      imageBase64
    );

    console.log(`✅ Auto-detected: ${detectedGender}`);

    const generatedImageBase64 = await generateHairstyleImage(
      selectedHairstyle,
      hairLength,
      imageBase64
    );

    const filename = `hairstyle-${Date.now()}.jpg`;
    const generatedImagePath = path.join(generatedDir, filename);
    await fs.promises.writeFile(
      generatedImagePath,
      Buffer.from(generatedImageBase64, 'base64')
    );
    console.log(`💾 Image saved: ${filename}`);

    try {
      fs.unlinkSync(uploadedFilePath);
    } catch (error) {
      console.warn('Warning: Could not delete uploaded file');
    }

    console.log('✅ Request completed successfully\n');
    res.json({
      success: true,
      hairstyle: selectedHairstyle,
      hairLength: hairLength,
      detectedGender: detectedGender,
      suggestion: recommendation,
      generatedImage: `data:image/jpeg;base64,${generatedImageBase64}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Fatal error:', error.message);

    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (e) {
        console.warn('Could not clean up file');
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate hairstyle',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    api: 'Gemini 2.5 Flash Image',
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Server error',
    message: err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'Endpoint does not exist',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('🚀 Hairstyle API Server Started on port ' + PORT);
});