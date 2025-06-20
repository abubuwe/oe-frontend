import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = session.user.role as string;
  const url = new URL(request.url);
  const companyFilter = url.searchParams.get('companyId');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  
  if (!['advertiser', 'staff', 'super'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const where: any = {};
  
  if (role === 'advertiser' && session.user.companyId) {
    where.ad = { companyId: session.user.companyId };
  }
  
  // Only use companyFilter if it's not null and user is not an advertiser
  if (companyFilter !== null && role !== 'advertiser') {
    where.ad = { companyId: companyFilter as string };
  }
  
  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp.gte = new Date(from);
    if (to) where.timestamp.lte = new Date(to);
  }

  const imps = await prisma.impression.findMany({
    where,
    include: {
      ad: { include: { company: true, category: true } },
    },
  });

  const data = imps.map((imp) => ({
    impressionId: imp.id,
    adId: imp.adId,
    company: imp.ad.company.name,
    category: imp.ad.category.name,
    question: imp.question,
    timestamp: imp.timestamp,
    views: 1, // Each impression represents exactly one view
    clicks: imp.clicked ? 1 : 0, // If clicked is true, count as 1 click
  }));
  return NextResponse.json(data);
}