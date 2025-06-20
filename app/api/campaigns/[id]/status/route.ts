import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { AdStatus } from '@prisma/client';

// PATCH /api/campaigns/[id]/status - Update campaign status
export async function PATCH(
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
    const { status } = body;

    // Validate status
    if (!status || !['active', 'paused', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

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

    // Update the campaign status
    const updatedCampaign = await prisma.ad.update({
      where: { id: campaignId },
      data: {
        status: status as AdStatus,
      },
    });

    return NextResponse.json({ success: true, status: updatedCampaign.status });
  } catch (error) {
    console.error('Error updating campaign status:', error);
    return NextResponse.json({ error: 'Failed to update campaign status' }, { status: 500 });
  }
}
