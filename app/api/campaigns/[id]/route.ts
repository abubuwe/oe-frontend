import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

// GET /api/campaigns/[id] - Get a specific campaign
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaignId = params.id;
    
    // Get the campaign with its category and metrics
    const campaign = await prisma.ad.findUnique({
      where: {
        id: campaignId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        company: true,
        metrics: {
          orderBy: {
            date: 'desc',
          },
          take: 30, // Last 30 days of metrics
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if user has access to this campaign
    if (session.user.role !== 'super' && session.user.companyId !== campaign.companyId) {
      return NextResponse.json({ error: 'Unauthorized access to campaign data' }, { status: 403 });
    }

    // Calculate aggregated metrics
    const totalImpressions = campaign.metrics.reduce((sum, metric) => sum + metric.impressions, 0);
    const totalClicks = campaign.metrics.reduce((sum, metric) => sum + metric.clicks, 0);
    const totalSpend = campaign.metrics.reduce((sum, metric) => sum + Number(metric.spend), 0);

    const campaignWithMetrics = {
      ...campaign,
      metrics: {
        impressions: totalImpressions,
        clicks: totalClicks,
        spend: totalSpend,
      },
    };

    return NextResponse.json(campaignWithMetrics);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}

// PUT /api/campaigns/[id] - Update a campaign
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaignId = params.id;
    const body = await request.json();
    const { 
      headline, ctaText, ctaUrl, imageUrl, status, 
      budget, spendCap, startDate, endDate, categoryId 
    } = body;

    // Check if campaign exists
    const existingCampaign = await prisma.ad.findUnique({
      where: { id: campaignId },
      select: { companyId: true },
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if user has access to this campaign
    if (session.user.role !== 'super' && session.user.companyId !== existingCampaign.companyId) {
      return NextResponse.json({ error: 'Unauthorized access to campaign data' }, { status: 403 });
    }

    // Check if category belongs to the same company as the campaign
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { companyId: true },
      });

      if (!category || category.companyId !== existingCampaign.companyId) {
        return NextResponse.json({ error: 'Category does not belong to the company' }, { status: 400 });
      }
    }

    // Update the campaign
    const updatedCampaign = await prisma.ad.update({
      where: { id: campaignId },
      data: {
        headline: headline,
        ctaText: ctaText,
        ctaUrl: ctaUrl,
        imageUrl: imageUrl,
        status: status,
        budget: budget !== undefined ? (budget === null ? null : parseFloat(budget)) : undefined,
        spendCap: spendCap !== undefined ? (spendCap === null ? null : parseFloat(spendCap)) : undefined,
        startDate: startDate !== undefined ? (startDate === null ? null : new Date(startDate)) : undefined,
        endDate: endDate !== undefined ? (endDate === null ? null : new Date(endDate)) : undefined,
        categoryId: categoryId,
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

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id] - Delete a campaign
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaignId = params.id;

    // Check if campaign exists
    const existingCampaign = await prisma.ad.findUnique({
      where: { id: campaignId },
      select: { companyId: true },
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if user has access to this campaign
    if (session.user.role !== 'super' && session.user.companyId !== existingCampaign.companyId) {
      return NextResponse.json({ error: 'Unauthorized access to campaign data' }, { status: 403 });
    }

    // Instead of deleting, we archive the campaign
    const archivedCampaign = await prisma.ad.update({
      where: { id: campaignId },
      data: {
        status: 'archived',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error archiving campaign:', error);
    return NextResponse.json({ error: 'Failed to archive campaign' }, { status: 500 });
  }
}
