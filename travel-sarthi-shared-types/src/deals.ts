// ─── Deals & Coupons Types ────────────────────────────────────────────────────

import type { UUID, ISODateTimeString, MoneyAmount } from './common';
import type { BookingPlatform } from './flights';

export type CouponCategory =
  | 'flight'
  | 'hotel'
  | 'holiday_package'
  | 'bus'
  | 'train'
  | 'cab'
  | 'activities';

export type DiscountType = 'percent' | 'flat' | 'cashback';

export type CardNetwork = 'visa' | 'mastercard' | 'rupay' | 'amex' | 'diners';

export interface Coupon {
  id: UUID;
  code: string;
  title: string;
  description: string;
  category: CouponCategory;
  platform: BookingPlatform | 'all';
  discountType: DiscountType;
  discountValue: number; // percent or flat INR
  maxDiscount: MoneyAmount | null;
  minPurchase: MoneyAmount | null;
  bankName: string | null;
  cardNetwork: CardNetwork | null;
  cardType: 'credit' | 'debit' | 'both' | null;
  isStackable: boolean;
  stackableWith: string[]; // other coupon codes
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  expiresAt: ISODateTimeString | null;
  isActive: boolean;
  isVerified: boolean;
  successRate: number | null; // 0-1
  lastVerifiedAt: ISODateTimeString | null;
  termsAndConditions: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface FlashDeal {
  id: UUID;
  title: string;
  subtitle: string;
  origin: string;
  destination: string;
  imageUrl: string;
  salePrice: MoneyAmount;
  originalPrice: MoneyAmount;
  savingsAmount: MoneyAmount;
  savingsPercent: number;
  platform: BookingPlatform;
  deeplink: string;
  expiresAt: ISODateTimeString;
  seatsLeft: number | null;
  isLive: boolean;
  dealType: 'flash' | 'error_fare' | 'sale' | 'promo';
  travelWindowFrom: string;
  travelWindowTo: string;
  createdAt: ISODateTimeString;
}

// ─── Stacking Engine ──────────────────────────────────────────────────────────

export interface CouponStackResult {
  appliedCoupons: AppliedCoupon[];
  basePrice: MoneyAmount;
  grossDiscount: MoneyAmount;
  netPrice: MoneyAmount;
  totalSavings: MoneyAmount;
  savingsPercent: number;
  isCapped: boolean;
  appliedAt: ISODateTimeString;
}

export interface AppliedCoupon {
  coupon: Coupon;
  discountAmount: MoneyAmount;
  order: number; // application order (stackable)
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface GetDealsRequestDTO {
  category?: CouponCategory;
  platform?: BookingPlatform;
  bankName?: string;
  minDiscount?: number;
  page?: number;
  limit?: number;
}

export interface CalculateCouponsRequestDTO {
  couponCodes: string[];
  basePrice: number;
  currency: string;
  category: CouponCategory;
  platform: BookingPlatform;
}

export interface FlashDealFeedResponseDTO {
  deals: FlashDeal[];
  lastUpdated: ISODateTimeString;
  activeCount: number;
}
