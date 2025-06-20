import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define keywords for each category to match against questions
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  cardiology: ['heart', 'cardiac', 'cardiovascular', 'chest pain', 'blood pressure', 'cholesterol', 'artery', 'stroke'],
  neurology: ['brain', 'nerve', 'neurological', 'headache', 'migraine', 'seizure', 'memory', 'alzheimer', 'parkinson'],
  oncology: ['cancer', 'tumor', 'oncology', 'chemotherapy', 'radiation', 'carcinoma', 'lymphoma', 'leukemia'],
  pediatrics: ['child', 'children', 'kid', 'baby', 'infant', 'pediatric', 'vaccination', 'growth', 'development'],
};

// Weight factors for ad selection algorithm
const WEIGHTS = {
  KEYWORD_RELEVANCE: 0.5,  // How relevant the ad is to the question
  PERFORMANCE: 0.3,        // Click-through rate performance
  FRESHNESS: 0.1,          // How recently the ad was shown
  BUDGET: 0.1              // Remaining budget
};

/**
 * Match a question to the most relevant category based on keyword matching
 */
async function matchQuestionToCategory(question: string): Promise<string | null> {
  const lowerQuestion = question.toLowerCase();
  
  // Calculate scores for each category based on keyword matches
  const scores: Record<string, number> = {};
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        scores[category] += 1;
      }
    }
  }
  
  // Find the category with the highest score
  let bestMatch: string | null = null;
  let highestScore = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestMatch = category;
    }
  }
  
  // Return the best matching category, or null if no matches
  return highestScore > 0 ? bestMatch : null;
}

/**
 * Calculate a weighted score for ad selection based on multiple factors
 */
async function calculateAdScore(ad: any, categoryRelevance: number): Promise<number> {
  // Get ad performance metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Get metrics for this ad over the last 30 days
  const metrics = await prisma.adMetrics.findMany({
    where: {
      adId: ad.id,
      date: {
        gte: thirtyDaysAgo
      }
    }
  });
  
  // Calculate CTR (Click-Through Rate)
  let totalImpressions = 0;
  let totalClicks = 0;
  
  metrics.forEach(metric => {
    totalImpressions += metric.impressions;
    totalClicks += metric.clicks;
  });
  
  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  
  // Calculate freshness score (when was this ad last shown)
  const lastImpression = await prisma.impression.findFirst({
    where: { adId: ad.id },
    orderBy: { timestamp: 'desc' }
  });
  
  let freshnessScore = 1.0; // Default high if never shown
  if (lastImpression) {
    const hoursSinceLastShown = (Date.now() - lastImpression.timestamp.getTime()) / (1000 * 60 * 60);
    // Higher score for ads not shown recently (max 1.0 for ads not shown in 24+ hours)
    freshnessScore = Math.min(hoursSinceLastShown / 24, 1.0);
  }
  
  // Budget score - higher for ads with more remaining budget
  let budgetScore = 1.0; // Default to full score
  if (ad.budget && ad.spendCap) {
    // Calculate remaining budget percentage
    const spent = await calculateAdSpend(ad.id);
    const remainingBudget = Math.max(0, Number(ad.budget) - spent);
    budgetScore = remainingBudget / Number(ad.budget);
  }
  
  // Calculate final weighted score
  const score = 
    (categoryRelevance * WEIGHTS.KEYWORD_RELEVANCE) +
    (ctr * WEIGHTS.PERFORMANCE) +
    (freshnessScore * WEIGHTS.FRESHNESS) +
    (budgetScore * WEIGHTS.BUDGET);
  
  return score;
}

/**
 * Calculate the total spend for an ad
 */
async function calculateAdSpend(adId: string): Promise<number> {
  const metrics = await prisma.adMetrics.findMany({
    where: { adId }
  });
  
  return metrics.reduce((total, metric) => total + Number(metric.spend), 0);
}

