/**
 * Shared TypeScript interfaces for the eSchoolKart API.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'vendor' | 'school' | 'student';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export type ProductCategory =
  | 'shirt'
  | 'trouser'
  | 'skirt'
  | 'blazer'
  | 'tie'
  | 'belt'
  | 'shoes'
  | 'socks'
  | 'sweater'
  | 'jacket'
  | 'tracksuit'
  | 'shorts'
  | 'other';

export type ProductGender = 'boys' | 'girls' | 'unisex';

export type SchoolApprovalStatus = 'pending' | 'approved' | 'rejected';

// ─── User & Auth ─────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  can_manage_vendors?: boolean;
  can_manage_schools?: boolean;
  can_manage_students?: boolean;
  can_manage_content?: boolean;
  can_manage_reports?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

// ─── Vendor ───────────────────────────────────────────────────────────────────

export interface Vendor {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  business_name: string;
  gst_number: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  logo: string | null;
  is_approved: boolean;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── School ───────────────────────────────────────────────────────────────────

export interface School {
  id: number;
  vendor: number;
  vendor_name: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contact_email: string;
  contact_phone: string;
  logo: string | null;
  is_active: boolean;
  approval_status: SchoolApprovalStatus;
  rejection_reason: string;
  applied_at: string;
  approved_at: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Student Profile ──────────────────────────────────────────────────────────

export interface StudentProfile {
  id: number;
  parent: number;
  school: number;
  school_name: string;
  student_name: string;
  class_name: string;
  section: string;
  roll_number: string;
  student_id: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Product & Inventory ──────────────────────────────────────────────────────

export interface ProductInventory {
  id: number;
  size: string;
  color: string;
  price_override: string | null;
  quantity: number;
  effective_price: string;
}

export interface ProductImage {
  id: number;
  image: string;
  caption: string;
  is_primary: boolean;
  order: number;
  created_at: string;
}

export interface Product {
  id: number;
  vendor: number;
  vendor_name: string;
  school: number | null;
  school_name: string | null;
  name: string;
  description: string;
  sku: string;
  category: ProductCategory;
  gender: ProductGender;
  base_price: string;
  material: string;
  care_instructions: string;
  tags: string;
  image: string | null;
  images: ProductImage[];
  primary_image_url: string | null;
  is_active: boolean;
  inventory: ProductInventory[];
  created_at: string;
  updated_at: string;
}

// ─── Order ─────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: number;
  inventory: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface Order {
  id: number;
  order_number: string;
  student_profile: number;
  student_name: string;
  school: number;
  school_name: string;
  vendor: number;
  vendor_name: string;
  status: OrderStatus;
  subtotal: string;
  tax_amount: string;
  shipping_amount: string;
  total_amount: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_phone: string;
  notes: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface Payment {
  id: number;
  order: number;
  gateway: string;
  gateway_order_id: string;
  gateway_payment_id: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
}

// ─── API Pagination ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Vendor Dashboard ──────────────────────────────────────────────────────────

export interface VendorDashboard {
  schools: { approved: number; pending: number };
  products: { active: number; total_variants: number; low_stock: number; out_of_stock: number };
  orders: { pending: number; processing: number };
  revenue: { this_month: number; total: number };
  recent_orders: Order[];
}

// ─── Cart (client-side only) ──────────────────────────────────────────────────

export interface CartItem {
  productId: number;
  inventoryId: number;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  image?: string | null;
  schoolId?: number;
}
