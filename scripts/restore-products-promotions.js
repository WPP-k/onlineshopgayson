const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const db = new Database(dbPath);

console.log("Restoring authentic store products and promotions...");

// 1. All 15 official categories with clean icons
const CATEGORIES = [
  { name: "ขนม", image: "Cookie" },
  { name: "น้ำ", image: "GlassWater" },
  { name: "เครื่องปรุง", image: "Utensils" },
  { name: "มาม่า", image: "ConciergeBell" },
  { name: "ผงซักฟอก", image: "Sparkles" },
  { name: "สบู่", image: "Bath" },
  { name: "นม", image: "Milk" },
  { name: "ของใช้ส่วนตัว", image: "ShoppingBag" },
  { name: "ครีม", image: "Sun" },
  { name: "อาหารสัตว์", image: "Bone" },
  { name: "ข้าวสาร", image: "Wheat" },
  { name: "เครื่องดื่ม", image: "Coffee" },
  { name: "ยาสีฟัน", image: "Smile" },
  { name: "อาหารกระป๋อง", image: "Database" },
  { name: "ของใช้ในบ้าน", image: "Home" },
];

// Helper to determine product category
function getCategoryForProduct(name) {
  const n = name.toLowerCase();
  if (n.includes('มาม่า') || n.includes('บะหมี่') || n.includes('มาม่าคัพ')) return 'มาม่า';
  if (n.includes('น้ำดื่ม') || n.includes('น้ำแร่') || n.includes('คริสตัล') || n.includes('สิงห์น้ำดื่ม')) return 'น้ำ';
  if (n.includes('นม') || n.includes('แลคตาซอย') || n.includes('ไวตามิ') || n.includes('ไทยเดนมาร์ค')) return 'นม';
  if (n.includes('กาแฟ') || n.includes('ชาเขียว') || n.includes('เนสกาแฟ') || n.includes('โอวัลติน') || n.includes('โออิชิ') || n.includes('เพียวริคุ') || n.includes('สปอนเซอร์') || n.includes('ดีโด้') || n.includes('กาโตะ') || n.includes('น้ำผลไม้')) return 'เครื่องดื่ม';
  if (n.includes('ยาสีฟัน') || n.includes('คอลเกต') || n.includes('แปรงสีฟัน') || n.includes('ดาร์ลี่')) return 'ยาสีฟัน';
  if (n.includes('สบู่') || n.includes('ครีมอาบน้ำ') || n.includes('โชกุบุสซึ')) return 'สบู่';
  if (n.includes('ผงซักฟอก') || n.includes('บรีส') || n.includes('ปรับผ้านุ่ม') || n.includes('ดาวน์นี่') || n.includes('ไฮเตอร์')) return 'ผงซักฟอก';
  if (n.includes('ข้าว') || n.includes('ข้าวหอมมะลิ') || n.includes('ข้าวเหนียว')) return 'ข้าวสาร';
  if (n.includes('ปลากระป๋อง') || n.includes('โรซ่า') || n.includes('ปุ้มปุ้ย') || n.includes('เงาะ') || n.includes('กระป๋อง')) return 'อาหารกระป๋อง';
  if (n.includes('หมา') || n.includes('สุนัข') || n.includes('แมว') || n.includes('อาหารสัตว์')) return 'อาหารสัตว์';
  if (n.includes('ครีม') || n.includes('โอเลย์') || n.includes('กันแดด') || n.includes('โลชั่น') || n.includes('ล้างหน้า') || n.includes('แป้งเด็ก') || n.includes('แคร์')) return 'ครีม';
  if (n.includes('น้ำปลา') || n.includes('ซีอิ๊ว') || n.includes('น้ำมัน') || n.includes('ซอส') || n.includes('อายิโนะโมะโต๊ะ') || n.includes('พริกแกง') || n.includes('น้ำจิ้ม') || n.includes('เนย')) return 'เครื่องปรุง';
  if (n.includes('ล้างจาน') || n.includes('น้ำตาล')) return 'ของใช้ในบ้าน';
  if (n.includes('แชมพู') || n.includes('ซันซิล') || n.includes('เคลียร์') || n.includes('สำลี') || n.includes('ทิชชู่') || n.includes('พารา') || n.includes('ทิฟฟี่') || n.includes('ผ้าอ้อม') || n.includes('แพ้นท์') || n.includes('ไลฟ์รี่')) return 'ของใช้ส่วนตัว';
  if (n.includes('เลย์') || n.includes('มันฝรั่ง') || n.includes('คุกกี้') || n.includes('ขนม') || n.includes('เวเฟอร์') || n.includes('บิสชิน') || n.includes('โก๋แก่') || n.includes('ทาโร่') || n.includes('ตะวัน') || n.includes('มาชิตะ') || n.includes('กัมมี่') || n.includes('ยูปี้') || n.includes('วอยซ์') || n.includes('บราวนี่') || n.includes('ปัง') || n.includes('วาฟเฟิล') || n.includes('ฮานามิ') || n.includes('แป้งกรอบ') || n.includes('ฟาร์มเฮ้าส์')) return 'ขนม';
  return 'ของใช้ในบ้าน';
}

// Authentic high-resolution product image mapping
function getImageForProduct(name) {
  const n = name.toLowerCase();

  // 1. Noodles & Instant food
  if (n.includes('ต้มยำ')) {
    return 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&q=80';
  }
  if (n.includes('หมูสับ') || n.includes('บะหมี่รสหมูสับ')) {
    return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80';
  }
  if (n.includes('มาม่าคัพ')) {
    return 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=500&q=80';
  }
  if (n.includes('มาม่า') || n.includes('บะหมี่')) {
    return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80';
  }

  // 2. Drinking Water & Mineral Water
  if (n.includes('น้ำแร่')) {
    return 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&q=80';
  }
  if (n.includes('สิงห์น้ำดื่ม')) {
    return 'https://images.unsplash.com/photo-1559839914-1b34645a3803?w=500&q=80';
  }
  if (n.includes('คริสตัล') || n.includes('น้ำดื่ม')) {
    return 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&q=80';
  }

  // 3. Milk & Soymilk
  if (n.includes('แลคตาซอย') || n.includes('ไวตามิ') || n.includes('นมถั่วเหลือง')) {
    return 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=500&q=80';
  }
  if (n.includes('ไทยเดนมาร์ค') || n.includes('นมโคสด')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80';
  }
  if (n.includes('เมจิ') || n.includes('นม')) {
    return 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80';
  }

  // 4. Tea & Fruit Juice & Energy Drink
  if (n.includes('โออิชิ') || n.includes('ชาเขียว') || n.includes('เพียวริคุ')) {
    return 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=500&q=80';
  }
  if (n.includes('สปอนเซอร์')) {
    return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80';
  }
  if (n.includes('ดีโด้') || n.includes('กาโตะ') || n.includes('น้ำส้ม') || n.includes('น้ำผลไม้')) {
    return 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&q=80';
  }

  // 5. Coffee & Malt Drinks
  if (n.includes('โอวัลติน')) {
    return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80';
  }
  if (n.includes('เนสกาแฟ') || n.includes('กาแฟ')) {
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80';
  }

  // 6. Chips & Savory Snacks
  if (n.includes('เลย์') || n.includes('มันฝรั่ง')) {
    return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80';
  }
  if (n.includes('ฮานามิ') || n.includes('ปลาหมึก') || n.includes('แป้งกรอบ')) {
    return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&q=80';
  }
  if (n.includes('โก๋แก่') || n.includes('ถั่ว')) {
    return 'https://images.unsplash.com/photo-1508061252224-203a23004787?w=500&q=80';
  }
  if (n.includes('สาหร่าย') || n.includes('มาชิตะ')) {
    return 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&q=80';
  }
  if (n.includes('ทาโร่')) {
    return 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=500&q=80';
  }
  if (n.includes('ตะวัน') || n.includes('เอสคิว')) {
    return 'https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=500&q=80';
  }
  if (n.includes('ผลไม้อบแห้ง')) {
    return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80';
  }

  // 7. Bakery & Cookies & Sweets
  if (n.includes('คุกกี้')) {
    return 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80';
  }
  if (n.includes('เวเฟอร์') || n.includes('บิสชิน') || n.includes('แครกเกอร์') || n.includes('วอยซ์')) {
    return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80';
  }
  if (n.includes('บราวนี่') || n.includes('เค้ก')) {
    return 'https://images.unsplash.com/photo-1515037893149-de7f840978e2?w=500&q=80';
  }
  if (n.includes('ฟาร์มเฮ้าส์') || n.includes('ขนมปัง') || n.includes('ปัง') || n.includes('วาฟเฟิล')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80';
  }
  if (n.includes('กัมมี่') || n.includes('ยูปี้')) {
    return 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=500&q=80';
  }

  // 8. Rice & Sugar
  if (n.includes('ข้าวหอมมะลิ')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80';
  }
  if (n.includes('ข้าวเหนียว') || n.includes('ข้าว')) {
    return 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=500&q=80';
  }
  if (n.includes('น้ำตาล')) {
    return 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=500&q=80';
  }

  // 9. Seasoning, Oils, Sauces
  if (n.includes('น้ำปลา')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80';
  }
  if (n.includes('ซีอิ๊ว') || n.includes('ซอส')) {
    return 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=500&q=80';
  }
  if (n.includes('น้ำมัน')) {
    return 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=500&q=80';
  }
  if (n.includes('น้ำจิ้ม') || n.includes('มะเขือเทศ')) {
    return 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&q=80';
  }
  if (n.includes('เนย')) {
    return 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80';
  }
  if (n.includes('อายิโนะโมะโต๊ะ') || n.includes('พริกแกง') || n.includes('เต้าหู้')) {
    return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80';
  }

  // 10. Canned Food & Sausages
  if (n.includes('ไส้กรอก')) {
    return 'https://images.unsplash.com/photo-1597652758156-f633393952ba?w=500&q=80';
  }
  if (n.includes('ปลากระป๋อง') || n.includes('โรซ่า') || n.includes('ปุ้มปุ้ย')) {
    return 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=500&q=80';
  }
  if (n.includes('เงาะ') || n.includes('สับปะรด') || n.includes('ผลไม้กระป๋อง')) {
    return 'https://images.unsplash.com/photo-1587393855524-087f83d95bc9?w=500&q=80';
  }

  // 11. Soap & Body Wash
  if (n.includes('สบู่') || n.includes('นกแก้ว')) {
    return 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=500&q=80';
  }
  if (n.includes('ครีมอาบน้ำ') || n.includes('โชกุบุสซึ')) {
    return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80';
  }

  // 12. Shampoo & Hair Care
  if (n.includes('แชมพู') || n.includes('ซันซิล') || n.includes('เคลียร์')) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80';
  }

  // 13. Oral Care
  if (n.includes('ยาสีฟัน') || n.includes('คอลเกต') || n.includes('ดาร์ลี่')) {
    return 'https://images.unsplash.com/photo-1559591937-e160e1d1f057?w=500&q=80';
  }
  if (n.includes('แปรงสีฟัน')) {
    return 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&q=80';
  }

  // 14. Skincare & Diapers & Baby
  if (n.includes('แป้งเด็ก') || n.includes('แคร์') || n.includes('จอห์นสัน')) {
    return 'https://images.unsplash.com/photo-1556228722-d0b5de70b774?w=500&q=80';
  }
  if (n.includes('โอเลย์') || n.includes('โลชั่น') || n.includes('กันแดด') || n.includes('เจลล้างหน้า') || n.includes('คลีนแอนด์เคลียร์')) {
    return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80';
  }
  if (n.includes('ผ้าอ้อม') || n.includes('แพ้นท์') || n.includes('ไฮเบบี้') || n.includes('ไลฟ์รี่')) {
    return 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&q=80';
  }
  if (n.includes('สำลี')) {
    return 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=500&q=80';
  }

  // 15. Cleaning & Laundry & Paper
  if (n.includes('ผงซักฟอก') || n.includes('บรีส')) {
    return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&q=80';
  }
  if (n.includes('ปรับผ้านุ่ม') || n.includes('ดาวน์นี่') || n.includes('ไฮเตอร์')) {
    return 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=500&q=80';
  }
  if (n.includes('ทิชชู่')) {
    return 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&q=80';
  }
  if (n.includes('ล้างจาน')) {
    return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&q=80';
  }

  // 16. Pet Food & Medicine
  if (n.includes('สุนัข')) {
    return 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&q=80';
  }
  if (n.includes('แมว')) {
    return 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&q=80';
  }
  if (n.includes('ทิฟฟี่') || n.includes('พารา')) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80';
  }

  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
}

