const axios = require('axios');
const HealthVideo = require('../HealthVideo');

// YouTube Data API configuration
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/data/v3';

// Health-related search terms by language
const HEALTH_SEARCH_TERMS = {
  ta: [
    'தமிழ் மருத்துவம்', 'சித்த மருத்துவம்', 'ஆயுர்வேதம்', 'உணவு மருத்துவம்',
    'யோகா தமிழ்', 'உடற்பயிற்சி தமிழ்', 'மன நலம் தமிழ்', 'கர்ப்பகால பராமரிப்பு',
    'குழந்தை பராமரிப்பு தமிழ்', 'முதியோர் பராமரிப்பு', 'நீரிழிவு தமிழ்',
    'இரத்த அழுத்தம் தமிழ்', 'இதய நோய் தமிழ்'
  ],
  en: [
    'health tips', 'nutrition guide', 'exercise routine', 'mental health',
    'yoga for beginners', 'home remedies', 'disease prevention',
    'maternal health', 'child care', 'elderly care', 'diabetes management',
    'blood pressure control', 'heart health'
  ]
};

// Category mapping
const CATEGORY_MAPPING = {
  'nutrition': ['nutrition', 'diet', 'food', 'உணவு', 'சத்துணவு'],
  'exercise': ['exercise', 'workout', 'yoga', 'fitness', 'உடற்பயிற்சி', 'யோகா'],
  'mental-health': ['mental health', 'stress', 'anxiety', 'மன நலம்', 'மன அழுத்தம்'],
  'disease-prevention': ['prevention', 'immunity', 'நோய் தடுப்பு', 'நோய் எதிர்ப்பு'],
  'maternal-health': ['pregnancy', 'maternal', 'கர்ப்பம்', 'தாய்மை'],
  'child-health': ['child', 'baby', 'pediatric', 'குழந்தை', 'சிசு'],
  'elderly-care': ['elderly', 'senior', 'முதியோர்', 'வயதானவர்'],
  'general': ['health', 'medical', 'மருத்துவம்', 'சுகாதாரம்']
};

// Fetch videos from YouTube API
const fetchYouTubeVideos = async (language = 'ta', category = null) => {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      console.warn('YouTube API key not configured');
      return [];
    }

    const searchTerms = category 
      ? CATEGORY_MAPPING[category] || HEALTH_SEARCH_TERMS[language]
      : HEALTH_SEARCH_TERMS[language];

    const videos = [];

    for (const term of searchTerms.slice(0, 3)) { // Limit API calls
      try {
        // Search for videos
        const searchResponse = await axios.get(`${YOUTUBE_API_URL}/search`, {
          params: {
            key: process.env.YOUTUBE_API_KEY,
            q: term,
            part: 'snippet',
            type: 'video',
            maxResults: 10,
            order: 'relevance',
            publishedAfter: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // Last year
            regionCode: 'IN',
            relevanceLanguage: language === 'ta' ? 'ta' : 'en'
          }
        });

        const videoIds = searchResponse.data.items.map(item => item.id.videoId);
        
        if (videoIds.length === 0) continue;

        // Get video details
        const detailsResponse = await axios.get(`${YOUTUBE_API_URL}/videos`, {
          params: {
            key: process.env.YOUTUBE_API_KEY,
            id: videoIds.join(','),
            part: 'snippet,contentDetails,statistics'
          }
        });

        for (const video of detailsResponse.data.items) {
          const videoCategory = detectCategory(video.snippet.title + ' ' + video.snippet.description, language);
          
          const videoData = {
            videoId: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            category: videoCategory,
            language,
            duration: video.contentDetails.duration,
            thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
            publishedAt: new Date(video.snippet.publishedAt),
            viewCount: parseInt(video.statistics.viewCount) || 0,
            tags: video.snippet.tags || [],
            ageGroup: detectAgeGroup(video.snippet.title + ' ' + video.snippet.description)
          };

          // Add translations if needed
          if (language === 'ta') {
            videoData.titleTranslations = { ta: video.snippet.title };
            videoData.descriptionTranslations = { ta: video.snippet.description };
            videoData.categoryTranslations = { ta: getCategoryTranslation(videoCategory, 'ta') };
          } else {
            videoData.titleTranslations = { en: video.snippet.title };
            videoData.descriptionTranslations = { en: video.snippet.description };
            videoData.categoryTranslations = { en: videoCategory };
          }

          videos.push(videoData);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (termError) {
        console.error(`Error fetching videos for term "${term}":`, termError.message);
        continue;
      }
    }

    // Save to database
    for (const videoData of videos) {
      try {
        await HealthVideo.findOneAndUpdate(
          { videoId: videoData.videoId },
          videoData,
          { upsert: true, new: true }
        );
      } catch (saveError) {
        console.error('Error saving video:', saveError.message);
      }
    }

    console.log(`✅ Fetched ${videos.length} videos for language: ${language}`);
    return videos;
  } catch (error) {
    console.error('YouTube fetch error:', error.message);
    throw error;
  }
};

// Detect video category based on content
const detectCategory = (content, language) => {
  const lowerContent = content.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_MAPPING)) {
    if (keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()))) {
      return category;
    }
  }
  
  return 'general';
};

// Detect age group based on content
const detectAgeGroup = (content) => {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('child') || lowerContent.includes('baby') || 
      lowerContent.includes('குழந்தை') || lowerContent.includes('சிசு')) {
    return 'children';
  }
  
  if (lowerContent.includes('elderly') || lowerContent.includes('senior') || 
      lowerContent.includes('முதியோர்')) {
    return 'elderly';
  }
  
  return 'adults';
};

// Get category translation
const getCategoryTranslation = (category, language) => {
  const translations = {
    'nutrition': { ta: 'சத்துணவு', en: 'Nutrition' },
    'exercise': { ta: 'உடற்பயிற்சி', en: 'Exercise' },
    'mental-health': { ta: 'மன நலம்', en: 'Mental Health' },
    'disease-prevention': { ta: 'நோய் தடுப்பு', en: 'Disease Prevention' },
    'maternal-health': { ta: 'தாய்மை நலம்', en: 'Maternal Health' },
    'child-health': { ta: 'குழந்தை நலம்', en: 'Child Health' },
    'elderly-care': { ta: 'முதியோர் பராமரிப்பு', en: 'Elderly Care' },
    'general': { ta: 'பொது மருத்துவம்', en: 'General Health' }
  };
  
  return translations[category]?.[language] || category;
};

// Refresh video database
const refreshVideoDatabase = async () => {
  try {
    console.log('🔄 Refreshing video database...');
    
    // Fetch for both languages
    await fetchYouTubeVideos('ta');
    await fetchYouTubeVideos('en');
    
    // Clean up old videos (older than 6 months)
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    await HealthVideo.deleteMany({
      publishedAt: { $lt: sixMonthsAgo },
      viewCount: { $lt: 100 } // Keep popular old videos
    });
    
    console.log('✅ Video database refreshed successfully');
  } catch (error) {
    console.error('❌ Video database refresh failed:', error.message);
  }
};

module.exports = {
  fetchYouTubeVideos,
  refreshVideoDatabase
};