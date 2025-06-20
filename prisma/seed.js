const { PrismaClient, AdStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const prisma = new PrismaClient();

// Function to generate a random date within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Function to generate random impressions for an ad
async function generateImpressions(adId, userId, count = 50) {
  const impressions = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Create an array of dates for the last 30 days
  const dates = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  
  // Distribute impressions more evenly across the last month
  for (let i = 0; i < count; i++) {
    // Select a date from the array (weighted towards more recent dates)
    const dateIndex = Math.floor(Math.random() * Math.random() * 30);
    const baseDate = dates[dateIndex];
    
    // Add random hours/minutes/seconds to make timestamps more realistic
    const timestamp = new Date(baseDate);
    timestamp.setHours(Math.floor(Math.random() * 24));
    timestamp.setMinutes(Math.floor(Math.random() * 60));
    timestamp.setSeconds(Math.floor(Math.random() * 60));
    
    const clicked = Math.random() < 0.3; // 30% chance of click
    
    impressions.push({
      adId,
      userId: Math.random() < 0.8 ? userId : null, // 80% chance to have a user
      question: faker.lorem.sentence(),
      timestamp,
      clicked,
      sessionId: faker.string.uuid(),
      idempotencyKey: faker.string.uuid()
    });
  }
  
  // Create impressions in batch
  await prisma.impression.createMany({
    data: impressions,
    skipDuplicates: true
  });
  
  // Create/update metrics by day
  const metrics = {};
  impressions.forEach(imp => {
    const date = imp.timestamp.toISOString().split('T')[0];
    if (!metrics[date]) {
      metrics[date] = { impressions: 0, clicks: 0 };
    }
    metrics[date].impressions++;
    if (imp.clicked) metrics[date].clicks++;
  });
  
  // Update metrics
  for (const [date, data] of Object.entries(metrics)) {
    await prisma.adMetrics.upsert({
      where: { adId_date: { adId, date: new Date(date) } },
      update: {
        impressions: { increment: data.impressions },
        clicks: { increment: data.clicks }
      },
      create: {
        adId,
        date: new Date(date),
        impressions: data.impressions,
        clicks: data.clicks
      }
    });
  }
  
  return impressions.length;
}

async function main() {
  // Seed companies first
  const companies = [
    { name: 'Pfizer' },
    { name: 'Genentech' },
    { name: 'GSK' },
    { name: 'Eli Lilly' },
  ];
  
  const companyMap = {};
  for (const c of companies) {
    const company = await prisma.company.upsert({ 
      where: { name: c.name }, 
      update: {}, 
      create: c 
    });
    companyMap[c.name] = company;
  }

  // Seed categories with company assignments
  // Each category is assigned to exactly one company
  const categoryCompanyAssignments = [
    { name: 'Cardiology', slug: 'cardiology', companyName: 'Pfizer' },
    { name: 'Neurology', slug: 'neurology', companyName: 'Genentech' },
    { name: 'Oncology', slug: 'oncology', companyName: 'GSK' },
    { name: 'Pediatrics', slug: 'pediatrics', companyName: 'Eli Lilly' },
  ];
  
  const categoryMap = {};
  for (const c of categoryCompanyAssignments) {
    const company = companyMap[c.companyName];
    if (!company) {
      console.log(`Company ${c.companyName} not found for category ${c.name}`);
      continue;
    }
    
    const category = await prisma.category.upsert({ 
      where: { slug: c.slug }, 
      update: { 
        companyId: company.id 
      }, 
      create: {
        name: c.name,
        slug: c.slug,
        companyId: company.id
      }
    });
    categoryMap[c.slug] = category;
  }

  console.log('Seeded categories and companies.');
  
  // Create a test user for impressions
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: await bcrypt.hash('password123', 10),
      role: 'doctor',
      companyId: companyMap['Pfizer'].id
    }
  });
  
  console.log('Created test user:', testUser.email);

    // Seed ads for each valid company-category pair (one category per company)
  console.log('Seeding ads and generating impressions...');
    const ads = [
      // Pfizer ad - only for Cardiology category
      {
        companyName: 'Pfizer',
        categorySlug: 'cardiology', // This is the only valid category for Pfizer
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Pfizer+Cardiology',
        headline: 'Leading Heart Health Innovation',
        ctaText: 'Learn More',
        ctaUrl: 'https://www.pfizer.com/science/therapeutic-areas/cardiovascular',
        budget: 10000.00,
        spendCap: 1000.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months from now
      },
      // Genentech ad - only for Neurology category
      {
        companyName: 'Genentech',
        categorySlug: 'neurology', // This is the only valid category for Genentech
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Genentech+Neurology',
        headline: 'Transforming Neurological Care',
        ctaText: 'Discover More',
        ctaUrl: 'https://www.gene.com/medical-professionals/neuroscience',
        budget: 9500.00,
        spendCap: 950.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      },
      // GSK ad - only for Oncology category
      {
        companyName: 'GSK',
        categorySlug: 'oncology', // This is the only valid category for GSK
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=GSK+Oncology',
        headline: 'Innovative Cancer Therapies',
        ctaText: 'Learn More',
        ctaUrl: 'https://www.gsk.com/en-gb/healthcare-professionals/oncology/',
        budget: 11000.00,
        spendCap: 1100.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
      },
      // Eli Lilly ad - only for Pediatrics category
      {
        companyName: 'Eli Lilly',
        categorySlug: 'pediatrics', // This is the only valid category for Eli Lilly
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Eli+Lilly+Pediatrics',
        headline: 'Pediatric Health Solutions',
        ctaText: 'Find Out More',
        ctaUrl: 'https://www.lilly.com/disease-areas/pediatrics',
        budget: 9200.00,
        spendCap: 920.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      }
    ];
  
  // Seed ads and generate impressions
  for (const adData of ads) {
    const company = companyMap[adData.companyName];
    const category = categoryMap[adData.categorySlug];
    
    // Skip if category doesn't exist
    if (!category) continue;
    
    // Verify that this category belongs to this company (respecting one-to-one relationship)
    if (category.companyId !== company.id) {
      console.log(`Skipping ad: Category ${adData.categorySlug} does not belong to company ${adData.companyName}`);
      continue;
    }
    
    // Create or update the ad
    // First check if an ad already exists for this company and category
    const existingAd = await prisma.ad.findFirst({
      where: {
        companyId: company.id,
        categoryId: category.id,
      }
    });
    
    // Create or update the ad
    const ad = await prisma.ad.upsert({
      where: {
        id: existingAd?.id || 'non-existent-id', // Use existing ad ID or a non-existent ID
      },
      update: {
        imageUrl: adData.imageUrl,
        headline: adData.headline,
        ctaText: adData.ctaText,
        ctaUrl: adData.ctaUrl,
        budget: adData.budget,
        spendCap: adData.spendCap,
        startDate: adData.startDate,
        endDate: adData.endDate,
      },
      create: {
        company: { connect: { id: company.id } },
        category: { connect: { id: category.id } },
        imageUrl: adData.imageUrl,
        headline: adData.headline,
        ctaText: adData.ctaText,
        ctaUrl: adData.ctaUrl,
        budget: adData.budget,
        spendCap: adData.spendCap,
        startDate: adData.startDate,
        endDate: adData.endDate,
      },
    });
    
    console.log(`Created ad: ${ad.headline} for ${adData.companyName} in ${adData.categorySlug}`);
    
    // Generate impressions for this ad
    await generateImpressions(ad.id, testUser.id, 100);
    
    // Update ad metrics
    const impressions = await prisma.impression.findMany({
      where: { adId: ad.id },
    });
    
    const clicks = impressions.filter(imp => imp.clicked).length;
    
    // Get today's date with time set to midnight for the date field
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await prisma.adMetrics.upsert({
      where: { 
        adId_date: {
          adId: ad.id,
          date: today
        }
      },
      update: {
        impressions: impressions.length,
        clicks,
        ctr: impressions.length > 0 ? clicks / impressions.length : 0,
      },
      create: {
        ad: { connect: { id: ad.id } },
        date: today,
        impressions: impressions.length,
        clicks,
        ctr: impressions.length > 0 ? clicks / impressions.length : 0,
      },
    });
    
    console.log(`Generated ${impressions.length} impressions with ${clicks} clicks for ad: ${ad.headline}`);
  }

  console.log('Successfully seeded ads and generated impressions!');

  // Seed default users with password "password"
  const users = [
    { email: 'super@example.com', name: 'Super User', role: 'super' },
    { email: 'staff@example.com', name: 'Staff User', role: 'staff' },
    { email: 'advertiser@example.com', name: 'Advertiser User', role: 'advertiser', companyName: 'Pfizer' },
    { email: 'doctor@example.com', name: 'Doctor User', role: 'doctor' },
  ];
  for (const u of users) {
    const hashed = await bcrypt.hash('password', 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        password: hashed,
        ...(u.companyName && { company: { connect: { name: u.companyName } } }),
      },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        password: hashed,
        ...(u.companyName && { company: { connect: { name: u.companyName } } }),
      },
    });
  }
  console.log('Seeded default users with role-based credentials (password=password).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });