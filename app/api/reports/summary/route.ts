import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const imps = await prisma.impression.findMany({
    include: { ad: { include: { company: true, category: true } } },
  });
  const summaryMap: Record<string, { company: string; category: string; impressions: number; clicks: number }> = {};
  imps.forEach((imp) => {
    const key = `${imp.ad.company.id}|${imp.ad.category.id}`;
    const entry = summaryMap[key] || { company: imp.ad.company.name, category: imp.ad.category.name, impressions: 0, clicks: 0 };
    entry.impressions += 1;
    // If the impression was clicked, increment the clicks count
    if (imp.clicked) {
      entry.clicks += 1;
    }
    summaryMap[key] = entry;
  });
  return NextResponse.json(Object.values(summaryMap));
}