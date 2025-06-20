import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

// GET /api/categories - Get categories for a specific company
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

    // Get categories for the company
    const categories = await prisma.category.findMany({
      where: {
        companyId: companyId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/categories - Create a new category
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, companyId } = body;

    // Validate required fields
    if (!name || !slug || !companyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user has access to this company
    if (session.user.role !== 'super' && session.user.companyId !== companyId) {
      return NextResponse.json({ error: 'Unauthorized access to company data' }, { status: 403 });
    }

    // Create the new category
    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        company: {
          connect: { id: companyId },
        },
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'A category with this name or slug already exists for this company' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
