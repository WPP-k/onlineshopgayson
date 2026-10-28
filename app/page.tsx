import { Header } from "@/components/Header";
import { BannerSection } from "@/components/BannerSection";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ProductCard } from "@/components/ProductCard";
import { PromotionSectionClient } from "@/components/PromotionSectionClient";
import { prisma } from "@/lib/prisma";
import { ChevronRight, Sparkles } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [dbProducts, dbCategories] = await Promise.all([
    prisma.product.findMany({
      include: { promotion: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
  ]);

  const promotionalProducts = dbProducts.filter((p) => p.promotion && p.promotion.isActive);

  return (
    <div className="flex flex-col w-full bg-[#f5f5f5] min-h-screen">
      <Header />
      
      <main className="w-full">
        <BannerSection />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 space-y-6">
          {/* Clickable Promotion Banner -> Scrolls directly to #promotions */}
          <a
            href="#promotions"
            className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 rounded-3xl overflow-hidden flex flex-col sm:flex-row items-center justify-between p-6 sm:px-8 shadow-md hover:shadow-xl transition-all duration-300 text-white gap-4 group cursor-pointer border border-red-400/40 hover:scale-[1.005]"
            title="คลิกเพื่อดูสินค้าโปรโมชันและสินค้าลดราคา"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-inner">
                🔥
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-2xl tracking-tight drop-shadow-xs">
                    โปรโมชันพิเศษร้านเกษรบ้านป่าเวียง
                  </h3>
                  <span className="bg-amber-400 text-amber-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow-2xs">
                    HOT PROMO
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/95 mt-1 font-medium">
                  ซื้อ 1 แถม 1, ซื้อ 2 แถม 1 และลดราคาสินค้าโดนใจ • คลิกเพื่อดูสินค้าลดราคา
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <span className="w-full sm:w-auto bg-white text-[#b90000] group-hover:bg-amber-50 font-extrabold text-sm px-5 py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5">
                <span>ดูสินค้าลดราคา</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </a>  

          <CategoryGrid categories={dbCategories.length > 0 ? dbCategories : undefined} />
          
          {/* Special Promotions Section with Filters */}
          {promotionalProducts.length > 0 && (
            <PromotionSectionClient products={promotionalProducts} />
          )}

          {/* Recommended Products Section */}
          <div className="mt-8 pb-10">
            <div className="bg-white p-4 border-b-4 border-red-600 inline-block mb-4">
               <h2 className="text-lg font-bold text-red-600 uppercase">สินค้าประจำวัน</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {dbProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{ ...product, image: product.image || '🛒', promotion: product.promotion }}
                  createdAt={product.createdAt.toISOString()}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
