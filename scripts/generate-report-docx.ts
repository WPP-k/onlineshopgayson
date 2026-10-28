import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber
} from 'docx';

const FONT_TH = 'TH Sarabun New';
const COLOR_PRIMARY = '0B3C5D'; // กรมท่าเข้ม
const COLOR_SECONDARY = '328CC1'; // น้ำเงินฟ้า
const COLOR_TEXT = '1D2731'; // ดำเทาเข้ม
const COLOR_LIGHT_BG = 'F4F7F6';

function createHeading1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 140 },
    children: [
      new TextRun({
        text,
        font: FONT_TH,
        size: 36, // 18pt
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function createHeading2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text,
        font: FONT_TH,
        size: 32, // 16pt
        bold: true,
        color: COLOR_SECONDARY,
      }),
    ],
  });
}

function createHeading3(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 80 },
    children: [
      new TextRun({
        text,
        font: FONT_TH,
        size: 28, // 14pt
        bold: true,
        color: COLOR_TEXT,
      }),
    ],
  });
}

function createBodyP(text: string, options: { bold?: boolean; indent?: number; bullet?: boolean } = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 280 },
    indent: options.indent ? { left: options.indent } : undefined,
    bullet: options.bullet ? { level: 0 } : undefined,
    children: [
      new TextRun({
        text,
        font: FONT_TH,
        size: 28, // 14pt / 16pt TH Sarabun New standard
        bold: options.bold,
        color: COLOR_TEXT,
      }),
    ],
  });
}

function createTableHeaderCell(text: string, widthPercent: number) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: '0B3C5D' },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            font: FONT_TH,
            size: 26,
            bold: true,
            color: 'FFFFFF',
          }),
        ],
      }),
    ],
  });
}

function createTableCell(text: string, widthPercent: number, align: any = AlignmentType.LEFT, isEven: boolean = false) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: isEven ? { type: ShadingType.CLEAR, fill: 'F9FAFB' } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text,
            font: FONT_TH,
            size: 24,
            color: COLOR_TEXT,
          }),
        ],
      }),
    ],
  });
}

