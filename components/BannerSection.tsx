import { prisma } from "@/lib/prisma";
import { BannerCarouselClient } from "./BannerCarouselClient";

export async function BannerSection() {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="bg-white pt-6 pb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {banners.length > 0 ? (
          <BannerCarouselClient banners={banners} />
        ) : (
          <div className="flex gap-2 h-[240px] md:h-[300px]">
            {/* Main Hero Banner (Left) */}
            <div className="w-full md:w-2/3 relative rounded bg-gradient-to-r from-red-600 to-orange-500 overflow-hidden shadow-sm">
               <div className="absolute inset-0 flex flex-col justify-center px-10 text-white z-10">
                  <h2 className="text-4xl md:text-5xl font-black italic drop-shadow-md mb-2">ลดแรง!</h2>
                  <p className="text-2xl font-bold bg-white text-red-600 inline-block px-3 py-1 rounded w-max mb-4">แจกโค้ดส่งฟรี</p>
                  <div className="text-lg">ซื้อครบ 300.- ลดทันที 50.-</div>
               </div>
               {/* Decorative abstract shapes */}
               <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-yellow-400 opacity-20 skew-x-12 translate-x-1/4"></div>
            </div>
            
            {/* Side Banners (Right) */}
            <div className="hidden md:flex w-1/3 flex-col gap-2">
              <div className="h-[calc(50%-4px)] bg-gradient-to-r from-blue-700 to-blue-500 rounded overflow-hidden relative shadow-sm">
                 <div className="absolute inset-0 flex flex-col justify-center px-6 text-white">
                    <h3 className="font-bold text-xl">สินค้าลดล้างสต๊อก</h3>
                    <p className="text-sm opacity-90">ลดสูงสุด 70%</p>
                 </div>
              </div>
              <div className="h-[calc(50%-4px)] bg-gradient-to-r from-teal-500 to-emerald-400 rounded overflow-hidden relative shadow-sm">
                 <div className="absolute inset-0 flex flex-col justify-center px-6 text-white">
                    <h3 className="font-bold text-xl">สินค้าเข้าใหม่</h3>
                    <p className="text-sm opacity-90">อัปเดตทุกสัปดาห์</p>
                 </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
