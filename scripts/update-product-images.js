const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const db = new Database(dbPath);

// Dictionary mapping keywords to authentic high-resolution product images
function getImageForProduct(name) {
  const n = name.toLowerCase();

  // 1. Noodles & Instant food
  if (n.includes('ต้มยำ')) {
    return 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&q=80'; // Tom Yum Noodles
  }
  if (n.includes('หมูสับ') || n.includes('บะหมี่รสหมูสับ')) {
    return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80'; // Pork Noodle
  }
  if (n.includes('มาม่าคัพ')) {
    return 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=500&q=80'; // Noodle Cup
  }
  if (n.includes('มาม่า') || n.includes('บะหมี่')) {
    return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80';
  }

  // 2. Drinking Water & Mineral Water
  if (n.includes('น้ำแร่')) {
    return 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&q=80'; // Mineral Water
  }
  if (n.includes('สิงห์น้ำดื่ม')) {
    return 'https://images.unsplash.com/photo-1559839914-1b34645a3803?w=500&q=80'; // Singha water
  }
  if (n.includes('คริสตัล') || n.includes('น้ำดื่ม')) {
    return 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&q=80'; // Pure bottled water
  }

  // 3. Milk & Soymilk
  if (n.includes('แลคตาซอย')) {
    return 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=500&q=80'; // Lactasoy soymilk
  }
  if (n.includes('ไวตามิ')) {
    return 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=500&q=80'; // Vitamilk
  }
  if (n.includes('ไทยเดนมาร์ค') || n.includes('นมโคสด')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80'; // Fresh Milk
  }
  if (n.includes('นมถั่วเหลือง')) {
    return 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=500&q=80';
  }
  if (n.includes('เมจิ') || n.includes('นม')) {
    return 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80';
  }

  // 4. Tea & Fruit Juice & Energy Drink
  if (n.includes('โออิชิ') || n.includes('ชาเขียว') || n.includes('เพียวริคุ')) {
    return 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=500&q=80'; // Green Tea
  }
  if (n.includes('สปอนเซอร์')) {
    return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80'; // Sports Drink
  }
  if (n.includes('ดีโด้') || n.includes('กาโตะ') || n.includes('น้ำส้ม') || n.includes('น้ำผลไม้')) {
    return 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&q=80'; // Fruit Juice
  }

  // 5. Coffee & Malt Drinks
  if (n.includes('โอวัลติน')) {
    return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80'; // Ovaltine Malt
  }
  if (n.includes('เนสกาแฟ') || n.includes('กาแฟ')) {
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80'; // Nescafe Coffee
  }

  // 6. Chips & Savory Snacks
  if (n.includes('เลย์')) {
    return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80'; // Lays Potato Chips
  }
  if (n.includes('มันฝรั่ง')) {
    return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80';
  }
  if (n.includes('ฮานามิ') || n.includes('ปลาหมึก') || n.includes('แป้งกรอบ')) {
    return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&q=80'; // Hanami crackers
  }
  if (n.includes('โก๋แก่') || n.includes('ถั่ว')) {
    return 'https://images.unsplash.com/photo-1508061252224-203a23004787?w=500&q=80'; // Koh-Kae Peanuts
  }
  if (n.includes('สาหร่าย') || n.includes('มาชิตะ')) {
    return 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&q=80'; // Masita Seaweed
  }
  if (n.includes('ทาโร่')) {
    return 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=500&q=80'; // Taro Fish Snack
  }
  if (n.includes('ตะวัน') || n.includes('เอสคิว')) {
    return 'https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=500&q=80'; // Tawan Crisps
  }
  if (n.includes('ผลไม้อบแห้ง')) {
    return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80';
  }

  // 7. Bakery & Cookies & Sweets
  if (n.includes('คุกกี้')) {
    return 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80'; // Chocolate Cookie
  }
  if (n.includes('เวเฟอร์') || n.includes('บิสชิน') || n.includes('แครกเกอร์') || n.includes('วอยซ์')) {
    return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80'; // Wafer Crackers
  }
  if (n.includes('บราวนี่') || n.includes('เค้ก')) {
    return 'https://images.unsplash.com/photo-1515037893149-de7f840978e2?w=500&q=80'; // Brownie
  }
  if (n.includes('ฟาร์มเฮ้าส์') || n.includes('ขนมปัง') || n.includes('ปัง') || n.includes('วาฟเฟิล')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80'; // Bread Farmhouse
  }
  if (n.includes('กัมมี่') || n.includes('ยูปี้')) {
    return 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=500&q=80'; // Yupi Gummy
  }

  // 8. Rice
  if (n.includes('ข้าวหอมมะลิ')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80'; // Jasmine Rice
  }
  if (n.includes('ข้าวเหนียว') || n.includes('ข้าว')) {
    return 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=500&q=80'; // Sticky Rice
  }

  // 9. Seasoning, Oils, Sauces
  if (n.includes('น้ำปลา')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80'; // Fish sauce bottle
  }
  if (n.includes('ซีอิ๊ว') || n.includes('ซอส')) {
    return 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=500&q=80'; // Soy sauce
  }
  if (n.includes('น้ำมัน')) {
    return 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=500&q=80'; // Cooking oil
  }
  if (n.includes('น้ำจิ้ม') || n.includes('มะเขือเทศ')) {
    return 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&q=80'; // Chili / Suki sauce
  }
  if (n.includes('เนย')) {
    return 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80'; // Butter
  }
  if (n.includes('อายิโนะโมะโต๊ะ') || n.includes('พริกแกง') || n.includes('เต้าหู้') || n.includes('น้ำตาล')) {
    return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80'; // Seasoning
  }

  // 10. Canned Food & Sausages
  if (n.includes('ไส้กรอก')) {
    return 'https://images.unsplash.com/photo-1597652758156-f633393952ba?w=500&q=80'; // Sausage
  }
  if (n.includes('ปลากระป๋อง') || n.includes('โรซ่า') || n.includes('ปุ้มปุ้ย')) {
    return 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=500&q=80'; // Canned Fish
  }
  if (n.includes('เงาะ') || n.includes('สับปะรด') || n.includes('ผลไม้กระป๋อง')) {
    return 'https://images.unsplash.com/photo-1587393855524-087f83d95bc9?w=500&q=80'; // Canned Rambutan
  }

  // 11. Soap & Body Wash
  if (n.includes('สบู่') || n.includes('นกแก้ว')) {
    return 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=500&q=80'; // Herbal Soap Parrot
  }
  if (n.includes('ครีมอาบน้ำ') || n.includes('โชกุบุสซึ')) {
    return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80'; // Body wash
  }

  // 12. Shampoo & Hair Care
  if (n.includes('แชมพู') || n.includes('ซันซิล') || n.includes('เคลียร์')) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80'; // Shampoo bottle
  }

  // 13. Oral Care
  if (n.includes('ยาสีฟัน') || n.includes('คอลเกต') || n.includes('ดาร์ลี่')) {
    return 'https://images.unsplash.com/photo-1559591937-e160e1d1f057?w=500&q=80'; // Toothpaste
  }
  if (n.includes('แปรงสีฟัน')) {
    return 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&q=80'; // Toothbrush
  }

  // 14. Skincare & Baby
  if (n.includes('แป้งเด็ก') || n.includes('แคร์') || n.includes('จอห์นสัน')) {
    return 'https://images.unsplash.com/photo-1556228722-d0b5de70b774?w=500&q=80'; // Baby Powder
  }
  if (n.includes('โอเลย์') || n.includes('โลชั่น') || n.includes('กันแดด') || n.includes('เจลล้างหน้า') || n.includes('คลีนแอนด์เคลียร์')) {
    return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80'; // Skincare Cream
  }
  if (n.includes('สำลี')) {
    return 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=500&q=80'; // Cotton Buds
  }

  // 15. Cleaning & Laundry & Paper
  if (n.includes('ผงซักฟอก') || n.includes('บรีส')) {
    return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&q=80'; // Laundry Detergent
  }
  if (n.includes('ปรับผ้านุ่ม') || n.includes('ดาวน์นี่') || n.includes('ไฮเตอร์')) {
    return 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=500&q=80'; // Softener
  }
  if (n.includes('ทิชชู่')) {
    return 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&q=80'; // Tissue Pack
  }

  // 16. Pet Food & Medicine
  if (n.includes('สุนัข')) {
    return 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&q=80'; // Dog Food
  }
  if (n.includes('แมว')) {
    return 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&q=80'; // Cat Food
  }
  if (n.includes('ทิฟฟี่') || n.includes('พารา')) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80'; // Medicine
  }

  // Default Grocery Fallback
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
}

function updateImages() {
  const products = db.prepare('SELECT id, name, image FROM Product').all();
  
  let updatedCount = 0;
  const updateStmt = db.prepare('UPDATE Product SET image = ? WHERE id = ?');

  const updateMany = db.transaction((prods) => {
    for (const p of prods) {
      // Check if image is missing, empty, or an emoji (length <= 4)
      const needsImage = !p.image || p.image.trim() === '' || p.image.length <= 4;
      if (needsImage) {
        const newImg = getImageForProduct(p.name);
        updateStmt.run(newImg, p.id);
        updatedCount++;
        console.log(`[${updatedCount}] Updated "${p.name}" -> ${newImg.slice(0, 50)}...`);
      }
    }
  });

  updateMany(products);

  console.log(`\n Successfully updated ${updatedCount} products with real images!`);
}

updateImages();
