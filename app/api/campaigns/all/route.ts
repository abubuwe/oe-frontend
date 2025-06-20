import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super users can access all campaigns
    if (session.user.role !== 'super') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    // Get all campaigns with their categories, companies, and metrics
    const campaigns = await prisma.ad.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
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
    console.error('Error fetching all campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}
