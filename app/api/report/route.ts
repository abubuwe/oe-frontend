import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Report API endpoint for tracking ad impressions and clicks
 * Implements idempotency to prevent duplicate records
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { type, impressionId, sessionId = null } = body;
    
    // Validate required parameters
    if (!type) {
      return NextResponse.json({ error: 'Missing required parameter: type' }, { status: 400 });
    }
    
    if (!impressionId) {
      return NextResponse.json({ error: 'Missing required parameter: impressionId' }, { status: 400 });
    }
  
    
    // Process based on the type of report
    if (type === 'view') {
      // First verify the impression exists
      const impression = await prisma.impression.findUnique({
        where: { id: impressionId }
      });
      
      if (!impression) {
        return NextResponse.json({ error: 'Invalid impressionId' }, { status: 400 });
      }
      
      // Update the impression record with session ID if provided
      // Note: We no longer increment views as each impression record represents a single view
      if (sessionId) {
        await prisma.impression.update({
          where: { id: impressionId },
          data: { sessionId }
        });
      }
      
      // Update daily metrics
      await updateAdMetrics(impression.adId);
      
    } else if (type === 'click') {
      // First verify the impression exists
      const impression = await prisma.impression.findUnique({
        where: { id: impressionId }
      });
      
      if (!impression) {
        return NextResponse.json({ error: 'Invalid impressionId' }, { status: 400 });
      }
      
      // Update the impression to mark it as clicked
      await prisma.impression.update({
        where: { id: impressionId },
        data: { clicked: true }
      });
      
      // Update daily metrics
      await updateAdMetrics(impression.adId);
      
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
    
    return NextResponse.json({ ok: true, impressionId });
    
  } catch (error) {
    console.error('Error in report API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * Helper function to update ad metrics for the current day
 */
async function updateAdMetrics(adId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get current metrics for today
  const impressionsCount = await prisma.impression.count({
    where: {
      adId,
      timestamp: {
        gte: today
      }
    }
  });
  
  // Count impressions that have been clicked
  const clicksCount = await prisma.impression.count({
    where: {
      adId,
      clicked: true,
      timestamp: {
        gte: today
      }
    }
  });
  
  // Calculate CTR
  const ctr = impressionsCount > 0 ? clicksCount / impressionsCount : 0;
  
  // Update or create metrics record
  await prisma.adMetrics.upsert({
    where: {
      adId_date: {
        adId,
        date: today
      }
    },
    update: {
      impressions: impressionsCount,
      clicks: clicksCount,
      ctr
    },
    create: {
      adId,
      date: today,
      impressions: impressionsCount,
      clicks: clicksCount,
      ctr
    }
  });
}