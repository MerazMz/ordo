// ============================================
// ORDO — Type Definitions
// ============================================

// ---------- User & Auth ----------

export type UserRole = 'student' | 'shopkeeper' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
}

export interface Student extends User {
  role: 'student';
  college?: string;
  totalOrders: number;
  totalSpent: number;
}

export interface Shopkeeper extends User {
  role: 'shopkeeper';
  shopId: string;
}

// ---------- Shop ----------

export type ShopStatus = 'open' | 'closed' | 'busy';

export interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  ownerId: string;
  ownerName: string;
  rating: number;
  totalRatings: number;
  status: ShopStatus;
  queueLength: number;
  estimatedWaitMinutes: number;
  operatingHoursOpen: string;
  operatingHoursClose: string;
  services: string[];
  pricePerPageBW: number;
  pricePerPageColor: number;
  bindingPrice: number;
  spiralPrice: number;
  laminationPrice: number;
  staplePrice: number;
  bondPaperPrice: number;
  disabledServices?: string[];
  customServices?: {
    id: string;
    name: string;
    price: number;
  }[];
  isVerified: boolean;
  image?: string;
  imageUrl?: string | null;
  totalRevenue: number;
  totalOrders: number;
  commission: number;
  createdAt: string;
}

// ---------- Print Options ----------

export type PrintColor = 'bw' | 'color' | 'mixed';
export type PrintSide = 'single' | 'double';
export type PaperSize = 'A4' | 'A3';
export type Orientation = 'portrait' | 'landscape';

export interface SelectedService {
  id: string;
  name: string;
  price: number;
}

export interface PrintOptions {
  color: PrintColor;
  side: PrintSide;
  copies: number;
  copiesBW: number;
  copiesColor: number;
  pageRange: string; // e.g. "1-48" or "all"
  paperSize: PaperSize;
  orientation: Orientation;
  staple: boolean;
  spiralBinding: boolean;
  lamination: boolean;
  bondPaper: boolean;
  customServices?: SelectedService[];
}

// ---------- Uploaded File ----------

export interface UploadedFile {
  id: string;
  name: string;
  size: number; // bytes
  type: string; // mime type
  pages: number;
  preview?: string; // data URL or object URL
  printOptions: PrintOptions;
  price: number;
  fileData?: string; // Base64 string of file data
}

// ---------- Order ----------

export type OrderStatus = 'waiting' | 'printing' | 'ready' | 'collected' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'upi' | 'card' | 'netbanking';

export interface OrderItem {
  fileId: string;
  fileName: string;
  pages: number;
  printOptions: PrintOptions;
  price: number;
  fileData?: string; // Base64 string of file data
}

export interface Order {
  id: string;
  orderId: string; // display ID like "ORD-2024-001"
  studentId: string;
  studentName: string;
  studentPhone: string;
  shopId: string;
  shopName: string;
  items: OrderItem[];
  totalPages: number;
  totalAmount: number;
  bindingTotal: number;
  printingTotal: number;
  status: OrderStatus;
  queueNumber: number;
  estimatedWaitMinutes: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  cancellationMessage?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ---------- Queue ----------

export interface QueueItem {
  orderId: string;
  queueNumber: number;
  studentName: string;
  studentPhone: string;
  files: {
    name: string;
    pages: number;
  }[];
  totalPages: number;
  printType: string; // "B&W, Single Side"
  copies: number;
  binding: string; // "Spiral" or "Staple" or "None"
  amount: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
}

// ---------- Payment ----------

export interface Payment {
  id: string;
  orderId: string;
  studentName: string;
  shopName: string;
  amount: number;
  platformFee: number;
  shopReceived: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: string;
}

// ---------- Notification ----------

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

// ---------- Analytics ----------

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  averageWaitTime: number;
  totalPagesPrinted: number;
}

export interface AdminStats {
  totalShops: number;
  totalStudents: number;
  todayOrders: number;
  todayRevenue: number;
  platformRevenue: number;
  commissionEarned: number;
  pendingShops: number;
  failedPayments: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface PeakHour {
  hour: number;
  orders: number;
}

export interface PopularService {
  name: string;
  count: number;
  percentage: number;
}

export interface ShopAnalytics {
  shopId: string;
  shopName: string;
  totalRevenue: number;
  totalOrders: number;
  averageQueueTime: number;
  rating: number;
}

// ---------- Support ----------

export type SupportStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface SupportRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  subject: string;
  message: string;
  status: SupportStatus;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- Settings ----------

export interface PlatformSettings {
  commissionPercentage: number;
  basePriceBW: number;
  basePriceColor: number;
  baseBindingPrice: number;
  baseSpiralPrice: number;
  baseLaminationPrice: number;
  baseStaplePrice: number;
}

export interface CouponCode {
  id: string;
  code: string;
  discountPercentage: number;
  maxDiscount: number;
  minOrder: number;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export interface BannerAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'promo' | 'warning';
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}