// Master list of 120 authentic products with prices, costs, skus, and units
const ALL_PRODUCTS = [
  // --- 1. Authentic PDF & Store Grocery List ---
  { name: "แชมพูสระผมคลินิกเคลียร์ 100g", sku: "18859333718552", price: 35, costPrice: 32, stock: 45, unit: "CAR" },
  { name: "แชมพู ซันซิล ซอฟท์ แอนด์ สมูท 700 ml (ขวด)", sku: "8850475601422", price: 139, costPrice: 136, stock: 25, unit: "CAR" },
  { name: "โลตัสไส้กรอกไก่รมควันหนังกรอบ 10pc", sku: "885111611027", price: 45, costPrice: 42, stock: 50, unit: "PC" },
  { name: "โลตัสไส้กรอกไก่รมควันหนังกรอบ 8/9", sku: "885111612024", price: 39, costPrice: 36, stock: 40, unit: "PC" },
  { name: "น้ำมันถั่วเหลืององุ่น 1 ลิตร", sku: "8850709400050", price: 55, costPrice: 52, stock: 60, unit: "PC" },
  { name: "โออิชิ กรีนที รสน้ำผึ้งผสมมะนาว 550g", sku: "8851359705021", price: 25, costPrice: 22, stock: 80, unit: "PC" },
  { name: "เซฟแพ็ค น้ำมันปาล์ม 1 ลิตร", sku: "8850709400197", price: 48, costPrice: 45, stock: 65, unit: "PC" },
  { name: "เซฟแพ็ค น้ำมันถั่วเหลือง 1 ลิตร", sku: "8850709400203", price: 52, costPrice: 49, stock: 55, unit: "PC" },
  { name: "แป้งเด็กแคร์สีฟ้า 50g", sku: "8850157400114", price: 15, costPrice: 13, stock: 70, unit: "PAC" },
  { name: "แป้งเด็กแคร์สีชมพู 50g", sku: "8850718716562", price: 15, costPrice: 13, stock: 70, unit: "PAC" },
  { name: "สบู่นกแก้ว พฤกษานกแก้ว 550ml", sku: "8851932478045", price: 89, costPrice: 86, stock: 40, unit: "PC" },
  { name: "โอเลย์ โททัล เอฟเฟ็คส์ 15ml", sku: "8851932491419", price: 99, costPrice: 96, stock: 30, unit: "PAC" },
  { name: "น้ำดื่มคริสตัล 1000cc", sku: "88543402436", price: 14, costPrice: 12, stock: 120, unit: "PC" },
  { name: "ยาสีฟันคอลเกต 70g", sku: "8858279002247", price: 29, costPrice: 26, stock: 60, unit: "PC" },
  { name: "มาม่า รสหมูสับ 150g", sku: "885933711921", price: 15, costPrice: 13, stock: 100, unit: "PC" },
  { name: "มาม่า รสต้มยำกุ้ง 150g", sku: "885933713352", price: 15, costPrice: 13, stock: 100, unit: "PC" },
  { name: "ผงซักฟอกบรีส เอกเซล 22g", sku: "4800092660979", price: 12, costPrice: 10, stock: 80, unit: "PAC" },
  { name: "แชมพูเคลียร์ ไอซ์คูล เมน 125g", sku: "8850157101646", price: 39, costPrice: 36, stock: 45, unit: "PAC" },
  { name: "ครีมอาบน้ำโชกุบุสซึ 250ml", sku: "8850228001349", price: 65, costPrice: 58, stock: 35, unit: "PAC" },
  { name: "คอลเกต แปรงสีฟัน 11g", sku: "8850267117131", price: 25, costPrice: 20, stock: 60, unit: "PAC" },
  { name: "แป้งจอห์นสัน บลอสซั่ม 11g", sku: "8850309202986", price: 20, costPrice: 17, stock: 50, unit: "PAC" },
  { name: "ยาสีฟันดาร์ลี่ 11g", sku: "8850718701872", price: 25, costPrice: 21, stock: 55, unit: "PAC" },
  { name: "ซันซิลแชมพูไข่แดง 22g", sku: "4800092660980", price: 12, costPrice: 10, stock: 75, unit: "PAC" },
  { name: "เจลล้างหน้าเคลียร์ออยล์ 125g", sku: "8850157101650", price: 69, costPrice: 66, stock: 40, unit: "PAC" },
  { name: "เพียวริคุชาขาว 350ml", sku: "8850228001350", price: 12, costPrice: 10, stock: 80, unit: "PAC" },
  { name: "แลคตาซอย 250ml", sku: "8850267117140", price: 12, costPrice: 10, stock: 90, unit: "PAC" },
  { name: "คลีนแอนด์เคลียร์ 13g", sku: "8850309202990", price: 25, costPrice: 22, stock: 65, unit: "PAC" },
  { name: "เลย์สแตคส์ 11g", sku: "8850718701880", price: 10, costPrice: 8, stock: 90, unit: "PAC" },
  { name: "เลย์สแตคส์ 25g", sku: "8850718703999", price: 20, costPrice: 17, stock: 85, unit: "PAC" },
  { name: "บิสชินเวเฟอร์ 29g", sku: "8850987351389", price: 10, costPrice: 8, stock: 70, unit: "PAC" },
  { name: "มาชิตะสาหร่ายทอดกรอบ 10g", sku: "8850999002460", price: 15, costPrice: 13, stock: 80, unit: "PAC" },
  { name: "สปอนเซอร์ 32g", sku: "8851101991535", price: 15, costPrice: 13, stock: 80, unit: "PAC" },
  { name: "โก๋แก่ถั่วลันเตา 35g", sku: "8852023664989", price: 12, costPrice: 10, stock: 75, unit: "PAC" },
  { name: "วอยซ์แครกเกอร์ 24g", sku: "8858279001950", price: 10, costPrice: 8, stock: 85, unit: "PAC" },
  { name: "มาร์วินผลไม้อบแห้ง 20g", sku: "8058815000539", price: 20, costPrice: 17, stock: 60, unit: "PAC" },
  { name: "ยูปี้กัมมี่ 15g", sku: "8992741983549", price: 10, costPrice: 8, stock: 90, unit: "PAC" },
  { name: "กาโตะน้ำผลไม้ 325ml", sku: "8850624232262", price: 15, costPrice: 13, stock: 65, unit: "PAC" },
  { name: "กาโตะน้ำผลไม้ 325ml (อีกรส)", sku: "8850624232385", price: 15, costPrice: 13, stock: 65, unit: "PAC" },
  { name: "โก๋แก่ถั่ว 75g", sku: "8852023004600", price: 22, costPrice: 19, stock: 70, unit: "PAC" },
  { name: "เลย์มันฝรั่งทอด 100g", sku: "8852099023925", price: 32, costPrice: 29, stock: 55, unit: "PC" },
  { name: "ไทยเดนมาร์ค UHT 125ml", sku: "8852537011569", price: 12, costPrice: 10, stock: 80, unit: "PAC" },
  { name: "ฟาร์มเฮ้าส์ขนมปัง 120g", sku: "8855120003309", price: 22, costPrice: 19, stock: 40, unit: "PAC" },
  { name: "ฟาร์มเฮ้าส์ขนมปัง 120g (อีกรส)", sku: "8855120003316", price: 22, costPrice: 19, stock: 40, unit: "PAC" },
  { name: "ทิพรส น้ำปลา 500ml", sku: "8858998589326", price: 28, costPrice: 25, stock: 65, unit: "PC" },
  { name: "ยูปี้กัมมี่ 30g", sku: "8992741975780", price: 15, costPrice: 13, stock: 80, unit: "PAC" },
  { name: "อัฟฟี่วาฟเฟิล 14g", sku: "8993175540360", price: 10, costPrice: 8, stock: 75, unit: "PAC" },
  { name: "ตะวันขนม 60g", sku: "8850718807963", price: 20, costPrice: 17, stock: 80, unit: "PC" },
  { name: "มาม่าหมูสับ 60g", sku: "8850987101199", price: 7, costPrice: 5, stock: 120, unit: "PAC" },
  { name: "มาม่าต้มยำกุ้ง 60g", sku: "8850987142338", price: 7, costPrice: 5, stock: 120, unit: "PAC" },
  { name: "ทาโร่ปลาสวรรค์ 20g", sku: "8852044110366", price: 20, costPrice: 17, stock: 75, unit: "PC" },
  { name: "ทิฟฟี่พาราเซตามอล 80g", sku: "885120020647", price: 18, costPrice: 15, stock: 60, unit: "PC" },
  { name: "แลคตาซอย 15g", sku: "899600153592", price: 10, costPrice: 8, stock: 80, unit: "PAC" },
  { name: "ซันซิลแชมพู 132g (ขวด)", sku: "9556121026920", price: 39, costPrice: 36, stock: 40, unit: "PC" },
  { name: "น้ำผลไม้ 55/57g", sku: "8850010101211", price: 15, costPrice: 13, stock: 70, unit: "PAC" },
  { name: "บรีสเอกเซล 60g", sku: "8850250007425", price: 15, costPrice: 13, stock: 85, unit: "PAC" },
  { name: "มาม่าคัพ 60g", sku: "8850820204728", price: 15, costPrice: 13, stock: 95, unit: "PAC" },
  { name: "เอสคิว 55g", sku: "8850987142444", price: 12, costPrice: 10, stock: 70, unit: "PAC" },
  { name: "มาม่ารสหมูสับ 60g", sku: "885087101199", price: 7, costPrice: 5, stock: 110, unit: "PAC" },
  { name: "มาม่ารสต้มยำกุ้ง 60g", sku: "885097142338", price: 7, costPrice: 5, stock: 110, unit: "PAC" },
  { name: "ทาโร่รสเข้มข้น 20g", sku: "885204410366", price: 20, costPrice: 17, stock: 70, unit: "PC" },
  { name: "เลย์สแตคส์ 15g", sku: "89960153592", price: 12, costPrice: 10, stock: 85, unit: "PAC" },
  { name: "สบู่นกแก้ว 100g", sku: "885102800711", price: 16, costPrice: 14, stock: 80, unit: "PAC" },
  { name: "โรซ่าปลากระป๋อง 155g", sku: "88520436387", price: 22, costPrice: 19, stock: 80, unit: "PC" },
  { name: "ซอสหอยนางรม 500ml", sku: "885933726291", price: 35, costPrice: 32, stock: 65, unit: "PC" },
  { name: "น้ำจิ้มสุกี้ 100ml", sku: "490243087308", price: 22, costPrice: 19, stock: 60, unit: "PAC" },
  { name: "เนสกาแฟ 200g", sku: "78851989020357", price: 89, costPrice: 86, stock: 45, unit: "PAC" },
  { name: "ทิชชู่ 1 ห่อ", sku: "8850002016620", price: 15, costPrice: 13, stock: 90, unit: "PC" },
  { name: "เลย์มันฝรั่ง 85g", sku: "8850987148899", price: 30, costPrice: 27, stock: 65, unit: "PAC" },
  { name: "ไวตามิ้ลค์ 200ml", sku: "8851028007111", price: 12, costPrice: 10, stock: 75, unit: "PC" },
  { name: "ฮานามิ 100g", sku: "8852044236387", price: 25, costPrice: 22, stock: 70, unit: "PC" },
  { name: "สิงห์น้ำดื่ม 1.5L", sku: "8859337262911", price: 15, costPrice: 13, stock: 95, unit: "PC" },

  // --- 2. Tote Sheet Items ---
  { name: "โอวัลติน 3 in 1 30gx33", sku: "8850086169908", price: 115, costPrice: 98, stock: 40, unit: "PAC", productCode: "20056698", toteCode: "TG2101003090" },
  { name: "ทอมบาร์เสื้อน้ำปลาแท้ 300ml", sku: "8850225503167", price: 25, costPrice: 22, stock: 50, unit: "PC", productCode: "20033404", toteCode: "TG2101003090" },
  { name: "ผงซักฟอกบรีสเอกเซล 75g", sku: "8850309202733", price: 15, costPrice: 12, stock: 65, unit: "PC", productCode: "20007182", toteCode: "TG2101003090" },
  { name: "ทาร์ที้ แป้งกรอบรสดั้งเดิม 57g", sku: "8850718805037", price: 20, costPrice: 17, stock: 55, unit: "PC", productCode: "20004686", toteCode: "TG2101003090" },
  { name: "ดีโด้น้ำส้ม 20% 300ml", sku: "8850952902035", price: 12, costPrice: 10, stock: 70, unit: "PAC", productCode: "20006199", toteCode: "TG2101003090" },
  { name: "บิ๊กก้า เวเฟอร์สตรอเบอร์รี่ 100g", sku: "8850987351419", price: 20, costPrice: 17, stock: 50, unit: "PC", productCode: "20006305", toteCode: "TG2101003090" },
  { name: "บราวนี่เบเกอรี่เค้กคละรส 140g", sku: "8850035805017", price: 35, costPrice: 28, stock: 40, unit: "PAC", productCode: "20006680", toteCode: "TG2101011176" },
  { name: "แมนดารินเต้าหู้ทอดปรุงรส 165/180g", sku: "8850128030067", price: 25, costPrice: 22, stock: 45, unit: "PC", productCode: "20006153", toteCode: "TG2101011176" },
  { name: "มะเขือเทศเข้มข้นหวาน 380g", sku: "8850151951018", price: 29, costPrice: 25, stock: 50, unit: "PC", productCode: "20003743", toteCode: "TG2101011176" },
  { name: "แป้งปลาหมึกอบกรอบ 18/22g", sku: "8850157401401", price: 15, costPrice: 12, stock: 60, unit: "PAC", productCode: "20004776", toteCode: "TG2101011176" },
  { name: "นมเมจิมิกซ์ปรุงอาหาร & เบเกอรี่ 360g", sku: "8850188170208", price: 32, costPrice: 28, stock: 55, unit: "PC", productCode: "20006204", toteCode: "TG2101011176" },
  { name: "เนยเค็ม ตราหมู 400g", sku: "8850250011040", price: 55, costPrice: 48, stock: 35, unit: "PAC", productCode: "20023394", toteCode: "TG2101011176" },
  { name: "ไวตามิลค์ โรสแมรี่ 36g", sku: "8850580000264", price: 15, costPrice: 12, stock: 65, unit: "PAC", productCode: "20004633", toteCode: "TG2101011176" },
  { name: "อายิโนะโมะโต๊ะ 18/16gx30", sku: "8853002305701", price: 35, costPrice: 30, stock: 60, unit: "PAC", productCode: "20030043", toteCode: "TG2101011176" },
  { name: "ครีมหมักพริกแกงส้ม 100g", sku: "8859333719187", price: 25, costPrice: 20, stock: 50, unit: "PC", productCode: "20048524", toteCode: "TG2101011176" },
  { name: "ปังไส้เผือก 35g", sku: "8859849100042", price: 12, costPrice: 10, stock: 60, unit: "PAC", productCode: "20059338", toteCode: "TG2101011176" },
  { name: "ดาวน์นี่ปรับผ้านุ่มดอกไม้แดง 460/480ml", sku: "8850309202750", price: 65, costPrice: 55, stock: 45, unit: "PC", productCode: "20007190", toteCode: "TG2101020993" },
  { name: "บรีสเอกเซลสูตรเข้มข้น 130/140g", sku: "8850309202760", price: 35, costPrice: 29, stock: 50, unit: "PC", productCode: "20007195", toteCode: "TG2101020993" },

  // --- 3. Key Core Products (including Promotional items) ---
  { name: "ข้าวหอมมะลิ 5kg", sku: "8850233880342", price: 229, costPrice: 199, stock: 50, unit: "PAC" },
  { name: "น้ำตาลทราย 1kg", sku: "885000201620", price: 27, costPrice: 24, stock: 80, unit: "PC" },
  { name: "ปุ้มปุ้ยหอยลายทอดเผ็ด 40g", sku: "8850151110022", price: 32, costPrice: 29, stock: 75, unit: "PAC" },
  { name: "ไฮเบบี้เดย์แพ้นท์ M15", sku: "8850151110033", price: 79, costPrice: 69, stock: 40, unit: "PAC" },
  { name: "ดีโด้ เครื่องดื่มน้ำผลไม้ รสสตรอเบอร์รี่", sku: "8850952902042", price: 10, costPrice: 8, stock: 90, unit: "PC" },
  { name: "ไลฟ์รี่ผ้าอ้อมกางเกงซึมซับสวมสบาย L10pc", sku: "8850151110044", price: 189, costPrice: 165, stock: 35, unit: "PAC" },
  { name: "ไฮเตอร์คัลเลอร์ชนิดน้ำกลิ่นสวีทฟลอรัล ขนาด 500 มล", sku: "8850151110055", price: 45, costPrice: 38, stock: 50, unit: "PC" },
  { name: "โอวัลติน 100g", sku: "4902430748308", price: 45, costPrice: 38, stock: 60, unit: "PAC" },

  // --- 4. Additional Pantry & Household Items ---
  { name: "มันฝรั่งทอดกรอบ รสสาหร่าย 50g", sku: "SNK-001", price: 20, costPrice: 15, stock: 60, unit: "PC" },
  { name: "คุกกี้สอดไส้ช็อกโกแลต (กล่อง)", sku: "SNK-002", price: 35, costPrice: 26, stock: 45, unit: "PC" },
  { name: "น้ำดื่มบริสุทธิ์ 600ml (แพ็ค 12)", sku: "WTR-001", price: 55, costPrice: 42, stock: 90, unit: "PAC" },
  { name: "น้ำแร่ธรรมชาติ 1.5 ลิตร (แพ็ค 6)", sku: "WTR-002", price: 79, costPrice: 60, stock: 40, unit: "PAC" },
  { name: "น้ำปลาแท้ ขวดใหญ่ 700ml", sku: "CND-001", price: 32, costPrice: 25, stock: 120, unit: "PC" },
  { name: "ซีอิ๊วขาวเห็ดหอม 600ml", sku: "CND-002", price: 42, costPrice: 33, stock: 80, unit: "PC" },
  { name: "น้ำมันหอยปรุงรส 640g", sku: "CND-003", price: 48, costPrice: 38, stock: 75, unit: "PC" },
  { name: "บะหมี่กึ่งสำเร็จรูป รสต้มยำกุ้ง (แพ็ค 10)", sku: "NDL-001", price: 65, costPrice: 52, stock: 100, unit: "PAC" },
  { name: "บะหมี่รสหมูสับ น้ำใส (แพ็ค 10)", sku: "NDL-002", price: 65, costPrice: 52, stock: 85, unit: "PAC" },
  { name: "ผงซักฟอก สูตรเข้มข้น 1000g", sku: "DET-001", price: 89, costPrice: 70, stock: 50, unit: "PC" },
  { name: "น้ำยาปรับผ้านุ่ม กลิ่นดอกไม้หอม 500ml", sku: "DET-002", price: 25, costPrice: 18, stock: 90, unit: "PC" },
  { name: "สบู่ก้อนสมุนไพรธรรมชาติ (แพ็ค 4)", sku: "SOAP-001", price: 48, costPrice: 36, stock: 65, unit: "PAC" },
  { name: "ครีมอาบน้ำกลิ่นกุหลาบ 450ml", sku: "SOAP-002", price: 99, costPrice: 75, stock: 35, unit: "PC" },
  { name: "นมโคสดแท้ 100% UHT 225ml (แพ็ค 6)", sku: "MLK-001", price: 68, costPrice: 55, stock: 70, unit: "PAC" },
  { name: "นมถั่วเหลือง รสหวาน 250ml (แพ็ค 6)", sku: "MLK-002", price: 54, costPrice: 42, stock: 60, unit: "PAC" },
  { name: "แชมพูสระผม ขนาด 450ml", sku: "PRS-001", price: 129, costPrice: 100, stock: 40, unit: "PC" },
  { name: "สำลีก้านบริสุทธิ์ (กล่อง 100 ก้าน)", sku: "PRS-002", price: 25, costPrice: 16, stock: 110, unit: "PC" },
  { name: "ครีมกันแดดเนื้อบางเบา SPF50+ 50ml", sku: "CRM-001", price: 199, costPrice: 150, stock: 30, unit: "PC" },
  { name: "โลชั่นบำรุงผิวกายเพื่อผิวชุ่มชื้น 400ml", sku: "CRM-002", price: 149, costPrice: 110, stock: 45, unit: "PC" },
  { name: "อาหารสุนัขโต รสเนื้อวัว 1.5kg", sku: "PET-001", price: 145, costPrice: 115, stock: 25, unit: "PAC" },
  { name: "อาหารแมวสำเร็จรูป รสปลาทู 1.2kg", sku: "PET-002", price: 139, costPrice: 110, stock: 30, unit: "PAC" },
  { name: "ข้าวหอมมะลิ 100% (5 กก.)", sku: "RCE-001", price: 215, costPrice: 190, stock: 30, unit: "PAC" },
  { name: "ข้าวเหนียวเขี้ยวงู (1 กก.)", sku: "RCE-002", price: 45, costPrice: 36, stock: 50, unit: "PAC" },
  { name: "กาแฟปรุงสำเร็จ 3in1 (แพ็ค 25 ซอง)", sku: "DRK-001", price: 95, costPrice: 76, stock: 80, unit: "PAC" },
  { name: "ชาเขียวพร้อมดื่ม 500ml", sku: "DRK-002", price: 20, costPrice: 14, stock: 100, unit: "PC" },
  { name: "ยาสีฟันสมุนไพรเข้มข้น 160g", sku: "TP-001", price: 59, costPrice: 44, stock: 75, unit: "PC" },
  { name: "แปรงสีฟันขนนุ่มพิเศษ (แพ็ค 3 ด้าม)", sku: "TP-002", price: 49, costPrice: 35, stock: 65, unit: "PAC" },
  { name: "ปลากระป๋องในซอสมะเขือเทศ (แพ็ค 10)", sku: "CAN-001", price: 165, costPrice: 135, stock: 50, unit: "PAC" },
  { name: "เงาะสอดไส้สับปะรดในน้ำเชื่อม กระป๋อง", sku: "CAN-002", price: 49, costPrice: 38, stock: 40, unit: "PC" },
  { name: "น้ำมันพืชปาล์ม 1 ลิตร", sku: "HSE-001", price: 45, costPrice: 38, stock: 100, unit: "PC" },
  { name: "น้ำยาล้างจาน สูตรเข้มข้น 800ml", sku: "HSE-002", price: 32, costPrice: 24, stock: 95, unit: "PC" },
];

