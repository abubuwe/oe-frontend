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
  // Seed categories
  const categories = [
    { name: 'Cardiology', slug: 'cardiology' },
    { name: 'Neurology', slug: 'neurology' },
    { name: 'Oncology', slug: 'oncology' },
    { name: 'Pediatrics', slug: 'pediatrics' },
  ];
  
  const categoryMap = {};
  for (const c of categories) {
    const category = await prisma.category.upsert({ 
      where: { slug: c.slug }, 
      update: {}, 
      create: c 
    });
    categoryMap[c.slug] = category;
  }

  // Seed companies
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

    // Seed ads for each company and category combination
  console.log('Seeding ads and generating impressions...');
    const ads = [
      // Pfizer ads
      {
        companyName: 'Pfizer',
        categorySlug: 'cardiology',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Pfizer+Cardiology',
        headline: 'Leading Heart Health Innovation',
        ctaText: 'Learn More',
        ctaUrl: 'https://www.pfizer.com/science/therapeutic-areas/cardiovascular',
        budget: 10000.00,
        spendCap: 1000.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months from now
      },
      {
        companyName: 'Pfizer',
        categorySlug: 'neurology',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Pfizer+Neurology',
        headline: 'Advancing Neurological Research',
        ctaText: 'Discover More',
        ctaUrl: 'https://www.pfizer.com/science/therapeutic-areas/neuroscience',
        budget: 8500.00,
        spendCap: 950.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      },
      {
        companyName: 'Pfizer',
        categorySlug: 'oncology',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Pfizer+Oncology',
        headline: 'Breakthrough Cancer Therapies',
        ctaText: 'Learn More',
        ctaUrl: 'https://www.pfizer.com/science/therapeutic-areas/oncology',
        budget: 12000.00,
        spendCap: 1200.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
      },
      {
        companyName: 'Pfizer',
        categorySlug: 'pediatrics',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Pfizer+Pediatrics',
        headline: 'Protecting Children\'s Health',
        ctaText: 'Discover Solutions',
        ctaUrl: 'https://www.pfizer.com/science/therapeutic-areas/vaccines',
        budget: 9000.00,
        spendCap: 900.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      },
      
      // Genentech ads
      {
        companyName: 'Genentech',
        categorySlug: 'cardiology',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Genentech+Cardiology',
        headline: 'Innovative Cardiovascular Solutions',
        ctaText: 'Explore Treatments',
        ctaUrl: 'https://www.gene.com/medical-professionals/cardiovascular',
        budget: 11000.00,
        spendCap: 1100.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      },
      {
        companyName: 'Genentech',
        categorySlug: 'neurology',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Genentech+Neurology',
        headline: 'Transforming Neurological Care',
        ctaText: 'See Research',
        ctaUrl: 'https://www.gene.com/medical-professionals/neuroscience',
        budget: 9500.00,
        spendCap: 950.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      },
      {
        companyName: 'Genentech',
        categorySlug: 'oncology',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Genentech+Oncology',
        headline: 'Pioneering Cancer Treatments',
        ctaText: 'Explore Research',
        ctaUrl: 'https://www.gene.com/medical-professionals/oncology',
        budget: 13000.00,
        spendCap: 1300.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
      },
      {
        companyName: 'Genentech',
        categorySlug: 'pediatrics',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Genentech+Pediatrics',
        headline: 'Advanced Pediatric Therapies',
        ctaText: 'Learn More',
        ctaUrl: 'https://www.gene.com/medical-professionals/pediatrics',
        budget: 9800.00,
        spendCap: 980.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      },
      
      // GSK ads
      {
        companyName: 'GSK',
        categorySlug: 'cardiology',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=GSK+Cardiology',
        headline: 'Heart Health Solutions',
        ctaText: 'Discover More',
        ctaUrl: 'https://www.gsk.com/en-gb/products/our-medicines/',
        budget: 9500.00,
        spendCap: 950.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      },
      {
        companyName: 'GSK',
        categorySlug: 'neurology',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=GSK+Neurology',
        headline: 'Advancing Neurological Science',
        ctaText: 'View Research',
        ctaUrl: 'https://www.gsk.com/en-gb/research/therapeutic-areas/',
        budget: 8200.00,
        spendCap: 820.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      },
      {
        companyName: 'GSK',
        categorySlug: 'oncology',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=GSK+Oncology',
        headline: 'Innovative Cancer Therapies',
        ctaText: 'Learn More',
        ctaUrl: 'https://www.gsk.com/en-gb/research/therapeutic-areas/oncology/',
        budget: 11500.00,
        spendCap: 1150.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
      },
      {
        companyName: 'GSK',
        categorySlug: 'pediatrics',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=GSK+Pediatrics',
        headline: 'Supporting Child Health',
        ctaText: 'View Solutions',
        ctaUrl: 'https://www.gsk.com/en-gb/products/our-vaccines/',
        budget: 8700.00,
        spendCap: 870.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      },
      
      // Eli Lilly ads
      {
        companyName: 'Eli Lilly',
        categorySlug: 'cardiology',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Eli+Lilly+Cardiology',
        headline: 'Cardiovascular Breakthroughs',
        ctaText: 'Explore Solutions',
        ctaUrl: 'https://www.lilly.com/disease-areas/cardiovascular',
        budget: 10500.00,
        spendCap: 1050.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      },
      {
        companyName: 'Eli Lilly',
        categorySlug: 'neurology',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Eli+Lilly+Neurology',
        headline: 'Neurological Disease Innovations',
        ctaText: 'Discover Treatments',
        ctaUrl: 'https://www.lilly.com/disease-areas/neuroscience',
        budget: 9000.00,
        spendCap: 900.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      },
      {
        companyName: 'Eli Lilly',
        categorySlug: 'oncology',
        imageUrl: 'https://placehold.co/600x200/EEE/31343C.png?text=Eli+Lilly+Oncology',
        headline: 'Advancing Cancer Care',
        ctaText: 'Learn More',
        ctaUrl: 'https://www.lilly.com/disease-areas/oncology',
        budget: 12500.00,
        spendCap: 1250.00,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
      },
      {
        companyName: 'Eli Lilly',
        categorySlug: 'pediatrics',
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
  for (const ad of ads) {
    const company = companyMap[ad.companyName];
    const category = categoryMap[ad.categorySlug];
    
    // Skip if category doesn't exist
    if (!category) continue;
    
    // Create or update ad
    const createdAd = await prisma.ad.upsert({
      where: {
        // Use a unique identifier for the ad, since we don't have a unique constraint on companyId + categoryId
        // We'll use the combination of company name and category slug to find existing ads
        id: (await prisma.ad.findFirst({
          where: {
            companyId: company.id,
            categoryId: category.id,
            headline: ad.headline
          },
          select: { id: true }
        }))?.id || '00000000-0000-0000-0000-000000000000' // Fallback ID that won't match anything
      },
      update: {
        imageUrl: ad.imageUrl,
        headline: ad.headline,
        ctaText: ad.ctaText,
        ctaUrl: ad.ctaUrl,
        budget: ad.budget,
        spendCap: ad.spendCap,
        startDate: ad.startDate,
        endDate: ad.endDate,
        status: 'active'
      },
      create: {
        companyId: company.id,
        categoryId: category.id,
        imageUrl: ad.imageUrl,
        headline: ad.headline,
        ctaText: ad.ctaText,
        ctaUrl: ad.ctaUrl,
        budget: ad.budget,
        spendCap: ad.spendCap,
        startDate: ad.startDate,
        endDate: ad.endDate,
        status: 'active'
      }
    });
    
    // Generate random impressions for each ad (between 30-100 per ad)
    const impressionCount = Math.floor(Math.random() * 71) + 30;
    await generateImpressions(createdAd.id, testUser.id, impressionCount);
    console.log(`Generated ${impressionCount} impressions for ad: ${createdAd.headline}`);
  }
  
  console.log('Successfully seeded ads and generated impressions!');

  // Seed default users with password "password"

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