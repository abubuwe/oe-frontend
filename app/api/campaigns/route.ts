import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

// GET /api/campaigns - Get campaigns for the current user's company
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Check if user has access to this company
    if (session.user.role !== 'super' && session.user.companyId !== companyId) {
      return NextResponse.json({ error: 'Unauthorized access to company data' }, { status: 403 });
    }

    // Get all ads (campaigns) for the company with their categories and metrics
    const campaigns = await prisma.ad.findMany({
      where: {
        companyId: companyId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        metrics: {
          orderBy: {
            date: 'desc',
          },
          take: 30, // Last 30 days of metrics
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Calculate aggregated metrics for each campaign
    const campaignsWithMetrics = campaigns.map(campaign => {
      const totalImpressions = campaign.metrics.reduce((sum, metric) => sum + metric.impressions, 0);
      const totalClicks = campaign.metrics.reduce((sum, metric) => sum + metric.clicks, 0);
      const totalSpend = campaign.metrics.reduce((sum, metric) => sum + Number(metric.spend), 0);

      return {
        ...campaign,
        metrics: {
          impressions: totalImpressions,
          clicks: totalClicks,
          spend: totalSpend,
        },
      };
    });

    return NextResponse.json(campaignsWithMetrics);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      headline, ctaText, ctaUrl, imageUrl, status, 
      budget, spendCap, startDate, endDate, categoryId, companyId 
    } = body;

    // Validate required fields
    if (!headline || !ctaText || !ctaUrl || !imageUrl || !categoryId || !companyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user has access to this company
    if (session.user.role !== 'super' && session.user.companyId !== companyId) {
      return NextResponse.json({ error: 'Unauthorized access to company data' }, { status: 403 });
    }

    // Check if category belongs to the company
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { companyId: true },
    });

    if (!category || category.companyId !== companyId) {
      return NextResponse.json({ error: 'Category does not belong to the company' }, { status: 400 });
    }

    // Create the new campaign
    const newCampaign = await prisma.ad.create({
      data: {
        headline,
        ctaText,
        ctaUrl,
        imageUrl,
        status: status || 'active',
        budget: budget ? parseFloat(budget) : null,
        spendCap: spendCap ? parseFloat(spendCap) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        category: {
          connect: { id: categoryId },
        },
        company: {
          connect: { id: companyId },
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
