// server/middleware/authMiddleware.mjs

export const ALLOWED_PARTNERS = {
  mohamed: {
    id: 'mohamed',
    name: 'المهندس محمد البحر',
    email: 'mohamed@tecnolobia.com',
    role: 'Co-Founder & Technical CEO',
    permissions: ['read', 'draft', 'approve_technical', 'view_finances']
  },
  tarek: {
    id: 'tarek',
    name: 'المهندس طارق حافظ',
    email: 'tarek@tecnolobia.com',
    role: 'Co-Founder & Business CEO',
    permissions: ['read', 'draft', 'approve_business', 'view_finances']
  }
};

/**
 * وسيط التحقق الأمني من هوية الشريك الطالب للاستشارة أو تنفيذ الأدوات
 */
export function requirePartnerAuth(req, res, next) {
  const partnerId = req.headers['x-partner-id'] || req.query.partnerId || req.body?.partnerId;
  const authHeader = req.headers['authorization'];

  if (!partnerId) {
    return res.status(401).json({
      success: false,
      error: 'غير مصرح: يجب تحديد هوية الشريك المعتمد (x-partner-id header مطلوب)',
      code: 'AUTH_REQUIRED'
    });
  }

  const partner = ALLOWED_PARTNERS[partnerId];
  if (!partner) {
    return res.status(403).json({
      success: false,
      error: 'مرفوض: الهوية المقدمة لا تطابق أياً من الشريكين المؤسسين لـ TECHNOLOPIA',
      code: 'FORBIDDEN_PARTNER'
    });
  }

  // إرفاق هوية الشريك بالطلب
  req.partner = partner;
  next();
}

/**
 * التحقق من صلاحيات العمليات الحساسة (تتطلب موافقة صريحة من أحد الشريكين)
 */
export function requireFounderApproval(req, res, next) {
  const isApproved = req.body?.coFounderConfirmed === true;
  if (!isApproved) {
    return res.status(400).json({
      success: false,
      error: 'إجراء حساس: يتطلب موافقة صريحة ومسبقة من الشريكين (coFounderConfirmed: true)',
      code: 'FOUNDER_APPROVAL_REQUIRED'
    });
  }
  next();
}
