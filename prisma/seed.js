const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

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

    // Seed ads for each company and category combination
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
  
    for (const ad of ads) {
      const company = companyMap[ad.companyName];
      const category = categoryMap[ad.categorySlug];
      
      // Skip if category doesn't exist (like 'diabetes' which isn't in our categories)
      if (!category) continue;
      
      // Find existing ad for this company and category combination
      const existingAd = await prisma.ad.findFirst({
        where: {
          companyId: company.id,
          categoryId: category.id,
        }
      });
      
      if (existingAd) {
        // Update existing ad
        await prisma.ad.update({
          where: {
            id: existingAd.id,
          },
          data: {
            imageUrl: ad.imageUrl,
            headline: ad.headline,
            ctaText: ad.ctaText,
            ctaUrl: ad.ctaUrl,
            status: 'active',
            budget: ad.budget,
            spendCap: ad.spendCap,
            startDate: ad.startDate,
            endDate: ad.endDate,
          },
        });
      } else {
        // Create new ad with auto-generated UUID
        await prisma.ad.create({
          data: {
            companyId: company.id,
            categoryId: category.id,
            imageUrl: ad.imageUrl,
            headline: ad.headline,
            ctaText: ad.ctaText,
            ctaUrl: ad.ctaUrl,
            status: 'active',
            budget: ad.budget,
            spendCap: ad.spendCap,
            startDate: ad.startDate,
            endDate: ad.endDate,
          },
        });
      }
    }
    
    console.log('Seeded ads for companies and categories.');

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