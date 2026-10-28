import Link from "next/link";
import { 
  Cookie, GlassWater, Utensils, ConciergeBell, Sparkles, 
  Bath, Milk, ShoppingBag, Sun, Bone, Wheat, Coffee, 
  Smile, Database, Home, Tag, LucideIcon
} from "lucide-react";

export interface CategoryItem {
  id: string | number;
  name: string;
  image?: string | null;
  icon?: LucideIcon;
}

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  "ขนม": Cookie,
  "น้ำ": GlassWater,
  "เครื่องปรุง": Utensils,
  "มาม่า": ConciergeBell,
  "ผงซักฟอก": Sparkles,
  "สบู่": Bath,
  "นม": Milk,
  "ของใช้ส่วนตัว": ShoppingBag,
  "ครีม": Sun,
  "อาหารสัตว์": Bone,
  "ข้าวสาร": Wheat,
  "เครื่องดื่ม": Coffee,
  "ยาสีฟัน": Smile,
  "อาหารกระป๋อง": Database,
  "ของใช้ในบ้าน": Home,
  // Icon key aliases
  Cookie,
  GlassWater,
  Utensils,
  ConciergeBell,
  Sparkles,
  Bath,
  Milk,
  ShoppingBag,
  Sun,
  Bone,
  Wheat,
  Coffee,
  Smile,
  Database,
  Home,
  Tag,
};

export const CATEGORIES: CategoryItem[] = [
  { id: 1, name: "ขนม", icon: Cookie },
  { id: 2, name: "น้ำ", icon: GlassWater },
  { id: 3, name: "เครื่องปรุง", icon: Utensils },
  { id: 4, name: "มาม่า", icon: ConciergeBell },
  { id: 5, name: "ผงซักฟอก", icon: Sparkles },
  { id: 6, name: "สบู่", icon: Bath },
  { id: 7, name: "นม", icon: Milk },
  { id: 8, name: "ของใช้ส่วนตัว", icon: ShoppingBag },
  { id: 9, name: "ครีม", icon: Sun },
  { id: 10, name: "อาหารสัตว์", icon: Bone },
  { id: 11, name: "ข้าวสาร", icon: Wheat },
  { id: 12, name: "เครื่องดื่ม", icon: Coffee },
  { id: 13, name: "ยาสีฟัน", icon: Smile },
  { id: 14, name: "อาหารกระป๋อง", icon: Database },
  { id: 15, name: "ของใช้ในบ้าน", icon: Home },
];

interface CategoryGridProps {
  activeCategory?: string;
  categories?: CategoryItem[];
}

export function CategoryGrid({ activeCategory, categories }: CategoryGridProps) {
  const displayCategories = (categories && categories.length > 0) ? categories : CATEGORIES;

  return (
    <div className="bg-white mt-6 rounded-xl shadow-xs border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-gray-800 font-bold text-base">หมวดหมู่สินค้า</h2>
        <span className="text-xs text-gray-400">เลือกหมวดหมู่ที่ต้องการดู</span>
      </div>
      <div className="grid grid-cols-5 md:grid-cols-10 grid-rows-2">
        {displayCategories.slice(0, 20).map((cat, i) => {
          const Icon = cat.icon || (cat.image && CATEGORY_ICON_MAP[cat.image]) || CATEGORY_ICON_MAP[cat.name] || Tag;
          const isActive = activeCategory === cat.name;

          return (
            <Link
              key={cat.id}
              href={`/category/${encodeURIComponent(cat.name)}`}
              className={`flex flex-col items-center justify-center p-3 sm:p-4 border-r border-b border-gray-100 hover:shadow-sm cursor-pointer transition-all bg-white z-10 hover:bg-red-50/30 group ${
                i >= 10 ? "border-b-0" : ""
              } ${isActive ? "bg-red-50/60 ring-2 ring-inset ring-[#b90000]" : ""}`}
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2.5 transition-all duration-200 group-hover:scale-108 shadow-2xs border ${
                  isActive
                    ? "bg-red-100 text-[#b90000] border-red-200 ring-2 ring-offset-1 ring-[#b90000]"
                    : "bg-gray-50 text-gray-600 border-gray-100 group-hover:bg-red-100 group-hover:text-[#b90000] group-hover:border-red-200"
                }`}
              >
                <Icon className="h-7 w-7 sm:h-8 sm:w-8 transition-transform group-hover:scale-105" strokeWidth={1.5} />
              </div>
              <span
                className={`text-xs text-center transition-colors line-clamp-1 ${
                  isActive
                    ? "font-bold text-[#b90000]"
                    : "text-gray-700 group-hover:text-[#b90000] font-medium"
                }`}
              >
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
