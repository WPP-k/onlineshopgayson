import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const query = params?.q || "";

  const dbProducts = query 
    ? await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { sku: { contains: query } },
          ]
        },
        include: { promotion: true },
        orderBy: { createdAt: 'desc' }
      })
    : [];

  return (
    <div className="flex flex-col w-full bg-[#f5f5f5] min-h-screen">
      <Header />
      
      <main className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 font-medium mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้าหลัก
          </Link>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <form action="/search" method="GET" className="flex w-full mb-4">
              <input 
                type="text" 
                name="q"
                defaultValue={query}
                placeholder="พิมพ์ชื่อสินค้าหรือรหัสสินค้าที่ต้องการค้นหา..." 
                className="flex-grow px-4 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-l-lg outline-none focus:bg-white focus:ring-2 focus:ring-[#b90000]/20 focus:border-[#b90000] transition-all"
              />
              <button type="submit" className="bg-[#b90000] hover:bg-red-800 transition-colors text-white px-6 rounded-r-lg font-bold flex items-center gap-2">
                <SearchIcon className="w-5 h-5" />
                <span className="hidden sm:inline">ค้นหาเลย</span>
              </button>
            </form>

            {query ? (
              <>
                <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  ผลการค้นหาสำหรับ: <span className="text-[#b90000]">"{query}"</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  พบสินค้าทั้งหมด {dbProducts.length} รายการ
                </p>
              </>
            ) : (
              <h1 className="text-lg font-bold text-gray-800 text-center py-4">
                กรุณาพิมพ์คำค้นหาในช่องด้านบน
              </h1>
            )}
          </div>
          
          <div className="pb-10">
            {dbProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {dbProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{...product, image: product.image || '🛒', promotion: product.promotion}}
                    createdAt={product.createdAt.toISOString()}
                  />
                ))}
              </div>
            ) : query ? (
              <div className="bg-white rounded-xl border border-gray-100 p-16 text-center shadow-sm">
                <SearchIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-700 mb-2">ไม่พบสินค้าที่คุณกำลังค้นหา</h2>
                <p className="text-gray-500">ลองใช้คำค้นหาอื่น หรือตรวจดูตัวสะกดอีกครั้ง</p>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
