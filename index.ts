import express from 'express';
import { deleteImage, upload } from './config/config';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeminiCandidate {
  content?: {
    parts?: { text?: string }[]
  }
}
interface GeminiResponse {
  candidates?: GeminiCandidate[]
}
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/upload', upload.single('image'), (req, res) => {
  try {
    const file = req.file as Express.Multer.File & { location: string };
    
    if (!file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select an image file to upload'
      });
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: file.location,
        filename: (file as any).key || file.filename,
        size: file.size,
        mimetype: file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

app.delete('/delete', async (req,res) => {
  try {

    const {imageUrl} = req.body;

    if(!imageUrl){
      return res.status(404).json({
        message:"Image URL is required"
      })
    }

    const deleteKey = await deleteImage(imageUrl)

    res.status(200).json({
      message:"Image deleted"
    })
    
  } catch (error) {
    return res.status(500).json({
      message:"Failed to delete image"
    })
  }
})

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size must be less than 10MB'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only JPEG, PNG, JPG, and WebP images are allowed'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on our end'
  });
});

app.get('/', (req,res) => {
  res.send("Hello world")
})

app.post('/enhnaceContent', async (req,res) => {
  try {

    const apiKey = process.env.GEMINI_API;

    if(!apiKey){
      return res.status(404).json({
        message:"Gemini API key is not found"
      })
    }

    const {title,description} = req.body;

    if(!title || !description){
      return res.status(400).json({
        message:"Title and description are required"
      })
    }

    const endpoint = new URL(GEMINI_API_ENDPOINT);
      endpoint.searchParams.append('key', apiKey);

    const response = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert startup consultant and professional crowdfunding copywriter. Based on the following project details:
                Title: ${title}
                Description: ${description}

                Your tasks:
                1. Write a highly engaging, persuasive, and professional crowdfunding pitch.
                2. Include the following sections:
                3. Compelling Headline: A short, attention-grabbing title.
                4. Introduction: Start with an emotional hook that resonates with the audience.
                5. The Problem: Clearly describe the pain point or challenge people face.
                6. The Solution: Explain how this project solves that problem in a unique and innovative way.
                7. Impact: Show how this will change lives or create positive impact.
                8. Why Support Us: Explain why backers should believe in this project and what makes it special (unique value proposition).
                9. Call to Action: End with a strong, inspiring message encouraging contributions.
                10. If any currency is included give it in ETH.

                Make the tone passionate, trustworthy, and optimistic.

                Keep the total length between 300-500 words for maximum storytelling impact.

                Use clear, simple language with a mix of emotional appeal and logical reasoning.

                Return only the final crowdfunding pitch in well-formatted paragraphs with headings. Do not include any instructions or extra notes.`
          }]
        }],
      })
    });
    if (!response.ok) {
      console.error('API error:', response.status, response.statusText);
      return res.status(400).json({ isAppropriate: true, error: 'Content moderation service encountered an error. Your content has been accepted.' });
    }

    const data = await response.json();

    const safeData = data as GeminiResponse
    const enhancedPitch = safeData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      message:"Content enhanced successfully",
      data:enhancedPitch
    })

  } catch (error) {
    return res.status(500).json({
      message:"Failed to Enhance the content"
    })
  }
})

app.post('sumarize', async (req,res) => {
  try {

    const apiKey = process.env.GEMINI_API;

    if(!apiKey){
      return res.status(404).json({
        message:"Gemini API key is not found"
      })
    }

    const {content} = req.body;

    if(!content){
      return res.status(400).json({
        message:"Content is required"
      })
    }

    const endpoint = new URL(GEMINI_API_ENDPOINT);
    endpoint.searchParams.append('key', apiKey);

    const response = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('API error:', response.status, response.statusText);
      return res.status(400).json({ isAppropriate: true, error: 'Content moderation service encountered an error. Your content has been accepted.' });
    }

    const data = await response.json();

    const safeData = data as GeminiResponse
    const enhancedPitch = safeData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      message:"Content sumarized successfully",
      data:enhancedPitch
    })
  } catch (error) {
    return res.status(500).json({
      message:"Failed to sumarize the content"
    })
  }
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Upload endpoint: http://localhost:${PORT}/upload`);
});

