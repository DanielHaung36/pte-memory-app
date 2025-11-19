"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import AppNavigation from "@/components/ui/navigation/AppNavigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ShoppingBag,
  Gift,
  Crown,
  Palette,
  Music,
  Award,
  Heart,
  Sparkles,
  Coffee,
  Book,
  Lightbulb,
  Target,
  Zap,
  Trophy,
  Check,
  X,
  ShoppingCart,
} from "lucide-react";
import { useSmartAlert } from "@/components/ui/SmartAlert";
import { 
  useGetShopItemsQuery, 
  useGetUserInventoryQuery, 
  usePurchaseItemMutation, 
  shopUtils,
  type ShopItem as ApiShopItem,
} from "@/lib/store/shopApi";

interface ShopItem extends ApiShopItem {
  icon: any;
}

// Icon mapping for shop items
const iconMap: Record<string, any> = {
  Palette: Palette,
  Crown: Crown,
  Sparkles: Sparkles,
  Award: Award,
  Trophy: Trophy,
  Zap: Zap,
  Target: Target,
  Lightbulb: Lightbulb,
  Coffee: Coffee,
  Book: Book,
  Heart: Heart,
  Gift: Gift,
};

const categoryNames = {
  themes: "主题皮肤",
  avatars: "头像装饰",
  badges: "成就徽章", 
  boosts: "学习道具",
  rewards: "虚拟奖励",
};

export default function ShopPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showPurchaseModal, setShowPurchaseModal] = useState<ApiShopItem | null>(null);
  
  const { success, error } = useSmartAlert();
  
  // API hooks
  const { data: shopData, isLoading: shopLoading, refetch: refetchShop } = useGetShopItemsQuery({
    category: selectedCategory,
    limit: 50,
    offset: 0,
  });
  
  const { data: inventoryData, refetch: refetchInventory } = useGetUserInventoryQuery(undefined, {
    skip: !user,
  });
  
  const [purchaseItem, { isLoading: purchasing }] = usePurchaseItemMutation();
  
  // Process shop items to add icons
  const shopItems = shopData?.items?.map(item => ({
    ...item,
    icon: iconMap[shopUtils.getItemIcon(item.category, item.item_type)] || Gift,
  })) || [];
  
  const ownedItems = inventoryData?.inventory?.map(item => item.item_id) || [];

  const handlePurchase = async (item: ApiShopItem) => {
    if (!user) {
      error("请先登录");
      return;
    }

    if (!shopUtils.canAfford(user.xp, item.price)) {
      error(`积分不足！还需要 ${item.price - user.xp} 积分`);
      return;
    }

    if (shopUtils.ownsItem(inventoryData?.inventory || [], item.id)) {
      error("您已拥有此物品");
      return;
    }

    try {
      const result = await purchaseItem(item.id).unwrap();
      success(`成功购买 ${item.name}！`);
      setShowPurchaseModal(null);
      
      // Refresh inventory
      refetchInventory();
    } catch (err: any) {
      console.error('Purchase failed:', err);
      error(err.data?.error || '购买失败，请重试');
    }
  };

  // Loading state
  if (shopLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <AppNavigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-3 mb-4"
          >
            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              积分商店
            </h1>
          </motion.div>
          
          <p className="text-gray-600 mb-4">用你的学习积分兑换精美奖励</p>
          
          {/* User Points */}
          <motion.div 
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-6 py-3 rounded-2xl shadow-sm"
            whileHover={{ scale: 1.05 }}
          >
            <Star className="h-5 w-5 text-yellow-600" />
            <span className="text-lg font-semibold text-yellow-700">
              当前积分: {user?.xp || 0}
            </span>
          </motion.div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-amber-500 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-amber-50"
            }`}
          >
            全部商品
          </button>
          {Object.entries(categoryNames).map(([key, name]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === key
                  ? "bg-amber-500 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-amber-50"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Shop Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {shopItems.map((item, index) => {
            const Icon = item.icon;
            const isOwned = ownedItems.includes(item.id);
            const canAfford = (user?.xp || 0) >= item.price;

            const rarityInfo = shopUtils.getRarityInfo(item.rarity);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-2xl shadow-lg border-2 ${rarityInfo.borderColor} overflow-hidden group hover:shadow-xl transition-all duration-300`}
              >
                {/* Rarity Badge */}
                <div className={`text-xs font-medium px-2 py-1 ${rarityInfo.color}`}>
                  {rarityInfo.name}
                </div>

                <div className="p-6">
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color_class} rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Item Info */}
                  <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600 text-center mb-4 h-12">
                    {item.description}
                  </p>

                  {/* Price & Purchase */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-lg font-bold text-gray-900">
                        {shopUtils.formatPrice(item.price)}
                      </span>
                    </div>

                    {isOwned ? (
                      <div className="flex items-center justify-center space-x-2 py-2 bg-green-100 text-green-700 rounded-lg">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">已拥有</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPurchaseModal(item)}
                        disabled={!canAfford || purchasing}
                        className={`w-full py-2 rounded-lg font-medium transition-all ${
                          canAfford && !purchasing
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {purchasing ? "购买中..." : canAfford ? "购买" : "积分不足"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {shopItems.length === 0 && !shopLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              暂无商品
            </h3>
            <p className="text-gray-600">
              {selectedCategory === 'all' ? '商店暂时没有商品' : '该分类下暂无商品'}
            </p>
          </div>
        )}

        {/* Purchase Confirmation Modal */}
        <AnimatePresence>
          {showPurchaseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowPurchaseModal(null)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6"
              >
                <div className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${showPurchaseModal.color_class} rounded-2xl flex items-center justify-center mb-4 mx-auto`}>
                    {React.createElement(iconMap[shopUtils.getItemIcon(showPurchaseModal.category, showPurchaseModal.item_type)] || Gift, { className: "h-8 w-8 text-white" })}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    确认购买
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    您确定要花费 <span className="font-semibold text-amber-600">{shopUtils.formatPrice(showPurchaseModal.price)}</span> 积分
                    购买「{showPurchaseModal.name}」吗？
                  </p>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowPurchaseModal(null)}
                      disabled={purchasing}
                      className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handlePurchase(showPurchaseModal)}
                      disabled={purchasing}
                      className="flex-1 py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
                    >
                      {purchasing ? "购买中..." : "确认购买"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}