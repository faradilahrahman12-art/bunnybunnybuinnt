import { boolean, integer, jsonb, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  type: text('type').notNull().default('resale'), // 'resale' | 'help_to_buy'
  title: text('title').notNull(),
  country: text('country').notNull(),
  dates: text('dates'),
  platform: text('platform'),
  saleInfo: text('sale_info'),
  imageUrl: text('image_url'),
  seatMapUrl: text('seat_map_url'),
  hidden: boolean('hidden').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const eventDates = pgTable('event_dates', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull(),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const dateSections = pgTable('date_sections', {
  id: serial('id').primaryKey(),
  dateId: integer('date_id').notNull(),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull().default(0),
  price: numeric('price', { precision: 10, scale: 2, mode: 'number' }).notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  event: text('event'),
  text: text('text').notNull(),
  images: jsonb('images').notNull().default([]), // string[] of image URLs / data URLs
  hidden: boolean('hidden').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const qrphMerchants = pgTable('qrph_merchants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  qrImageUrl: text('qr_image_url'),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  reference: text('reference').notNull().unique(),
  eventId: integer('event_id'),
  eventTitle: text('event_title').notNull(),
  serviceType: text('service_type').notNull(), // 'resale' | 'help_to_buy'
  country: text('country'),
  dates: text('dates').notNull(), // JSON array of selected date labels
  quantityPerDate: integer('quantity_per_date').notNull().default(1),
  sections: text('sections'), // JSON: { dateLabel: sectionName } selections
  totalAmount: numeric('total_amount', { precision: 10, scale: 2, mode: 'number' }),
  accountEmail: text('account_email').notNull(),
  accountPassword: text('account_password'),
  holderName: text('holder_name').notNull(),
  holderDob: text('holder_dob'),
  contactNumber: text('contact_number').notNull(),
  telegram: text('telegram'),
  instagram: text('instagram'),
  memberships: text('memberships'), // JSON array
  paymentMethod: text('payment_method'),
  paymentMerchant: text('payment_merchant'),
  paymentReference: text('payment_reference'),
  datePaid: text('date_paid'),
  timePaid: text('time_paid'),
  amountSent: numeric('amount_sent', { precision: 10, scale: 2, mode: 'number' }),
  screenshots: text('screenshots'), // JSON array of (compressed) data URLs
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

export type QrphMerchant = typeof qrphMerchants.$inferSelect
export type NewQrphMerchant = typeof qrphMerchants.$inferInsert

export type Review = Omit<typeof reviews.$inferSelect, 'images'> & { images: string[] }
export type NewReview = typeof reviews.$inferInsert

export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type EventDate = typeof eventDates.$inferSelect
export type DateSection = typeof dateSections.$inferSelect

export type ScheduleDate = EventDate & { sections: DateSection[] }
export type EventWithSchedule = Event & { schedule: ScheduleDate[] }
