const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Konfigurasi Multer untuk upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Fungsi Veo 3
async function veo3(prompt, { image = null } = {}) {
  try {
    if (!prompt) throw new Error('Prompt is required');
    
    const { data: cf } = await axios.post('https://cf.nekolabs.my.id/action', {
      mode: 'turnstile-min',
      siteKey: '0x4AAAAAAANuFg_hYO9YJZqo',
      url: 'https://aivideogenerator.me/features/g-ai-video-generator'
    });
    
    const num = Math.floor(Math.random() * 100) + 1700;
    const uid = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
    const { data: task } = await axios.post('https://aiarticle.erweima.ai/api/v1/secondary-page/api/create', {
      prompt: prompt,
      imgUrls: image ? [image] : [],
      quality: '720p',
      duration: 8,
      autoSoundFlag: false,
      soundPrompt: '',
      autoSpeechFlag: false,
      speechPrompt: '',
      speakerId: 'Auto',
      aspectRatio: '16:9',
      secondaryPageId: num,
      channel: 'VEO3',
      source: 'aivideogenerator.me',
      type: 'features',
      watermarkFlag: true,
      privateFlag: true,
      isTemp: true,
      vipFlag: true,
      model: 'veo-3-fast'
    }, {
      headers: {
        uniqueid: uid,
        verify: cf.token
      }
    });
    
    while (true) {
      const { data } = await axios.get(`https://aiarticle.erweima.ai/api/v1/secondary-page/api/${task.data.recordId}`, {
        headers: {
          uniqueid: uid,
          verify: cf.token
        }
      });
      
      if (data.data.state === 'fail') return JSON.parse(data.data.completeData);
      if (data.data.state === 'success') return JSON.parse(data.data.completeData);
      await new Promise(res => setTimeout(res, 1000));
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

// Endpoint untuk generate video
app.post('/generate', upload.single('image'), async (req, res) => {
  try {
    const { prompt } = req.body;
    let imageUrl = null;
    
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }
    
    console.log('Generating video with prompt:', prompt);
    console.log('Using image:', imageUrl || 'No image provided');
    
    const result = await veo3(prompt, { image: imageUrl });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Buat folder uploads jika belum ada
if (!fs.existsSync('public/uploads')) {
  fs.mkdirSync('public/uploads', { recursive: true });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
