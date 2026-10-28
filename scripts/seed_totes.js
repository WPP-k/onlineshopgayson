const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function seedTotes() {
  console.log("Seeding Tote data from user sheet...");

  // 1. Tote TG2101003090
  const tote1 = await prisma.tote.upsert({
    where: { code: "TG2101003090" },
    update: {},
    create: {
      code: "TG2101003090",
      status: "PENDING",
    },
  });

  const itemsTote1 = [
    { seq: 1, name: "โอวัลติน 3 in 1 30gx33", pCode: "20056698", barcode: "8850086169908", qty: 1, unit: "PAC" },
    { seq: 2, name: "ทอมบาร์เสื้อน้ำปลาแท้ 300ml", pCode: "20033404", barcode: "8850225503167", qty: 2, unit: "PC" },
    { seq: 3, name: "ผงซักฟอกบรีสเอกเซล 75g", pCode: "20007182", barcode: "8850309202733", qty: 5, unit: "PC" },
    { seq: 4, name: "ทาร์ที้ แป้งกรอบรสดั้งเดิม 57g", pCode: "20004686", barcode: "8850718805037", qty: 6, unit: "PC" },
    { seq: 5, name: "ดีโด้น้ำส้ม 20% 300ml", pCode: "20006199", barcode: "8850952902035", qty: 9, unit: "PAC" },
    { seq: 6, name: "บิ๊กก้า เวเฟอร์สตรอเบอร์รี่ 100g", pCode: "20006305", barcode: "8850987351419", qty: 2, unit: "PC" },
  ];

  for (const item of itemsTote1) {
    const existing = await prisma.toteItem.findFirst({
      where: { toteId: tote1.id, itemSeq: item.seq },
    });
    if (!existing) {
      await prisma.toteItem.create({
        data: {
          toteId: tote1.id,
          itemSeq: item.seq,
          name: item.name,
          productCode: item.pCode,
          barcode: item.barcode,
          quantity: item.qty,
          unit: item.unit,
        },
      });
    }
  }

  // 2. Tote TG2101011176
  const tote2 = await prisma.tote.upsert({
    where: { code: "TG2101011176" },
    update: {},
    create: {
      code: "TG2101011176",
      status: "PENDING",
    },
  });

  const itemsTote2 = [
    { seq: 1, name: "บราวนี่เบเกอรี่เค้กคละรส 140g", pCode: "20006680", barcode: "8850035805017", qty: 1, unit: "PAC" },
    { seq: 2, name: "แมนดารินเต้าหู้ทอดปรุงรส 165/180g", pCode: "20006153", barcode: "8850128030067", qty: 2, unit: "PC" },
    { seq: 3, name: "มะเขือเทศเข้มข้นหวาน 380g", pCode: "20003743", barcode: "8850151951018", qty: 31, unit: "PC" },
    { seq: 4, name: "แป้งปลาหมึกอบกรอบ 18/22g", pCode: "20004776", barcode: "8850157401401", qty: 1, unit: "PAC" },
    { seq: 5, name: "นมเมจิมิกซ์ปรุงอาหาร & เบเกอรี่ 360g", pCode: "20006204", barcode: "8850188170208", qty: 1, unit: "PC" },
    { seq: 6, name: "เนยเค็ม ตราหมู 400g", pCode: "20023394", barcode: "8850250011040", qty: 1, unit: "PAC" },
    { seq: 7, name: "ไวตามิลค์ โรสแมรี่ 36g", pCode: "20004633", barcode: "8850580000264", qty: 1, unit: "PAC" },
    { seq: 8, name: "อายิโนะโมะโต๊ะ 18/16gx30", pCode: "20030043", barcode: "8853002305701", qty: 1, unit: "PAC" },
    { seq: 9, name: "ครีมหมักพริกแกงส้ม 100g", pCode: "20048524", barcode: "8859333719187", qty: 1, unit: "PC" },
    { seq: 10, name: "ปังไส้เผือก 35g", pCode: "20059338", barcode: "8859849100042", qty: 4, unit: "PAC" },
  ];

  for (const item of itemsTote2) {
    const existing = await prisma.toteItem.findFirst({
      where: { toteId: tote2.id, itemSeq: item.seq },
    });
    if (!existing) {
      await prisma.toteItem.create({
        data: {
          toteId: tote2.id,
          itemSeq: item.seq,
          name: item.name,
          productCode: item.pCode,
          barcode: item.barcode,
          quantity: item.qty,
          unit: item.unit,
        },
      });
    }
  }

  // 3. Tote TG2101020993
  const tote3 = await prisma.tote.upsert({
    where: { code: "TG2101020993" },
    update: {},
    create: {
      code: "TG2101020993",
      status: "PENDING",
    },
  });

  const itemsTote3 = [
    { seq: 1, name: "ดาวน์นี่ปรับผ้านุ่มดอกไม้แดง 460/480ml", pCode: "20030656", barcode: "4902430414494", qty: 2, unit: "PC" },
    { seq: 2, name: "บรีสเอกเซลสูตรเข้มข้น 130/140g", pCode: "20010117", barcode: "8850899120257", qty: 3, unit: "PC" },
  ];

  for (const item of itemsTote3) {
    const existing = await prisma.toteItem.findFirst({
      where: { toteId: tote3.id, itemSeq: item.seq },
    });
    if (!existing) {
      await prisma.toteItem.create({
        data: {
          toteId: tote3.id,
          itemSeq: item.seq,
          name: item.name,
          productCode: item.pCode,
          barcode: item.barcode,
          quantity: item.qty,
          unit: item.unit,
        },
      });
    }
  }

  // Also ensure these products are in the Product table so that scanning by barcode/productCode works everywhere!
  const allToteItems = [...itemsTote1, ...itemsTote2, ...itemsTote3];
  for (const p of allToteItems) {
    const found = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: p.barcode },
          { productCode: p.pCode }
        ]
      }
    });

    if (!found) {
      await prisma.product.create({
        data: {
          sku: p.barcode,
          productCode: p.pCode,
          name: p.name,
          price: 25.0, // default retail price
          costPrice: 20.0,
          stock: p.qty,
          unit: p.unit,
          toteCode: "TG2101003090",
          image: "📦",
          status: "ACTIVE"
        }
      });
      console.log(`Created product: ${p.name} (Code: ${p.pCode}, Barcode: ${p.barcode})`);
    } else {
      // Update productCode and unit if missing
      await prisma.product.update({
        where: { id: found.id },
        data: {
          productCode: found.productCode || p.pCode,
          unit: found.unit || p.unit,
        }
      });
    }
  }

  console.log("Seeding finished successfully!");
}

seedTotes().catch(console.error);
