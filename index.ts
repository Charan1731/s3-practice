import express from 'express';
import { upload } from './config/config';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Upload endpoint: http://localhost:${PORT}/upload`);
});

