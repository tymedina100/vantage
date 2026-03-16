import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SYSTEM_CATEGORIES = [
  { name: "Food & Drink",     icon: "🍔", color: "#FF6B6B" },
  { name: "Transportation",   icon: "🚗", color: "#4ECDC4" },
  { name: "Shopping",         icon: "🛍️", color: "#45B7D1" },
  { name: "Entertainment",    icon: "🎬", color: "#96CEB4" },
  { name: "Health & Fitness", icon: "💪", color: "#FFEAA7" },
  { name: "Personal Care",    icon: "💅", color: "#DDA0DD" },
  { name: "Home",             icon: "🏠", color: "#98D8C8" },
  { name: "Travel",           icon: "✈️", color: "#F7DC6F" },
  { name: "Utilities",        icon: "⚡", color: "#85C1E9" },
  { name: "Subscriptions",    icon: "📱", color: "#BB8FCE" },
  { name: "Income",           icon: "💰", color: "#58D68D" },
  { name: "Transfer",         icon: "↔️", color: "#ABB2B9" },
  { name: "Loan Payments",    icon: "🏦", color: "#EC7063" },
  { name: "Medical",          icon: "🏥", color: "#76D7C4" },
  { name: "Education",        icon: "📚", color: "#F0B27A" },
  { name: "Other",            icon: "📦", color: "#CCD1D1" },
];

async function main() {
  console.log("Seeding system categories...");
  for (const cat of SYSTEM_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, isSystem: true },
    });
    if (!existing) {
      await prisma.category.create({ data: { ...cat, isSystem: true } });
      console.log(`  Created: ${cat.name}`);
    } else {
      console.log(`  Exists:  ${cat.name}`);
    }
  }
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