export async function POST(request: Request) {
  try {
    let question = '';
    let sessionId = null;
    
    try {
      const body = await request.json();
      question = body.question || '';
      sessionId = body.sessionId || null;
    } catch (error) {
      console.error('Error parsing request body:', error);
      // Continue with empty question if parsing fails
    }
    
    // If no question provided, return a random active ad
    if (!question) {
      const activeAds = await prisma.ad.findMany({
        where: { 
          status: 'active',
          // Only include ads that are within their campaign date range
          AND: [
            {
                OR: [
                    { startDate: null },
                    { startDate: { lte: new Date() } }
                ]
            },
            {
                OR: [
                    { endDate: null },
                    { endDate: { gte: new Date() } }
                ]
            }
          ],
        },
        include: { company: true, category: true },
      });
      
      
      if (activeAds.length === 0) {
        return NextResponse.json({ error: 'No active ads available' }, { status: 404 });
      }
      
      // Select a random ad from active ads
      const randomAd = activeAds[Math.floor(Math.random() * activeAds.length)];
      
      // Create an impression record
      const impression = await prisma.impression.create({
        data: { 
          adId: randomAd.id, 
          userId: null,
          question: '',
          sessionId: sessionId || undefined,
        },
      });
      
      return NextResponse.json({
        id: randomAd.id,
        imageUrl: randomAd.imageUrl,
        headline: randomAd.headline,
        ctaText: randomAd.ctaText,
        ctaUrl: randomAd.ctaUrl,
        category: randomAd.category.name,
        company: randomAd.company.name,
        impressionId: impression.id
      });
    }
    
    // Try to match the question to a category
    const matchedCategory = await matchQuestionToCategory(question);
    
    // Get all active ads
    const activeAds = await prisma.ad.findMany({
      where: { 
      status: 'active',
      // Only include ads that are within their campaign date range
      AND: [
          {
              OR: [
                  { startDate: null },
                  { startDate: { lte: new Date() } }
              ]
          },
          {
              OR: [
                  { endDate: null },
                  { endDate: { gte: new Date() } }
              ]
          }
      ],
      // If we have a matched category, filter by it
      ...(matchedCategory ? {
          category: {
          slug: matchedCategory
          }
      } : {})
      },
      include: { company: true, category: true },
    });
    
    if (activeAds.length === 0) {
      // If no ads in the matched category, get any active ad
      const fallbackAds = await prisma.ad.findMany({
        where: { 
          status: 'active',
          AND: [
            {
                OR: [
                    { startDate: null },
                    { startDate: { lte: new Date() } }
                ]
            },
            {
                OR: [
                    { endDate: null },
                    { endDate: { gte: new Date() } }
                ]
            }
          ],
        },
        include: { company: true, category: true },
        take: 5 // Limit to 5 for performance
      });
      
      if (fallbackAds.length === 0) {
        return NextResponse.json({ error: 'No fallback ads available' }, { status: 404 });
      }
      
      // Select a random fallback ad
      const randomAd = fallbackAds[Math.floor(Math.random() * fallbackAds.length)];
      
      // Create an impression record
      const impression = await prisma.impression.create({
        data: { 
          adId: randomAd.id, 
          userId: null,
          question,
          sessionId: sessionId || undefined,
        },
      });

      // insert artificial 2s wait
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return NextResponse.json({
        id: randomAd.id,
        imageUrl: randomAd.imageUrl,
        headline: randomAd.headline,
        ctaText: randomAd.ctaText,
        ctaUrl: randomAd.ctaUrl,
        category: randomAd.category.name,
        company: randomAd.company.name,
        impressionId: impression.id
      });
    }
    
    // Calculate scores for each ad
    const adScores = await Promise.all(
      activeAds.map(async (ad) => {
        // Calculate category relevance score (0-1)
        const categoryRelevance = ad.category.slug === matchedCategory ? 1.0 : 0.0;
        
        // Get weighted score
        const score = await calculateAdScore(ad, categoryRelevance);
        
        return { ad, score };
      })
    );
    
    // Sort by score (highest first)
    adScores.sort((a, b) => b.score - a.score);
    
    // Select the highest scoring ad
    const selectedAd = adScores[0].ad;
    
    // Create an impression record
    const impression = await prisma.impression.create({
      data: { 
        adId: selectedAd.id, 
        userId: null,
        question,
        sessionId: sessionId || undefined,
      },
    });
    
    return NextResponse.json({
      id: selectedAd.id,
      imageUrl: selectedAd.imageUrl,
      headline: selectedAd.headline,
      ctaText: selectedAd.ctaText,
      ctaUrl: selectedAd.ctaUrl,
      category: selectedAd.category.name,
      company: selectedAd.company.name,
      impressionId: impression.id
    });
    
  } catch (error) {
    console.error('Error in ad selection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // This endpoint accepts unauthenticated requests
    const { searchParams } = new URL(request.url);
    const question = searchParams.get('question') || '';
    const sessionId = searchParams.get('sessionId') || null;

    // If no question provided, return a random active ad
    if (!question) {
      const activeAds = await prisma.ad.findMany({
        where: { 
          status: 'active',
          // Only include ads that are within their campaign date range
          AND: [
            {
                OR: [
                    { startDate: null },
                    { startDate: { lte: new Date() } }
                ]
            },
            {
                OR: [
                    { endDate: null },
                    { endDate: { gte: new Date() } }
                ]
            }
          ],
        },
        include: { company: true, category: true },
      });
      
      if (activeAds.length === 0) {
        return NextResponse.json({ error: 'No active ads available' }, { status: 404 });
      }
      
      // Select a random ad from active ads
      const randomAd = activeAds[Math.floor(Math.random() * activeAds.length)];
      
      // Create an impression record
      const impression = await prisma.impression.create({
        data: { 
          adId: randomAd.id, 
          userId: null,
          question: '',
          sessionId: sessionId || undefined,
        },
      });
      
      return NextResponse.json({
        id: randomAd.id,
        imageUrl: randomAd.imageUrl,
        headline: randomAd.headline,
        ctaText: randomAd.ctaText,
        ctaUrl: randomAd.ctaUrl,
        category: randomAd.category.name,
        company: randomAd.company.name,
        impressionId: impression.id
      });
    }
    
    // Try to match the question to a category
    const matchedCategory = await matchQuestionToCategory(question);
    
    // Get all active ads
    const activeAds = await prisma.ad.findMany({
      where: { 
        status: 'active',
        // Only include ads that are within their campaign date range
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: new Date() } }
            ]
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } }
            ]
          }
        ],
        // If we have a matched category, filter by it
        ...(matchedCategory ? {
          category: {
            slug: matchedCategory
          }
        } : {})
      },
      include: { company: true, category: true },
    });
    
    if (activeAds.length === 0) {
      // If no ads in the matched category, get any active ad
      const fallbackAds = await prisma.ad.findMany({
        where: { 
          status: 'active',
          AND: [
            {
                OR: [
                    { startDate: null },
                    { startDate: { lte: new Date() } }
                ]
            },
            {
                OR: [
                    { endDate: null },
                    { endDate: { gte: new Date() } }
                ]
            }
        ],
        },
        include: { company: true, category: true },
        take: 5 // Limit to 5 for performance
      });
      
      if (fallbackAds.length === 0) {
        return NextResponse.json({ error: 'No active ads available' }, { status: 404 });
      }
      
      // Select a random fallback ad
      const randomAd = fallbackAds[Math.floor(Math.random() * fallbackAds.length)];
      
      // Create an impression record
      const impression = await prisma.impression.create({
        data: { 
          adId: randomAd.id, 
          userId: null,
          question,
          sessionId: sessionId || undefined,
        },
      });
      
      return NextResponse.json({
        id: randomAd.id,
        imageUrl: randomAd.imageUrl,
        headline: randomAd.headline,
        ctaText: randomAd.ctaText,
        ctaUrl: randomAd.ctaUrl,
        category: randomAd.category.name,
        company: randomAd.company.name,
        impressionId: impression.id
      });
    }
    
    // Calculate scores for each ad
    const adScores = await Promise.all(
      activeAds.map(async (ad) => {
        // Calculate category relevance score (0-1)
        const categoryRelevance = ad.category.slug === matchedCategory ? 1.0 : 0.0;
        
        // Get weighted score
        const score = await calculateAdScore(ad, categoryRelevance);
        
        return { ad, score };
      })
    );
    
    // Sort by score (highest first)
    adScores.sort((a, b) => b.score - a.score);
    
    // Select the highest scoring ad
    const selectedAd = adScores[0].ad;
    
    // Create an impression record
    const impression = await prisma.impression.create({
      data: { 
        adId: selectedAd.id, 
        userId: null,
        question,
        sessionId: sessionId || undefined,
      },
    });
    
    return NextResponse.json({
      id: selectedAd.id,
      imageUrl: selectedAd.imageUrl,
      headline: selectedAd.headline,
      ctaText: selectedAd.ctaText,
      ctaUrl: selectedAd.ctaUrl,
      category: selectedAd.category.name,
      company: selectedAd.company.name,
      impressionId: impression.id
    });
    
  } catch (error) {
    console.error('Error in ad selection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}