const express = require('express');
const HealthVideo = require('../HealthVideo');
const { auth } = require('../middleware/auth');
const { fetchYouTubeVideos } = require('../utils/youtube');

const router = express.Router();

// GET /api/health/videos
router.get('/videos', auth, async (req, res) => {
  try {
    const { 
      language = 'ta', 
      category, 
      page = 1, 
      limit = 10,
      refresh = false 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = { language, isActive: true };
    if (category) {
      query.category = category;
    }

    // Check if we need to refresh from YouTube API
    if (refresh === 'true') {
      try {
        await fetchYouTubeVideos(language, category);
      } catch (fetchError) {
        console.error('YouTube fetch error:', fetchError);
        // Continue with existing data if fetch fails
      }
    }

    // Get videos from database
    const videos = await HealthVideo.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('videoId title titleTranslations description descriptionTranslations category categoryTranslations thumbnailUrl duration viewCount tags ageGroup publishedAt');

    const total = await HealthVideo.countDocuments(query);

    // Localize video data
    const localizedVideos = videos.map(video => ({
      ...video.toObject(),
      displayTitle: video.titleTranslations?.[language] || video.title,
      displayDescription: video.descriptionTranslations?.[language] || video.description,
      displayCategory: video.categoryTranslations?.[language] || video.category,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
      embedUrl: `https://www.youtube.com/embed/${video.videoId}`
    }));

    res.json({
      videos: localizedVideos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get health videos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/health/videos/categories
router.get('/videos/categories', auth, async (req, res) => {
  try {
    const { language = 'ta' } = req.query;

    const categories = await HealthVideo.distinct('category', { 
      language, 
      isActive: true 
    });

    // Get category translations
    const categoryData = await HealthVideo.aggregate([
      { $match: { language, isActive: true } },
      { 
        $group: { 
          _id: '$category',
          categoryTranslations: { $first: '$categoryTranslations' },
          count: { $sum: 1 }
        }
      }
    ]);

    const localizedCategories = categoryData.map(cat => ({
      category: cat._id,
      displayName: cat.categoryTranslations?.[language] || cat._id,
      count: cat.count
    }));

    res.json({ categories: localizedCategories });
  } catch (error) {
    console.error('Get video categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/health/videos/:videoId
router.get('/videos/:videoId', auth, async (req, res) => {
  try {
    const { language = 'ta' } = req.query;
    
    const video = await HealthVideo.findOne({ 
      videoId: req.params.videoId,
      isActive: true 
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Increment view count
    await HealthVideo.findByIdAndUpdate(video._id, { 
      $inc: { viewCount: 1 } 
    });

    // Localize video data
    const localizedVideo = {
      ...video.toObject(),
      displayTitle: video.titleTranslations?.[language] || video.title,
      displayDescription: video.descriptionTranslations?.[language] || video.description,
      displayCategory: video.categoryTranslations?.[language] || video.category,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
      embedUrl: `https://www.youtube.com/embed/${video.videoId}`
    };

    res.json({ video: localizedVideo });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/health/videos/search
router.get('/videos/search', auth, async (req, res) => {
  try {
    const { 
      q, 
      language = 'ta', 
      category,
      page = 1, 
      limit = 10 
    } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    let query = {
      language,
      isActive: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };

    if (category) {
      query.category = category;
    }

    const videos = await HealthVideo.find(query)
      .sort({ viewCount: -1, publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('videoId title titleTranslations description descriptionTranslations category categoryTranslations thumbnailUrl duration viewCount tags ageGroup publishedAt');

    const total = await HealthVideo.countDocuments(query);

    // Localize video data
    const localizedVideos = videos.map(video => ({
      ...video.toObject(),
      displayTitle: video.titleTranslations?.[language] || video.title,
      displayDescription: video.descriptionTranslations?.[language] || video.description,
      displayCategory: video.categoryTranslations?.[language] || video.category,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
      embedUrl: `https://www.youtube.com/embed/${video.videoId}`
    }));

    res.json({
      videos: localizedVideos,
      searchQuery: q,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search videos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/health/videos/trending
router.get('/videos/trending', auth, async (req, res) => {
  try {
    const { language = 'ta', limit = 10 } = req.query;

    const videos = await HealthVideo.find({ 
      language, 
      isActive: true 
    })
    .sort({ viewCount: -1, publishedAt: -1 })
    .limit(parseInt(limit))
    .select('videoId title titleTranslations thumbnailUrl viewCount category categoryTranslations duration publishedAt');

    // Localize video data
    const localizedVideos = videos.map(video => ({
      ...video.toObject(),
      displayTitle: video.titleTranslations?.[language] || video.title,
      displayCategory: video.categoryTranslations?.[language] || video.category,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
      embedUrl: `https://www.youtube.com/embed/${video.videoId}`
    }));

    res.json({ videos: localizedVideos });
  } catch (error) {
    console.error('Get trending videos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;