async function generateReportDocx() {
  const doc = new Document({
    creator: 'RMUTL Smart Shop Project',
    title: 'รายงานโครงงานระบบจัดการร้านค้าออนไลน์และตรวจรับสินค้าคลังสินค้าอัจฉริยะ',
    description: 'เอกสารรูปเล่มโครงงานฉบับสมบูรณ์ 5 บท',
    styles: {
      default: {
        document: {
          run: {
            font: FONT_TH,
            size: 28,
            color: COLOR_TEXT,
          },
        },
      },
    },
    sections: [
      // Section 1: ปกและบทคัดย่อ
      {
        properties: {},
        children: [
          new Paragraph({ spacing: { before: 600, after: 200 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'รายงานโครงงานวิจัยและพัฒนาระบบ',
                font: FONT_TH,
                size: 40,
                bold: true,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 300 },
            children: [
              new TextRun({
                text: 'ระบบจัดการร้านค้าออนไลน์ การตรวจรับสินค้าผ่านเครื่อง Handheld และระบบกระจายสินค้าไรเดอร์',
                font: FONT_TH,
                size: 34,
                bold: true,
                color: COLOR_SECONDARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 600 },
            children: [
              new TextRun({
                text: '(Smart Retail, Handheld Tote Inspection & Rider Fulfillment Platform)',
                font: FONT_TH,
                size: 28,
                italics: true,
                color: '666666',
              }),
            ],
          }),
          new Paragraph({ spacing: { before: 800, after: 800 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 100 },
            children: [
              new TextRun({
                text: 'จัดทำโดย',
                font: FONT_TH,
                size: 30,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'คณะผู้จัดทำโครงงานระบบสารสนเทศและการพาณิชย์อิเล็กทรอนิกส์',
                font: FONT_TH,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 400 },
            children: [
              new TextRun({
                text: 'มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา (RMUTL)',
                font: FONT_TH,
                size: 28,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 100 },
            children: [
              new TextRun({
                text: 'รายงานนี้เป็นส่วนหนึ่งของการศึกษาวิชาโครงงานคอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
                font: FONT_TH,
                size: 26,
                color: '555555',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'ปีการศึกษา 2568 - 2569',
                font: FONT_TH,
                size: 26,
                bold: true,
              }),
            ],
          }),

          // หน้าถัดไป: บทคัดย่อ
          new Paragraph({ pageBreakBefore: true }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({
                text: 'บทคัดย่อ',
                font: FONT_TH,
                size: 36,
                bold: true,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          createBodyP(
            'โครงงานนี้มีวัตถุประสงค์เพื่อออกแบบและพัฒนาระบบร้านค้าออนไลน์และบริหารจัดการคลังสินค้าแบบครบวงจร (Omnichannel Retail & Warehouse Fulfillment) เพื่อแก้ไขปัญหาความผิดพลาดในการรับ-จ่ายสินค้า การตรวจนับสต็อกที่ล่าช้า และการประสานงานขนส่งสินค้าที่ไม่เป็นระบบ โดยพัฒนาระบบบนพื้นฐานเทคโนโลยีสมัยใหม่ Next.js App Router (Full-stack TypeScript), Prisma ORM, ฐานข้อมูล SQLite (Better-SQLite3) ร่วมกับสถาปัตยกรรม UI ยุคใหม่ Tailwind CSS'
          ),
          createBodyP(
            'ระบบประกอบด้วย 4 โมดูลหลักที่ทำงานสอดประสานกันอย่างเป็นเอกภาพ ได้แก่: (1) ระบบหน้าร้านค้าออนไลน์ (E-Commerce Storefront) สำหรับลูกค้าในการเลือกซื้อสินค้า จัดการตะกร้าสินค้า ชำระเงิน และติดตามสถานะคำสั่งซื้อ, (2) ระบบจัดการหลังบ้านของผู้ดูแลระบบ (Admin Dashboard) สำหรับควบคุมสต็อกสินค้า หมวดหมู่ แบนเนอร์ ผู้ใช้งาน และจัดสรรงานส่งสินค้า, (3) ระบบตรวจรับสินค้าและตรวจสอบความถูกต้องด้วยเครื่อง Handheld Terminal จำลองผ่านเว็บ (Handheld Tote Verification) รองรับการตรวจรับสินค้าที่จัดส่งมาในกล่อง Tote ใบส่งของ สแกนบาร์โค้ด และตรวจสอบความถูกต้องของสินค้าแบบ Real-time, และ (4) ระบบจอหน้าร้าน / iPad Fulfillment และพอร์ทัลไรเดอร์ขนส่ง (Rider Dispatch & Tracking) แสดงบาร์โค้ดสินค้าในออเดอร์เพื่อสแกนตัดสต็อกหน้าร้านและให้ไรเดอร์อัปเดตสถานะการนำจ่ายสินค้า'
          ),
          createBodyP(
            'ผลการทดสอบระบบพบว่า สามารถนำเข้าและประมวลผลข้อมูลสินค้าจริงมากกว่า 119 รายการ พร้อมรองรับใบส่งของ Tote จากเอกสาร PDF เข้าสู่ระบบฐานข้อมูลได้อย่างถูกต้อง 100% การสแกนบาร์โค้ดผ่านระบบ Handheld สามารถแจ้งเตือนสินค้าไม่ตรงรายการและอัปเดตจำนวนสินค้าที่ตรวจรับได้แม่นยำ ช่วยลดระยะเวลาและข้อผิดพลาดในการตรวจสอบคลังสินค้าได้อย่างมีนัยสำคัญ'
          ),

          // สารบัญ
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('สารบัญ (Table of Contents)'),
          createBodyP('บทที่ 1 บทนำ .............................................................................................................................. 1'),
          createBodyP('   1.1 ความเป็นมาและความสำคัญของปัญหา ............................................................................ 1'),
          createBodyP('   1.2 วัตถุประสงค์ของโครงงาน ................................................................................................ 1'),
          createBodyP('   1.3 ขอบเขตของโครงงาน ....................................................................................................... 2'),
          createBodyP('   1.4 ประโยชน์ที่คาดว่าจะได้รับ ................................................................................................ 2'),
          createBodyP('บทที่ 2 ทฤษฎีและเทคโนโลยีที่เกี่ยวข้อง ................................................................................... 3'),
          createBodyP('   2.1 สถาปัตยกรรม Next.js App Router และ React Server Components ................................. 3'),
          createBodyP('   2.2 การจัดการฐานข้อมูลด้วย Prisma ORM และ SQLite ........................................................... 3'),
          createBodyP('   2.3 การจัดการสถานะฝั่ง Client ด้วย Zustand ........................................................................ 4'),
          createBodyP('   2.4 เทคโนโลยีบาร์โค้ด (JsBarcode) และการตรวจรับสินค้าในคลังสินค้า (Tote Receiving) ............ 4'),
          createBodyP('บทที่ 3 การวิเคราะห์และออกแบบระบบ ................................................................................... 5'),
          createBodyP('   3.1 ผังการทำงานของระบบ (System Architecture & Data Flow) .............................................. 5'),
          createBodyP('   3.2 การออกแบบโครงสร้างฐานข้อมูล (Entity Relationship & Database Schema) ....................... 6'),
          createBodyP('   3.3 การออกแบบส่วนติดต่อผู้ใช้งาน (UI/UX Design) ................................................................. 8'),
          createBodyP('บทที่ 4 การพัฒนาและการทำงานของระบบ ............................................................................... 9'),
          createBodyP('   4.1 การทำงานของโมดูลหน้าร้านค้าออนไลน์ (E-Commerce Web Application) .......................... 9'),
          createBodyP('   4.2 การทำงานของโมดูลเครื่องสแกนตรวจรับ Tote (Handheld Terminal) ................................... 10'),
          createBodyP('   4.3 การทำงานของโมดูลจัดการคำสั่งซื้อหน้าร้าน (Store Fulfillment) .......................................... 11'),
          createBodyP('   4.4 การทำงานของโมดูลไรเดอร์และการจัดส่ง (Rider Delivery Portal) ..................................... 12'),
          createBodyP('   4.5 การทำงานของระบบผู้ดูแลระบบ (Admin Dashboard) ......................................................... 13'),
          createBodyP('บทที่ 5 สรุปผลการดำเนินงาน ปัญหา และข้อเสนอแนะ ............................................................ 14'),
          createBodyP('   5.1 สรุปผลการพัฒนาโครงงาน .............................................................................................. 14'),
          createBodyP('   5.2 ปัญหาและอุปสรรคในการพัฒนา ..................................................................................... 14'),
          createBodyP('   5.3 แนวทางการพัฒนาต่อยอดในอนาคต ................................................................................ 15'),

          // บทที่ 1
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('บทที่ 1: บทนำ'),
          createHeading2('1.1 ความเป็นมาและความสำคัญของปัญหา'),
          createBodyP(
            'ในยุคเศรษฐกิจดิจิทัล (Digital Economy) ธุรกิจค้าปลีกและการจัดจำหน่ายสินค้าอุปโภคบริโภคจำเป็นต้องปรับตัวเข้าสู่รูปแบบ Omnichannel ที่เชื่อมโยงการขายหน้าร้านและการขายผ่านช่องทางออนไลน์เข้าด้วยกัน อย่างไรก็ตาม ธุรกิจร้านค้าปลีกและซูเปอร์มาร์เก็ตขนาดกลางและขนาดย่อมมักประสบปัญหาสำคัญในกระบวนการซัพพลายเชนและคลังสินค้า ได้แก่:'
          ),
          createBodyP('1. ความผิดพลาดในการตรวจรับสินค้าเข้าคลัง (Inbound Receiving Error): สินค้าที่ส่งมาจากศูนย์กระจายสินค้ามักบรรจุมาในกล่อง Tote พร้อมใบรายการสินค้า (Delivery Note) พนักงานตรวจนับด้วยสายตาและกระดาษ ซึ่งเกิดข้อผิดพลาดได้ง่ายและใช้เวลานาน', { indent: 400 }),
          createBodyP('2. ข้อมูลสต็อกไม่ตรงตามเวลาจริง (Stock Inconsistency): เมื่อมีการสั่งซื้อผ่านระบบออนไลน์ หากไม่มีการตัดสต็อกสินค้าหรือตรวจรับสินค้าเข้าสู่ระบบแบบอัตโนมัติ จะทำให้เกิดปัญหาสินค้าหมดแต่ยังเปิดขายได้', { indent: 400 }),
          createBodyP('3. ความล่าช้าในกระบวนการจัดเตรียมสินค้า (Store Fulfillment Bottleneck): พนักงานหน้าร้านต้องค้นหาสินค้าตามออเดอร์โดยไม่มีตัวช่วยระบุบาร์โค้ดหรือตำแหน่งสินค้า ทำให้เสียเวลาในการหยิบสินค้า', { indent: 400 }),
          createBodyP('4. ขาดระบบบริหารจัดการและจ่ายงานไรเดอร์ (Rider Dispatching): การจัดส่งสินค้าถึงมือลูกค้าขาดการติดตามสถานะ ทำให้ลูกค้าและผู้ดูแลระบบไม่ทราบตำแหน่งและสถานะของสินค้าแบบปัจจุบัน', { indent: 400 }),
          createBodyP(
            'จากปัญหาดังกล่าว ผู้จัดทำจึงได้พัฒนา "ระบบจัดการร้านค้าออนไลน์ การตรวจรับสินค้าผ่านเครื่อง Handheld และระบบกระจายสินค้าไรเดอร์" ขึ้น เพื่อเป็นโซลูชันที่ครอบคลุมตั้งแต่การตรวจรับสินค้าจากศูนย์กระจายสินค้า การบริหารสต็อก การขายหน้าร้านออนไลน์ ไปจนถึงการกระจายสินค้าส่งถึงมือผู้บริโภค'
          ),

          createHeading2('1.2 วัตถุประสงค์ของโครงงาน'),
          createBodyP('1. เพื่อออกแบบและพัฒนาระบบร้านค้าออนไลน์ (E-Commerce Web Application) ที่รองรับการสั่งซื้อสินค้า ตรวจสอบสินค้าในสต็อก และการชำระเงินที่สะดวก รวดเร็ว', { bullet: true }),
          createBodyP('2. เพื่อพัฒนาระบบเครื่อง Handheld Terminal จำลอง สำหรับพนักงานคลังสินค้าในการสแกนบาร์โค้ดและตรวจนับสินค้าในกล่อง Tote เทียบกับใบส่งของอย่างแม่นยำ', { bullet: true }),
          createBodyP('3. เพื่อพัฒนาระบบจอแสดงผลการจัดเตรียมสินค้าหน้าร้าน (Store Fulfillment / iPad Screen) พร้อมสร้างบาร์โค้ดอัตโนมัติสำหรับสแกนตัดสต็อกได้อย่างมีประสิทธิภาพ', { bullet: true }),
          createBodyP('4. เพื่อพัฒนาระบบพอร์ทัลไรเดอร์ (Rider Delivery Portal) สำหรับมอบหมายงาน จัดการสถานะการจัดส่ง และยืนยันการส่งมอบสินค้า', { bullet: true }),
          createBodyP('5. เพื่อพัฒนาระบบบริหารจัดการหลังบ้าน (Admin Dashboard) สำหรับติดตามภาพรวมยอดขาย สต็อกสินค้า สมาชิก และข้อมูลระบบแบบ Real-time', { bullet: true }),

          createHeading2('1.3 ขอบเขตของโครงงาน'),
          createHeading3('1.3.1 ด้านระบบหน้าร้านค้าออนไลน์ (Client Application)'),
          createBodyP('- รองรับการสมัครสมาชิกและเข้าสู่ระบบด้วย JWT Token และเก็บข้อมูล Session', { bullet: true }),
          createBodyP('- แสดงรายการสินค้า แบนเนอร์โปรโมชั่น และแยกหมวดหมู่สินค้าอย่างชัดเจน', { bullet: true }),
          createBodyP('- ค้นหาสินค้าตามชื่อ รหัสสินค้า หรือหมวดหมู่ได้แบบทันที (Instant Search)', { bullet: true }),
          createBodyP('- ระบบตะกร้าสินค้า (Shopping Cart) พร้อมคำนวณราคายอดรวมอัตโนมัติผ่าน Zustand Store', { bullet: true }),
          createBodyP('- ระบบเช็คเอาท์ เลือกรูปแบบการจัดส่ง (ส่งถึงบ้าน Delivery หรือ รับที่ร้าน Pickup) และเลือกช่องทางชำระเงิน (เงินสด, พร้อมเพย์ QR Code, โอนเงิน)', { bullet: true }),

          createHeading3('1.3.2 ด้านระบบตรวจรับคลังสินค้า (Handheld Terminal Module)'),
          createBodyP('- จำลองหน้าจออินเทอร์เฟซของเครื่อง Mobile Handheld Computer ที่เหมาะสมกับการทำงานบนอุปกรณ์เคลื่อนที่', { bullet: true }),
          createBodyP('- เลือกรหัส Tote เพื่อเปิดรายการสินค้าที่ต้องตรวจรับตามใบส่งของ', { bullet: true }),
          createBodyP('- ช่องกรอก/ยิงสแกนเนอร์บาร์โค้ดสินค้า (Barcode Scanner Input) โดยตรวจเช็คความถูกต้องทันที', { bullet: true }),
          createBodyP('- ตรวจสอบกรณีสแกนบาร์โค้ดถูกต้อง (เพิ่มจำนวนรับจริง) และกรณีสแกนผิดรายการ (แจ้งเตือน Invalid Barcode)', { bullet: true }),
          createBodyP('- ระบบยืนยันการรับครบถ้วนและอัปเดตสต็อกสินค้าหลักอัตโนมัติ', { bullet: true }),

          createHeading3('1.3.3 ด้านระบบจัดเตรียมสินค้าหน้าร้าน (Store Fulfillment / iPad Module)'),
          createBodyP('- แสดงรายการออเดอร์ใหม่ที่ต้องจัดเตรียมสินค้าแบบ Card View', { bullet: true }),
          createBodyP('- แสดงรายการสินค้าแต่ละชิ้นพร้อมสร้างบาร์โค้ด (Barcode Code128) อัตโนมัติด้วย JsBarcode เพื่อให้พนักงานยิงเครื่องสแกนตัดจ่าย', { bullet: true }),
          createBodyP('- ปรับสถานะคำสั่งซื้อจาก รอดำเนินการ -> กำลังจัดเตรียม -> พร้อมจัดส่ง/รอรับ', { bullet: true }),

          createHeading3('1.3.4 ด้านระบบพอร์ทัลไรเดอร์ (Rider Delivery Module)'),
          createBodyP('- แสดงรายการข้อมูลไรเดอร์ สถานะความพร้อม (AVAILABLE, BUSY, OFFLINE) และข้อมูลยานพาหนะ', { bullet: true }),
          createBodyP('- แสดงคำสั่งซื้อที่จัดส่งแบบ Delivery ที่รอจัดสรรหรือกำลังนำจ่าย', { bullet: true }),
          createBodyP('- ไรเดอร์สามารถรับงาน อัปเดตสถานะเป็น "กำลังจัดส่ง (DELIVERING)" และ "ส่งมอบสำเร็จ (DELIVERED)"', { bullet: true }),

          createHeading3('1.3.5 ด้านระบบผู้ดูแลระบบ (Admin Dashboard)'),
          createBodyP('- แดชบอร์ดสรุปยอดขายรวม จำนวนออเดอร์ ยอดสต็อกคงเหลือ และกราฟิกสถิติ', { bullet: true }),
          createBodyP('- ระบบจัดการสินค้า (เพิ่ม, แก้ไข, ลบ, ปรับสต็อก, นำเข้ารหัส SKU/Tote)', { bullet: true }),
          createBodyP('- ระบบจัดการหมวดหมู่สินค้าและแบนเนอร์โฆษณา', { bullet: true }),
          createBodyP('- ระบบจัดการผู้ใช้งาน (User & Admin Management)', { bullet: true }),

          createHeading2('1.4 ประโยชน์ที่คาดว่าจะได้รับ'),
          createBodyP('1. ช่วยลดความผิดพลาดในการตรวจรับสินค้าเข้าคลังได้มากกว่า 90% จากการใช้ระบบตรวจสอบบาร์โค้ด', { bullet: true }),
          createBodyP('2. ลดระยะเวลาในการจัดเตรียมสินค้าหน้าร้านด้วยการใช้จอ Fulfillment และการสแกนบาร์โค้ด', { bullet: true }),
          createBodyP('3. เพิ่มประสิทธิภาพในการบริหารจัดการขนส่งและกระจายสินค้าด้วยระบบพอร์ทัลไรเดอร์', { bullet: true }),
          createBodyP('4. ลูกค้าได้รับประสบการณ์การสั่งซื้อสินค้าออนไลน์ที่รวดเร็ว แม่นยำ และตรวจสอบสถานะได้โปร่งใส', { bullet: true }),
          createBodyP('5. ธุรกิจมีข้อมูลสถิติยอดขายและสต็อกสินค้าที่ถูกต้องสำหรับใช้วางแผนการสั่งซื้อในอนาคต', { bullet: true }),

          // บทที่ 2
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('บทที่ 2: ทฤษฎีและเทคโนโลยีที่เกี่ยวข้อง'),
          createHeading2('2.1 สถาปัตยกรรม Next.js App Router และ React Server Components'),
          createBodyP(
            'โครงงานนี้เลือกใช้เฟรมเวิร์ก Next.js เวอร์ชัน 16 (ร่วมกับ React 19) ซึ่งเป็นเทคโนโลยีระดับแนวหน้าในการพัฒนาเว็บแอปพลิเคชันยุคใหม่ โดยใช้สถาปัตยกรรม App Router ที่รองรับ React Server Components (RSC):'
          ),
          createBodyP('- การเรนเดอร์ฝั่งเซิร์ฟเวอร์ (Server-Side Rendering): ช่วยให้การดึงข้อมูลสินค้าและออเดอร์ทำได้รวดเร็ว ลดภาระของอุปกรณ์ผู้ใช้งาน และรองรับ SEO อย่างสมบูรณ์', { indent: 400 }),
          createBodyP('- Server Actions: การติดต่อสื่อสารระหว่างหน้าเว็บกับฐานข้อมูลทำผ่านฟังก์ชัน Server Actions โดยตรง ลดความซับซ้อนของการเขียน REST API แยกไฟล์แบบดั้งเดิม และมีความปลอดภัยสูง', { indent: 400 }),
          createBodyP('- Client Components: เลือกใช้งานเฉพาะคอมโพเนนต์ที่มีการโต้ตอบกับผู้ใช้ เช่น การยิงสแกนเนอร์บาร์โค้ด การกดปุ่มเพิ่มลงตะกร้า ทำให้ขนาดไฟล์ JavaScript ที่ส่งไปยังบราวเซอร์มีขนาดเล็กมาก', { indent: 400 }),

          createHeading2('2.2 การจัดการฐานข้อมูลด้วย Prisma ORM และ Better-SQLite3'),
          createBodyP(
            'Prisma ORM (Object-Relational Mapping) เวอร์ชัน 7 ถูกนำมาใช้เป็นสะพานเชื่อมต่อระหว่าง TypeScript และฐานข้อมูล SQLite ซึ่งมีข้อดีที่โดดเด่น:'
          ),
          createBodyP('- Type Safety: Prisma สร้าง Type Definition ของโมเดลข้อมูลให้อัตโนมัติ ทำให้การเขียนโค้ดไม่เกิดข้อผิดพลาดจากชื่อคอลัมน์หรือชนิดข้อมูลที่ผิดเพี้ยน', { indent: 400 }),
          createBodyP('- Prisma Client Adapter: ใช้งานร่วมกับ @prisma/adapter-better-sqlite3 ช่วยให้การอ่านและเขียนข้อมูลใน SQLite ทำงานได้อย่างรวดเร็วในระดับ C++ Native Binding ไม่ต้องพึ่งพาระบบจัดการฐานข้อมูลภายนอกที่ซับซ้อน เหมาะแก่การรันระบบแบบ On-premise หรืออุปกรณ์ขนาดเล็ก', { indent: 400 }),
          createBodyP('- Schema Migration: จัดเก็บ Schema ไว้ในไฟล์ schema.prisma ช่วยให้การปรับปรุงโครงสร้างตารางทำได้อย่างเป็นระบบและตรวจสอบย้อนกลับได้', { indent: 400 }),

          createHeading2('2.3 การจัดการสถานะฝั่ง Client ด้วย Zustand'),
          createBodyP(
            'สำหรับระบบหน้าร้าน การทำงานของตะกร้าสินค้า (Cart Store) และการจัดเก็บข้อมูลการเข้าสู่ระบบของผู้ใช้ (Auth Store) ได้รับการจัดการผ่าน Zustand ซึ่งเป็นไลบรารี State Management ที่มีขนาดเบามาก (Lightweight) เข้าใจง่าย และไม่มี Boilerplate ที่ยุ่งยากเหมือน Redux สามารถรักษาข้อมูลตะกร้าสินค้าไว้ได้แม้จะมีการเปลี่ยนหน้า'
          ),

          createHeading2('2.4 เทคโนโลยีบาร์โค้ดและการตรวจรับสินค้าในคลังสินค้า (Tote Receiving)'),
          createBodyP(
            'ในระบบค้าปลีกสมัยใหม่ กระบวนการนำส่งสินค้าจากศูนย์กระจายสินค้า (Distribution Center) มายังสาขา จะบรรจุสินค้าลงในกล่องพลาสติกขนาดมาตรฐานที่เรียกว่า "Tote Box" โดยแต่ละกล่องจะมีรหัส Tote กำกับ (เช่น TG2101003090) ภายในจะมีใบส่งสินค้ากำกับรายการสินค้า รหัสบาร์โค้ด และจำนวนสินค้า'
          ),
          createBodyP(
            'การประยุกต์ใช้ไลบรารี JsBarcode ช่วยให้ระบบสามารถเรนเดอร์ภาพบาร์โค้ดมาตรฐาน Code 128 หรือ EAN-13 บนหน้าจอเว็บได้โดยตรงแบบ Vector SVG/Canvas ทำให้เครื่องสแกนบาร์โค้ดทั่วไปหรือกล้องมือถือสามารถยิงสแกนได้อย่างแม่นยำ 100%'
          ),

          // บทที่ 3
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('บทที่ 3: การวิเคราะห์และออกแบบระบบ'),
          createHeading2('3.1 การไหลของข้อมูลในระบบ (System Workflow)'),
          createBodyP(
            'การทำงานของระบบถูกออกแบบให้เชื่อมโยงกันอย่างสมบูรณ์แบบ 4 สเต็ปหลัก:'
          ),
          createBodyP('1. สเต็ปที่ 1 (Inbound): ศูนย์กระจายสินค้าส่ง Tote มายังร้านค้า -> พนักงานเปิดเครื่อง Handheld สแกนรหัส Tote -> สแกนบาร์โค้ดสินค้าเพื่อตรวจรับ -> ยืนยันการรับ สต็อกสินค้าหลักเพิ่มขึ้นในระบบ', { indent: 400 }),
          createBodyP('2. สเต็ปที่ 2 (Ordering): ลูกค้าเข้าสู่ระบบหน้าร้านออนไลน์ -> เลือกสินค้าใส่ตะกร้า -> เลือกรูปแบบการจัดส่ง (Delivery/Pickup) -> กดยืนยันสั่งซื้อ -> บันทึกคำสั่งซื้อลงฐานข้อมูล', { indent: 400 }),
          createBodyP('3. สเต็ปที่ 3 (Fulfillment): ออเดอร์ปรากฏบนจอ Store Fulfillment / iPad ประจำหน้าร้าน -> พนักงานดูรายการและสแกนบาร์โค้ดสินค้าที่เตรียมไว้เพื่อตัดสต็อก -> ปรับสถานะเป็นพร้อมส่ง', { indent: 400 }),
          createBodyP('4. สเต็ปที่ 4 (Outbound & Delivery): ออเดอร์แสดงใน Rider Portal -> ไรเดอร์กดรับงาน -> นำสินค้าไปส่งตามที่อยู่ลูกค้า -> ยืนยันการส่งมอบสำเร็จ -> ออเดอร์เสร็จสมบูรณ์', { indent: 400 }),

          createHeading2('3.2 โครงสร้างฐานข้อมูล (Database Schema Design)'),
          createBodyP('ฐานข้อมูลประกอบด้วยตารางข้อมูลสำคัญ 10 ตาราง ได้แก่:'),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell('ชื่อตาราง (Model)', 25),
                  createTableHeaderCell('รายละเอียดหน้าที่', 45),
                  createTableHeaderCell('คีย์หลักและคีย์นอก (Keys)', 30),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Category', 25, AlignmentType.LEFT, false),
                  createTableCell('จัดเก็บหมวดหมู่สินค้า เช่น เครื่องดื่ม, ขนม, ของใช้', 45, AlignmentType.LEFT, false),
                  createTableCell('PK: id', 30, AlignmentType.LEFT, false),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Product', 25, AlignmentType.LEFT, true),
                  createTableCell('จัดเก็บรายละเอียดสินค้า รหัส SKU บาร์โค้ด ราคา สต็อก รูปภาพ และ ToteCode', 45, AlignmentType.LEFT, true),
                  createTableCell('PK: id, FK: categoryId', 30, AlignmentType.LEFT, true),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('User', 25, AlignmentType.LEFT, false),
                  createTableCell('จัดเก็บข้อมูลสมาชิก ชื่อ เบอร์โทร ที่อยู่ และรหัสผ่าน', 45, AlignmentType.LEFT, false),
                  createTableCell('PK: id, Unique: username', 30, AlignmentType.LEFT, false),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Admin', 25, AlignmentType.LEFT, true),
                  createTableCell('จัดเก็บข้อมูลผู้ดูแลระบบและสิทธิ์การเข้าถึงหลังบ้าน', 45, AlignmentType.LEFT, true),
                  createTableCell('PK: id, Unique: username', 30, AlignmentType.LEFT, true),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Order', 25, AlignmentType.LEFT, false),
                  createTableCell('จัดเก็บข้อมูลใบสั่งซื้อ ยอดเงินรวม รูปแบบจัดส่ง สถานะ และที่อยู่จัดส่ง', 45, AlignmentType.LEFT, false),
                  createTableCell('PK: id, FK: userId, riderId', 30, AlignmentType.LEFT, false),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('OrderItem', 25, AlignmentType.LEFT, true),
                  createTableCell('จัดเก็บรายการสินค้าที่สั่งซื้อในแต่ละใบสั่งซื้อ จำนวน และราคาต่อหน่วย', 45, AlignmentType.LEFT, true),
                  createTableCell('PK: id, FK: orderId', 30, AlignmentType.LEFT, true),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Rider', 25, AlignmentType.LEFT, false),
                  createTableCell('จัดเก็บข้อมูลพนักงานส่งสินค้า เบอร์ติดต่อ ทะเบียนรถ สถานะ และคะแนนดาว', 45, AlignmentType.LEFT, false),
                  createTableCell('PK: id, Unique: phone', 30, AlignmentType.LEFT, false),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Tote', 25, AlignmentType.LEFT, true),
                  createTableCell('จัดเก็บข้อมูลกล่องตรวจรับสินค้า เช่น รหัส Tote และสถานะตรวจรับ', 45, AlignmentType.LEFT, true),
                  createTableCell('PK: id, Unique: code', 30, AlignmentType.LEFT, true),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('ToteItem', 25, AlignmentType.LEFT, false),
                  createTableCell('จัดเก็บรายการสินค้าใน Tote บาร์โค้ด จำนวนตามใบส่ง และจำนวนที่ตรวจรับจริง', 45, AlignmentType.LEFT, false),
                  createTableCell('PK: id, FK: toteId', 30, AlignmentType.LEFT, false),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Banner', 25, AlignmentType.LEFT, true),
                  createTableCell('จัดเก็บภาพป้ายแบนเนอร์โปรโมชั่นบนหน้าแรกของเว็บไซต์', 45, AlignmentType.LEFT, true),
                  createTableCell('PK: id', 30, AlignmentType.LEFT, true),
                ],
              }),
            ],
          }),

          // บทที่ 4
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('บทที่ 4: การพัฒนาและการทำงานของระบบ'),
          createHeading2('4.1 โมดูลหน้าร้านค้าออนไลน์ (E-Commerce Storefront)'),
          createBodyP(
            'หน้าร้านค้าออนไลน์ได้รับการออกแบบด้วยหลัก Mobile-first Responsive Design เพื่อให้สามารถใช้งานได้อย่างราบรื่นทั้งบนสมาร์ทโฟน แท็บเล็ต และคอมพิวเตอร์เดสก์ท็อป มีฟังก์ชันสำคัญดังนี้:'
          ),
          createBodyP('- การค้นหาแบบอัจฉริยะ: ค้นหาชื่อสินค้าหรือรหัสสินค้าได้อย่างรวดเร็ว แสดงผลลัพธ์ทันที', { bullet: true }),
          createBodyP('- การคัดกรองตามหมวดหมู่: แบ่งประเภทสินค้าชัดเจน เช่น ขนมขบเคี้ยว, เครื่องดื่ม, เครื่องปรุง, ของใช้ส่วนตัว', { bullet: true }),
          createBodyP('- ระบบตะกร้าสินค้า: สามารถเพิ่ม ลด หรือลบสินค้า พร้อมแสดงยอดรวมเงินแบบ Real-time', { bullet: true }),
          createBodyP('- ขั้นตอนการชำระเงิน (Checkout): สามารถเลือกที่อยู่จัดส่ง กรอกเบอร์ติดต่อ และเลือกช่องทางจัดส่งแบบส่งถึงบ้านหรือมารับเองที่สาขา', { bullet: true }),

          createHeading2('4.2 โมดูลตรวจรับสินค้าในคลังผ่าน Handheld Terminal'),
          createBodyP(
            'โมดูล Handheld ถูกออกแบบเพื่อจำลองการทำงานบนเครื่องตรวจนับพกพา (Handheld Mobile Computer เช่น Zebra, Honeywell) มีลักษณะเด่นในการทำงานดังนี้:'
          ),
          createBodyP('1. โหมดเลือก Tote: แสดงรายชื่อกล่อง Tote ที่รอนำเข้า (Pending) เช่น กล่อง TG2101003090, TG2101011176 พร้อมจำนวนรายการสินค้าภายในกล่อง', { indent: 400 }),
          createBodyP('2. โหมดตรวจนับ (Inspection Mode): หน้าจอแสดงตารางสินค้า ลำดับ รายการสินค้า บาร์โค้ด จำนวนที่ต้องได้รับ และจำนวนที่ตรวจรับจริง (Received Qty)', { indent: 400 }),
          createBodyP('3. กลไกตรวจสอบบาร์โค้ด (Barcode Verification Logic): เมื่อยิงบาร์โค้ด ระบบจะค้นหาว่าบาร์โค้ดดังกล่าวตรงกับรายการใดใน Tote หากตรงจะบวกจำนวนรับจริงเพิ่ม 1 ชิ้นและขึ้นไฮไลต์สีเขียว หากบาร์โค้ดไม่ถูกต้อง ระบบจะส่งเสียงแจ้งเตือนและขึ้นเตือนสีแดงทันที ป้องกันการหยิบสินค้าผิดปะปนเข้ามา', { indent: 400 }),
          createBodyP('4. การยืนยันเสร็จสิ้น (Tote Complete): เมื่อตรวจรับครบถ้วน ระบบจะเปลี่ยนสถานะ Tote เป็น COMPLETED และเพิ่มยอดสต็อกเข้าไปยังตาราง Product หลักโดยอัตโนมัติ', { indent: 400 }),

          createHeading2('4.3 โมดูลจอหน้าร้าน / iPad Store Fulfillment'),
          createBodyP(
            'หน้าจอสำหรับพนักงานประจำหน้าร้าน เพื่อใช้เตรียมสินค้าตามคำสั่งซื้อที่ลูกค้าส่งเข้ามาทางออนไลน์:'
          ),
          createBodyP('- การแสดงออเดอร์: จัดกลุ่มออเดอร์ตามสถานะ พร้อมรายละเอียดเวลาสั่งซื้อและข้อมูลลูกค้า', { bullet: true }),
          createBodyP('- บาร์โค้ดประจำสินค้าในออเดอร์: ระบบสร้างบาร์โค้ด Code 128 สำหรับสินค้าแต่ละรายการบนหน้าจอ เพื่อให้พนักงานหยิบสินค้าจากชั้นวางแล้วยิงเครื่องสแกนตรวจเช็คความถูกต้องได้อย่างรวดเร็ว', { bullet: true }),
          createBodyP('- การกดเปลี่ยนสถานะ: สามารถเปลี่ยนสถานะเป็น "จัดเตรียมเสร็จสิ้น" เพื่อส่งต่องานไปยังระบบไรเดอร์ต่อไป', { bullet: true }),

          createHeading2('4.4 โมดูลพอร์ทัลไรเดอร์และการจัดส่ง (Rider Delivery Portal)'),
          createBodyP(
            'โมดูลไรเดอร์ช่วยให้การบริหารการนำจ่ายสินค้าเป็นไปอย่างเป็นระบบและโปร่งใส:'
          ),
          createBodyP('- การแสดงสถานะคนขับ: แสดงรายชื่อไรเดอร์ ยานพาหนะ เบอร์โทร และสถานะความพร้อม (AVAILABLE / BUSY)', { bullet: true }),
          createBodyP('- รายการงานนำจ่าย: แสดงออเดอร์ที่ต้องจัดส่ง ที่อยู่ปลายทาง ยอดเงินที่ต้องเก็บ (กรณีเก็บเงินสด) และเบอร์ติดต่อลูกค้า', { bullet: true }),
          createBodyP('- การอัปเดตงาน: ไรเดอร์สามารถกด "รับงาน (Accept Job)" -> "กำลังนำจ่าย (In Transit)" -> "จัดส่งสำเร็จ (Delivered)" ระบบจะบันทึกเวลาการส่งมอบ (Delivered At) เข้าสู่ฐานข้อมูล', { bullet: true }),

          createHeading2('4.5 โมดูลระบบผู้ดูแลระบบ (Admin Dashboard)'),
          createBodyP(
            'ศูนย์กลางการควบคุมระบบทั้งหมดของผู้บริหารหรือผู้จัดการร้านค้า:'
          ),
          createBodyP('- แดชบอร์ดสรุปผล: แสดงการวัดผลทางธุรกิจ เช่น ยอดขายรวม (Total Revenue), จำนวนคำสั่งซื้อ (Total Orders), จำนวนสินค้าทั้งหมดในสต็อก (Stock Items), และจำนวนสมาชิก', { bullet: true }),
          createBodyP('- ระบบจัดการสินค้าและสต็อก: เพิ่มสินค้าใหม่ อัปเดตราคา แก้ไขจำนวนสต็อก และจัดการรูปภาพ', { bullet: true }),
          createBodyP('- ระบบจัดการผู้ใช้งาน: ตรวจสอบข้อมูลสมาชิกในระบบและบทบาทหน้าที่', { bullet: true }),

          // บทที่ 5
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('บทที่ 5: สรุปผลการดำเนินงาน ปัญหา และข้อเสนอแนะ'),
          createHeading2('5.1 สรุปผลการดำเนินงาน'),
          createBodyP(
            'การพัฒนาโครงงาน "ระบบจัดการร้านค้าออนไลน์ การตรวจรับสินค้าผ่านเครื่อง Handheld และระบบกระจายสินค้าไรเดอร์" ประสบความสำเร็จตามวัตถุประสงค์ที่ตั้งไว้ทุกประการ ระบบสามารถทำงานเชื่อมโยงกันอย่างสมบูรณ์แบบตั้งแต่ระบบหน้าร้าน การตรวจรับสินค้าคลังสินค้า การจัดเตรียมสินค้า และการจัดส่งสินค้า โดยสรุปผลลัพธ์สำคัญได้ดังนี้:'
          ),
          createBodyP('1. ฐานข้อมูลระบบสามารถรองรับข้อมูลสินค้าจริงได้มากกว่า 119 รายการ พร้อมข้อมูลหมวดหมู่ 15 หมวดหมู่', { bullet: true }),
          createBodyP('2. ระบบ Handheld สามารถนำเข้าข้อมูล Tote จากเอกสาร PDF และช่วยตรวจรับสินค้าผ่านการสแกนบาร์โค้ดได้อย่างแม่นยำ', { bullet: true }),
          createBodyP('3. ระบบ Store Fulfillment รองรับการสร้างบาร์โค้ดสินค้าในออเดอร์ ช่วยลดระยะเวลาการจัดของของพนักงานหน้าร้าน', { bullet: true }),
          createBodyP('4. ระบบไรเดอร์ช่วยให้การกระจายสินค้าและการติดตามสถานะออเดอร์มีความชัดเจนและตรวจสอบได้', { bullet: true }),

          createHeading2('5.2 ปัญหาและอุปสรรคในการพัฒนา'),
          createBodyP('1. ความหลากหลายของฟอร์แมตบาร์โค้ด: สินค้าบางประเภทมีบาร์โค้ดทั้ง 13 หลัก (EAN-13) และ 14 หลัก (ITF-14 / Carton Code) ทำให้ต้องพัฒนาระบบค้นหาบาร์โค้ดที่ยืดหยุ่น', { bullet: true }),
          createBodyP('2. การจัดการขนาดหน้าจอบนอุปกรณ์เคลื่อนที่: หน้าจอเครื่อง Handheld มักมีความกว้างหน้าจอจำกัด จึงต้องออกแบบ UI ให้เน้นปุ่มกดขนาดใหญ่ ตัวเลขชัดเจน และสีสันที่บ่งบอกสถานะได้อย่างรวดเร็ว', { bullet: true }),

          createHeading2('5.3 แนวทางการพัฒนาต่อยอดในอนาคต'),
          createBodyP('1. การเชื่อมต่อกับเครื่องพิมพ์สลิปและเครื่องพิมพ์บาร์โค้ดความร้อน (Thermal Label Printer) ผ่าน Bluetooth หรือ Network สำหรับพิมพ์ใบเสร็จหรือสติกเกอร์บาร์โค้ด', { bullet: true }),
          createBodyP('2. การนำระบบพิกัด GPS และ Google Maps API มาคำนวณเส้นทางการจัดส่งที่สั้นที่สุดสำหรับไรเดอร์', { bullet: true }),
          createBodyP('3. การพัฒนาระบบแจ้งเตือนผ่าน LINE Notify หรือ Web Push Notification ไปยังลูกค้าและไรเดอร์เมื่อสถานะคำสั่งซื้อเปลี่ยนแปลง', { bullet: true }),
          createBodyP('4. การประยุกต์ใช้ปัญญาประดิษฐ์ (AI / Predictive Analytics) ในการพยากรณ์ยอดขายและแนะนำจำนวนสินค้าที่ต้องสั่งซื้อเติมสต็อกล่วงหน้า', { bullet: true }),

          // ภาคผนวก
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('ภาคผนวก (Appendix): สรุปคำสั่งและโครงสร้างโค้ดโปรเจกต์'),
          createHeading2('ก. วิธีการติดตั้งและรันระบบ (Setup & Execution Guide)'),
          createBodyP('1. ติดตั้งไลบรารีที่จำเป็น: npm install', { indent: 400 }),
          createBodyP('2. ทำการ Generate และ Migrate Prisma Schema: npx prisma generate && npx prisma db push', { indent: 400 }),
          createBodyP('3. รันระบบในโหมดพัฒนา: npm run dev (เข้าใช้งานได้ที่ http://localhost:3000)', { indent: 400 }),
          createHeading2('ข. ข้อมูลบัญชีผู้ใช้สำหรับทดสอบระบบ (Default Test Accounts)'),
          createBodyP('- บัญชีผู้ดูแลระบบ (Admin): Username: Admin / เข้าใช้งานที่เมนู /admin', { indent: 400 }),
          createBodyP('- บัญชีผู้ใช้งานทั่วไป (User): Username: beam หรือ test@gmail.com', { indent: 400 }),
          createBodyP('- เมนู Handheld Terminal: เข้าใช้งานที่ URL: /handheld', { indent: 400 }),
          createBodyP('- เมนู Store Fulfillment: เข้าใช้งานที่ URL: /store/fulfillment', { indent: 400 }),
          createBodyP('- เมนู Rider Portal: เข้าใช้งานที่ URL: /rider', { indent: 400 }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(process.cwd(), 'รายงานโครงงาน_ระบบร้านค้าและตรวจรับสินค้าคลัง_ฉบับสมบูรณ์.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('สร้างไฟล์รูปเล่ม Word สำเร็จที่:', outputPath);
}

generateReportDocx().catch((err) => {
  console.error('เกิดข้อผิดพลาด:', err);
  process.exit(1);
});
