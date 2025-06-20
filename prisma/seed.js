const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
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