function generateCuid() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return 'cm' + timestamp + random;
}

// Transaction
const runTx = db.transaction(() => {
  // 1. Ensure categories exist and get map
  const catMap = {};
  const selectCat = db.prepare('SELECT id, name FROM Category WHERE name = ?');
  const insertCat = db.prepare('INSERT INTO Category (id, name, image) VALUES (?, ?, ?)');
  const updateCat = db.prepare('UPDATE Category SET image = ? WHERE id = ?');

  for (const cat of CATEGORIES) {
    const existing = selectCat.get(cat.name);
    if (existing) {
      updateCat.run(cat.image, existing.id);
      catMap[cat.name] = existing.id;
    } else {
      const id = generateCuid();
      insertCat.run(id, cat.name, cat.image);
      catMap[cat.name] = id;
    }
  }

  // 2. Clear old promotions and products cleanly
  db.prepare('DELETE FROM Promotion').run();
  db.prepare('DELETE FROM Product').run();

  // 3. Insert all products
  const insertProduct = db.prepare(`
    INSERT INTO Product (
      id, sku, name, description, price, costPrice, image, stock, minStock, status,
      categoryId, productCode, unit, toteCode, createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, datetime('now'), datetime('now')
    )
  `);

  const insertedProducts = {};
  let pCount = 0;

  for (const p of ALL_PRODUCTS) {
    const id = generateCuid();
    const catName = getCategoryForProduct(p.name);
    const catId = catMap[catName] || catMap["ของใช้ในบ้าน"];
    const imgUrl = getImageForProduct(p.name);
    const sku = p.sku || `SKU-${pCount + 1000}`;

    insertProduct.run(
      id,
      sku,
      p.name,
      p.name,
      p.price,
      p.costPrice || (p.price - 3),
      imgUrl,
      p.stock || 50,
      5,
      'ACTIVE',
      catId,
      p.productCode || null,
      p.unit || 'PC',
      p.toteCode || null
    );

    insertedProducts[p.name] = { id, ...p };
    pCount++;
  }

  console.log(` Successfully inserted ${pCount} real products with authentic images and categories!`);

  // 4. Seed promotions
  const PROMOTIONS_CONFIG = [
    {
      productName: 'ปุ้มปุ้ยหอยลายทอดเผ็ด 40g',
      name: 'ซื้อ 1 แถม 1 สุดคุ้ม',
      type: 'BUY_1_GET_1',
      discountPrice: null,
      badgeText: 'ซื้อ 1 แถม 1',
      description: 'ซื้อปุ้มปุ้ยหอยลายทอดเผ็ด 1 ชิ้น แถมฟรีอีก 1 ชิ้นทันที',
      isActive: 1,
    },
    {
      productName: 'น้ำตาลทราย 1kg',
      name: 'ซื้อ 2 แถม 1 หวานชื่นใจ',
      type: 'BUY_2_GET_1',
      discountPrice: null,
      badgeText: 'ซื้อ 2 แถม 1',
      description: 'ซื้อน้ำตาลทราย 1kg ครบ 2 ชิ้น รับฟรีทันทีอีก 1 ชิ้น',
      isActive: 1,
    },
    {
      productName: 'ข้าวหอมมะลิ 5kg',
      name: 'ข้าวหอมมะลิลดกระหน่ำ',
      type: 'DISCOUNT',
      discountPrice: 199.0,
      badgeText: 'ลด ฿30',
      description: 'ข้าวหอมมะลิคุณภาพ 5kg ลดกระหน่ำเหลือ ฿199 (ปกติ ฿229)',
      isActive: 1,
    },
    {
      productName: 'ไฮเบบี้เดย์แพ้นท์ M15',
      name: 'ลดราคาพิเศษ ไฮเบบี้เดย์แพ้นท์',
      type: 'DISCOUNT',
      discountPrice: 69.0,
      badgeText: 'ลดราคาพิเศษ',
      description: 'ผ้าอ้อมไฮเบบี้เดย์แพ้นท์ ลดพิเศษเหลือเพียง ฿69 (ปกติ ฿79)',
      isActive: 1,
    },
    {
      productName: 'มาม่าหมูสับ 60g',
      name: 'มาม่าซื้อ 1 แถม 1',
      type: 'BUY_1_GET_1',
      badgeText: 'ซื้อ 1 แถม 1',
      description: 'มาม่าหมูสับยอดฮิต ซื้อ 1 ชิ้น แถม 1 ชิ้นทันที',
      isActive: 1,
    },
    {
      productName: 'โออิชิ กรีนที รสน้ำผึ้งผสมมะนาว 550g',
      name: 'โออิชิ ซื้อ 2 แถม 1',
      type: 'BUY_2_GET_1',
      badgeText: 'ซื้อ 2 แถม 1',
      description: 'สดชื่นจุใจ ซื้อโออิชิ 2 ขวด แถมฟรี 1 ขวด',
      isActive: 1,
    },
    {
      productName: 'สบู่นกแก้ว พฤกษานกแก้ว 550ml',
      name: 'สบู่นกแก้วลดพิเศษ',
      type: 'DISCOUNT',
      discountPrice: 75.0,
      badgeText: 'ลด ฿14',
      description: 'ครีมอาบน้ำพฤกษานกแก้วหอมสดชื่น ลดเหลือ ฿75 (ปกติ ฿89)',
      isActive: 1,
    },
  ];

  const insertPromo = db.prepare(`
    INSERT INTO Promotion (
      id, name, type, discountPrice, discountPercent, badgeText, description, isActive,
      productId, createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, datetime('now'), datetime('now')
    )
  `);

  let promoCount = 0;
  for (const cfg of PROMOTIONS_CONFIG) {
    const prod = insertedProducts[cfg.productName];
    if (prod) {
      const promoId = generateCuid();
      insertPromo.run(
        promoId,
        cfg.name,
        cfg.type,
        cfg.discountPrice,
        null,
        cfg.badgeText,
        cfg.description,
        cfg.isActive,
        prod.id
      );
      promoCount++;
      console.log(` Created Promotion: [${cfg.type}] "${cfg.name}" for "${cfg.productName}"`);
    } else {
      console.warn(` Promotion target product not found: ${cfg.productName}`);
    }
  }

  console.log(`\n Total ${promoCount} active promotions seeded successfully!`);
});

runTx();

console.log("\nDatabase verification:");
console.log("- Total Categories:", db.prepare("SELECT count(*) as count FROM Category").get().count);
console.log("- Total Products:", db.prepare("SELECT count(*) as count FROM Product").get().count);
console.log("- Total Promotions:", db.prepare("SELECT count(*) as count FROM Promotion").get().count);
console.log("- Admin intact:", db.prepare("SELECT id, username, phone, address FROM Admin").all());
