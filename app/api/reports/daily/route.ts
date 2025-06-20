import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = session.user.role as string;
  const url = new URL(request.url);
  const companyId = url.searchParams.get('companyId');
  
  if (!['advertiser', 'staff', 'super'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // For advertisers, use their company ID from the session
  // For staff/super, use the companyId from the query if provided
  const finalCompanyId = role === 'advertiser' 
    ? session.user.companyId 
    : companyId;

  if (!finalCompanyId) {
    return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
  }

  // Get all impressions for the company
  const impressions = await prisma.impression.findMany({
    where: {
      ad: { companyId: finalCompanyId }
    },
    include: {
      ad: true
    }
  });

  // Group impressions by date
  const dailyData: Record<string, { date: string, impressions: number, clicks: number }> = {};
  
  impressions.forEach(imp => {
    const date = imp.timestamp.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        impressions: 0,
        clicks: 0
      };
    }
    
    dailyData[date].impressions++;
    if (imp.clicked) {
      dailyData[date].clicks++;
    }
  });

  // Convert to array and sort by date
  const result = Object.values(dailyData).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return NextResponse.json(result);
}
