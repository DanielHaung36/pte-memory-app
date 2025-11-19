import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';
import { API_CONFIG } from '../config';

const API_BASE_URL = API_CONFIG.BACKEND_URL;

// Shop API types
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'themes' | 'avatars' | 'badges' | 'boosts' | 'rewards';
  item_type: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon_url?: string;
  color_class: string;
  is_active: boolean;
  is_limited: boolean;
  stock_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserInventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  is_active: boolean;
  purchased_at: string;
  item: ShopItem;
}

export interface PurchaseHistoryItem {
  id: string;
  user_id: string;
  item_id: string;
  price: number;
  quantity: number;
  status: 'completed' | 'failed' | 'refunded';
  created_at: string;
  item: ShopItem;
}

export interface UserTheme {
  id: string;
  user_id: string;
  theme_id?: string;
  avatar_id?: string;
  badge_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ShopItemsResponse {
  items: ShopItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface UserInventoryResponse {
  inventory: UserInventoryItem[];
}

export interface PurchaseHistoryResponse {
  history: PurchaseHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface PurchaseRequest {
  item_id: string;
}

export interface PurchaseResponse {
  message: string;
  item: ShopItem;
  remaining_xp: number;
}

export interface UpdateThemeRequest {
  theme_id?: string;
  avatar_id?: string;
  badge_ids: string[];
}

// Create Shop API
export const shopApi = createApi({
  reducerPath: 'shopApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/shop`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['ShopItems', 'UserInventory', 'PurchaseHistory', 'UserTheme'],
  endpoints: (builder) => ({
    // Get shop items
    getShopItems: builder.query<ShopItemsResponse, {
      category?: string;
      rarity?: string;
      limit?: number;
      offset?: number;
    }>({
      query: ({ category = 'all', rarity = 'all', limit = 50, offset = 0 } = {}) => ({
        url: '/items',
        params: { category, rarity, limit, offset },
      }),
      providesTags: ['ShopItems'],
    }),

    // Get user inventory
    getUserInventory: builder.query<UserInventoryResponse, void>({
      query: () => '/inventory',
      providesTags: ['UserInventory'],
    }),

    // Purchase item
    purchaseItem: builder.mutation<PurchaseResponse, string>({
      query: (itemId) => ({
        url: `/purchase/${itemId}`,
        method: 'POST',
      }),
      invalidatesTags: ['UserInventory', 'PurchaseHistory'],
    }),

    // Use item
    useItem: builder.mutation<{ message: string; is_active?: boolean; remaining_quantity?: number }, string>({
      query: (itemId) => ({
        url: `/use/${itemId}`,
        method: 'POST',
      }),
      invalidatesTags: ['UserInventory', 'UserTheme'],
    }),

    // Get purchase history
    getPurchaseHistory: builder.query<PurchaseHistoryResponse, {
      limit?: number;
      offset?: number;
    }>({
      query: ({ limit = 20, offset = 0 } = {}) => ({
        url: '/history',
        params: { limit, offset },
      }),
      providesTags: ['PurchaseHistory'],
    }),

    // Get user theme
    getUserTheme: builder.query<{ theme: UserTheme }, void>({
      query: () => '/theme',
      providesTags: ['UserTheme'],
    }),

    // Update user theme
    updateUserTheme: builder.mutation<{ message: string; theme: UserTheme }, UpdateThemeRequest>({
      query: (theme) => ({
        url: '/theme',
        method: 'PUT',
        body: theme,
      }),
      invalidatesTags: ['UserTheme'],
    }),
  }),
});

// Export hooks
export const {
  useGetShopItemsQuery,
  useGetUserInventoryQuery,
  usePurchaseItemMutation,
  useUseItemMutation,
  useGetPurchaseHistoryQuery,
  useGetUserThemeQuery,
  useUpdateUserThemeMutation,
} = shopApi;

// Utility functions for shop features
export const shopUtils = {
  // Get category display name
  getCategoryName: (category: string): string => {
    const categoryMap = {
      themes: '主题皮肤',
      avatars: '头像装饰',
      badges: '成就徽章',
      boosts: '学习道具',
      rewards: '虚拟奖励',
    };
    return categoryMap[category as keyof typeof categoryMap] || '其他';
  },

  // Get rarity display name and color
  getRarityInfo: (rarity: string): { name: string; color: string; borderColor: string } => {
    const rarityMap = {
      common: { name: '普通', color: 'bg-gray-100 text-gray-600', borderColor: 'border-gray-300' },
      rare: { name: '稀有', color: 'bg-blue-100 text-blue-600', borderColor: 'border-blue-400' },
      epic: { name: '史诗', color: 'bg-purple-100 text-purple-600', borderColor: 'border-purple-400' },
      legendary: { name: '传说', color: 'bg-yellow-100 text-yellow-600', borderColor: 'border-yellow-400' },
    };
    return rarityMap[rarity as keyof typeof rarityMap] || rarityMap.common;
  },

  // Check if user can afford item
  canAfford: (userXP: number, itemPrice: number): boolean => {
    return userXP >= itemPrice;
  },

  // Check if user owns item
  ownsItem: (inventory: UserInventoryItem[], itemId: string): boolean => {
    return inventory.some(item => item.item_id === itemId && item.quantity > 0);
  },

  // Get owned item from inventory
  getOwnedItem: (inventory: UserInventoryItem[], itemId: string): UserInventoryItem | null => {
    return inventory.find(item => item.item_id === itemId && item.quantity > 0) || null;
  },

  // Format price display
  formatPrice: (price: number): string => {
    return price.toLocaleString();
  },

  // Get item type icon mapping (you can extend this based on your icon system)
  getItemIcon: (category: string, itemType: string): string => {
    const iconMap: Record<string, Record<string, string>> = {
      themes: {
        dark_theme: 'Palette',
        sunset_theme: 'Palette',
        ocean_theme: 'Palette',
      },
      avatars: {
        crown_frame: 'Crown',
        diamond_frame: 'Sparkles',
      },
      badges: {
        scholar_badge: 'Award',
        master_badge: 'Trophy',
      },
      boosts: {
        double_xp: 'Zap',
        streak_protection: 'Target',
        hint_pack: 'Lightbulb',
      },
      rewards: {
        virtual_coffee: 'Coffee',
        knowledge_book: 'Book',
        learning_heart: 'Heart',
      },
    };

    return iconMap[category]?.[itemType] || 'Gift';
  },

  // Sort items by rarity and price
  sortItems: (items: ShopItem[]): ShopItem[] => {
    const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
    return [...items].sort((a, b) => {
      const rarityDiff = (rarityOrder[b.rarity] || 1) - (rarityOrder[a.rarity] || 1);
      if (rarityDiff !== 0) return rarityDiff;
      return a.price - b.price;
    });
  },

  // Filter items by category and user preferences
  filterItems: (items: ShopItem[], category: string, owned: string[] = []): ShopItem[] => {
    let filtered = category === 'all' ? items : items.filter(item => item.category === category);
    
    // Filter out owned items for non-consumable categories
    const nonConsumableCategories = ['themes', 'avatars', 'badges'];
    if (nonConsumableCategories.includes(category)) {
      filtered = filtered.filter(item => !owned.includes(item.id));
    }
    
    return filtered;
  },
};