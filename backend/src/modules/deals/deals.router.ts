import { Router } from 'express';
import { z } from 'zod';
import { eq, and, or, gt, lte, isNull, desc, ilike } from 'drizzle-orm';
import { validateBody, validateQuery } from '../../middleware/validate';
import { optionalAuth } from '../../middleware/auth';
import { sendSuccess, buildPaginationMeta } from '../../shared/response';
import { db } from '../../config/database';
import { coupons, flashDeals } from '../../db/schema/deals';

const router = Router();

const couponsQuerySchema = z.object({
  category: z.enum(['flight', 'hotel', 'holiday_package', 'bus', 'train', 'cab', 'activities']).optional(),
  platform: z.string().optional(),
  bankName: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const calculateSchema = z.object({
  couponCodes: z.array(z.string()).min(1).max(5),
  basePrice: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  category: z.enum(['flight', 'hotel', 'holiday_package', 'bus', 'train', 'cab', 'activities']),
  platform: z.string(),
});

// GET /api/deals/coupons
router.get('/coupons', optionalAuth, validateQuery(couponsQuerySchema), async (req, res, next) => {
  try {
    const q = req.query as z.infer<typeof couponsQuerySchema>;
    const page = q.page;
    const limit = q.limit;
    const offset = (page - 1) * limit;
    const now = new Date();

    const conditions = [
      eq(coupons.isActive, true),
      or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now)),
    ];

    if (q.category) conditions.push(eq(coupons.category, q.category));
    if (q.platform) conditions.push(or(eq(coupons.platform, q.platform), eq(coupons.platform, 'all'))!);
    if (q.bankName) conditions.push(ilike(coupons.bankName!, `%${q.bankName}%`));

    const results = await db
      .select()
      .from(coupons)
      .where(and(...conditions))
      .orderBy(desc(coupons.isVerified), desc(coupons.successRate))
      .limit(limit)
      .offset(offset);

    sendSuccess(
      res,
      results.map(formatCoupon),
      200,
      buildPaginationMeta(results.length, page, limit),
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/deals/flash
router.get('/flash', optionalAuth, async (req, res, next) => {
  try {
    const now = new Date();

    const deals = await db
      .select()
      .from(flashDeals)
      .where(and(eq(flashDeals.isLive, true), gt(flashDeals.expiresAt, now)))
      .orderBy(desc(flashDeals.createdAt))
      .limit(20);

    sendSuccess(res, {
      deals: deals.map(formatFlashDeal),
      lastUpdated: new Date().toISOString(),
      activeCount: deals.length,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/deals/calculate
router.post('/calculate', validateBody(calculateSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof calculateSchema>;
    const now = new Date();

    const applicableCoupons = await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.isActive, true),
          or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now))!,
        ),
      );

    const filtered = applicableCoupons.filter((c) =>
      body.couponCodes.includes(c.code) &&
      (c.platform === 'all' || c.platform === body.platform) &&
      (c.category === body.category),
    );

    let remainingPrice = body.basePrice;
    let grossDiscount = 0;
    const applied: { coupon: ReturnType<typeof formatCoupon>; discountAmount: { amount: number; currency: string; formatted: string }; order: number }[] = [];

    for (let i = 0; i < filtered.length; i++) {
      const coupon = filtered[i];
      if (!coupon) continue;

      if (coupon.minPurchaseAmount && remainingPrice < coupon.minPurchaseAmount) continue;

      let discount = 0;
      if (coupon.discountType === 'percent') {
        discount = (remainingPrice * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
      } else if (coupon.discountType === 'flat') {
        discount = coupon.discountValue;
      } else if (coupon.discountType === 'cashback') {
        discount = Math.min((remainingPrice * coupon.discountValue) / 100, coupon.maxDiscountAmount ?? Infinity);
      }

      discount = Math.min(discount, remainingPrice);
      grossDiscount += discount;
      remainingPrice -= discount;

      applied.push({
        coupon: formatCoupon(coupon),
        discountAmount: { amount: discount, currency: 'INR', formatted: `₹${discount.toLocaleString('en-IN')}` },
        order: i + 1,
      });

      if (!coupon.isStackable) break;
    }

    sendSuccess(res, {
      appliedCoupons: applied,
      basePrice: { amount: body.basePrice, currency: 'INR', formatted: `₹${body.basePrice.toLocaleString('en-IN')}` },
      grossDiscount: { amount: grossDiscount, currency: 'INR', formatted: `₹${grossDiscount.toLocaleString('en-IN')}` },
      netPrice: { amount: remainingPrice, currency: 'INR', formatted: `₹${remainingPrice.toLocaleString('en-IN')}` },
      totalSavings: { amount: grossDiscount, currency: 'INR', formatted: `₹${grossDiscount.toLocaleString('en-IN')}` },
      savingsPercent: body.basePrice > 0 ? Math.round((grossDiscount / body.basePrice) * 100) : 0,
      isCapped: false,
      appliedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

function formatCoupon(c: typeof coupons.$inferSelect) {
  return {
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description,
    category: c.category,
    platform: c.platform,
    discountType: c.discountType,
    discountValue: c.discountValue,
    maxDiscount: c.maxDiscountAmount ? { amount: c.maxDiscountAmount, currency: 'INR', formatted: `₹${c.maxDiscountAmount.toLocaleString('en-IN')}` } : null,
    minPurchase: c.minPurchaseAmount ? { amount: c.minPurchaseAmount, currency: 'INR', formatted: `₹${c.minPurchaseAmount.toLocaleString('en-IN')}` } : null,
    bankName: c.bankName,
    cardNetwork: c.cardNetwork,
    cardType: c.cardType,
    isStackable: c.isStackable,
    stackableWith: c.stackableWith,
    isVerified: c.isVerified,
    successRate: c.successRate,
    expiresAt: c.expiresAt?.toISOString() ?? null,
    termsAndConditions: c.termsAndConditions,
  };
}

function formatFlashDeal(d: typeof flashDeals.$inferSelect) {
  const savings = d.originalPriceAmount - d.salePriceAmount;
  return {
    id: d.id,
    title: d.title,
    subtitle: d.subtitle,
    origin: d.origin,
    destination: d.destination,
    imageUrl: d.imageUrl,
    salePrice: { amount: d.salePriceAmount, currency: d.salePriceCurrency, formatted: `₹${d.salePriceAmount.toLocaleString('en-IN')}` },
    originalPrice: { amount: d.originalPriceAmount, currency: d.salePriceCurrency, formatted: `₹${d.originalPriceAmount.toLocaleString('en-IN')}` },
    savingsAmount: { amount: savings, currency: d.salePriceCurrency, formatted: `₹${savings.toLocaleString('en-IN')}` },
    savingsPercent: Math.round((savings / d.originalPriceAmount) * 100),
    platform: d.platform,
    deeplink: d.deeplink,
    expiresAt: d.expiresAt.toISOString(),
    seatsLeft: d.seatsLeft,
    isLive: d.isLive,
    dealType: d.dealType,
    travelWindowFrom: d.travelWindowFrom,
    travelWindowTo: d.travelWindowTo,
  };
}

export { router as dealsRouter };
