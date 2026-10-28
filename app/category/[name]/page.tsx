import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, CATEGORY_ICON_MAP } from "@/components/CategoryGrid";
import { ChevronRight, Home, PackageSearch } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedCategoryName = decodeURIComponent(name);

  // Find the category info from DB first, then fallback to predefined list
  const [dbCategory, allDbCategories, products] = await Promise.all([
    prisma.category.findFirst({
      where: { name: decodedCategoryName },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: {
        OR: [
          { category: { name: decodedCategoryName } },
          { name: { contains: decodedCategoryName } },
        ],
      },
      include: { promotion: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const categoryImage = dbCategory?.image || CATEGORIES.find(
    (c) => c.name.toLowerCase() === decodedCategoryName.toLowerCase()
  )?.image;

  const displayCategories = allDbCategories.length > 0 ? allDbCategories : CATEGORIES;

  // Fetch some other products as recommendations if this category is empty
  const otherProducts = products.length === 0
    ? await prisma.product.findMany({
        take: 6,
        include: { promotion: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="flex flex-col w-full bg-[#f5f5f5] min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#b90000] flex items-center gap-1 transition-colors">
            <Home className="w-4 h-4" />
            <span>หน้าแรก</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">หมวดหมู่</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-800">{decodedCategoryName}</span>
        </nav>

        {/* Category Header Banner */}
        <div className="bg-gradient-to-r from-[#b90000] to-red-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
              {(() => {
                const BannerIcon = CATEGORY_ICON_MAP[decodedCategoryName] || PackageSearch;
                return <BannerIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.5} />;
              })()}
            </div>
            <div>
              <div className="inline-block bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2">
                หมวดหมู่สินค้า
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {decodedCategoryName}
              </h1>
              <p className="text-white/80 text-sm mt-1">
                พบสินค้าทั้งหมด <span className="font-bold text-white">{products.length}</span> รายการ
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1 bg-white text-[#b90000] hover:bg-gray-100 font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm"
          >
            ← กลับหน้าแรก
          </Link>
        </div>

        {/* Quick Category Switcher Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-xs font-semibold text-gray-400 px-2 uppercase">หมวดหมู่อื่นๆ:</span>
            {displayCategories.map((cat) => {
              const isCurrent = cat.name === decodedCategoryName;
              const TabIcon = CATEGORY_ICON_MAP[cat.name] || PackageSearch;
              return (
                <Link
                  key={cat.id}
                  href={`/category/${encodeURIComponent(cat.name)}`}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isCurrent
                      ? "bg-[#b90000] text-white shadow-sm"
                      : "bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-[#b90000]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCurrent ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </div>
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Products Display Section */}
        <div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    image: product.image || "🛒",
                    promotion: product.promotion,
                  }}
                  createdAt={product.createdAt.toISOString()}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center my-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-50 text-[#b90000] rounded-full flex items-center justify-center">
                <PackageSearch className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                ยังไม่มีสินค้าในหมวดหมู่ "{decodedCategoryName}"
              </h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                ขณะนี้ยังไม่มีสินค้าที่ถูกเพิ่มในหมวดหมู่นี้ คุณสามารถดูสินค้าในหมวดหมู่อื่นๆ หรือเพิ่มสินค้าใหม่ผ่านระบบ Admin ได้ครับ
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/"
                  className="bg-[#b90000] hover:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
                >
                  ดูสินค้าทั้งหมดที่หน้าแรก
                </Link>
                <Link
                  href="/admin/products"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  ไปที่หน้าเพิ่มสินค้า (Admin)
                </Link>
              </div>

              {/* Recommended other products */}
              {otherProducts.length > 0 && (
                <div className="mt-12 text-left border-t border-gray-100 pt-8">
                  <h3 className="text-base font-bold text-gray-800 mb-4">
                    สินค้าแนะนำจากหมวดหมู่อื่นๆ:
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {otherProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={{
                          ...product,
                          image: product.image || "🛒",
                          promotion: product.promotion,
                        }}
                        createdAt={product.createdAt.toISOString()}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
