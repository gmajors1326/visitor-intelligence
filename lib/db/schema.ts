import { pgTable, text, integer, timestamp, boolean, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createId } from '@paralleldrive/cuid2';

export const visitors = pgTable('visitors', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionId: text('session_id').notNull(),
  ipHash: varchar('ip_hash', { length: 64 }),
  userAgentHash: varchar('user_agent_hash', { length: 64 }),
  referer: text('referer'),
  url: text('url').notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  headers: jsonb('headers'),
  country: varchar('country', { length: 2 }),
  city: varchar('city', { length: 255 }),
  deviceType: varchar('device_type', { length: 50 }),
  browser: varchar('browser', { length: 100 }),
  os: varchar('os', { length: 100 }),
  isBot: boolean('is_bot').default(false),
  isAI: boolean('is_ai').default(false),
  botName: varchar('bot_name', { length: 100 }),
  score: integer('score').default(0),
  isHotSession: boolean('is_hot_session').default(false),
  consentGiven: boolean('consent_given').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index('session_idx').on(table.sessionId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
  isBotIdx: index('is_bot_idx').on(table.isBot),
  isHotSessionIdx: index('is_hot_session_idx').on(table.isHotSession),
}));

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionId: text('session_id').notNull().unique(),
  ipHash: varchar('ip_hash', { length: 64 }),
  userAgentHash: varchar('user_agent_hash', { length: 64 }),
  firstSeen: timestamp('first_seen').defaultNow().notNull(),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
  pageViews: integer('page_views').default(1),
  score: integer('score').default(0),
  isHot: boolean('is_hot').default(false),
  country: varchar('country', { length: 2 }),
  deviceType: varchar('device_type', { length: 50 }),
  consentGiven: boolean('consent_given').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index('session_id_idx').on(table.sessionId),
  lastSeenIdx: index('last_seen_idx').on(table.lastSeen),
  isHotIdx: index('is_hot_idx').on(table.isHot),
}));

export const alerts = pgTable('alerts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: varchar('type', { length: 50 }).notNull(), // 'hot_session', 'ai_detected', 'bot_activity', etc.
  severity: varchar('severity', { length: 20 }).notNull(), // 'low', 'medium', 'high', 'critical'
  title: text('title').notNull(),
  message: text('message'),
  sessionId: text('session_id'),
  visitorId: text('visitor_id'),
  metadata: jsonb('metadata'),
  isRead: boolean('is_read').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('alert_type_idx').on(table.type),
  severityIdx: index('alert_severity_idx').on(table.severity),
  createdAtIdx: index('alert_created_at_idx').on(table.createdAt),
  isReadIdx: index('alert_is_read_idx').on(table.isRead),
}));

export const heatmapData = pgTable('heatmap_data', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionId: text('session_id').notNull(),
  url: text('url').notNull(),
  x: integer('x'),
  y: integer('y'),
  element: text('element'),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'click', 'move', 'scroll'
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index('heatmap_session_idx').on(table.sessionId),
  urlIdx: index('heatmap_url_idx').on(table.url),
  timestampIdx: index('heatmap_timestamp_idx').on(table.timestamp),
}));

export const dailyDigests = pgTable('daily_digests', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  date: timestamp('date').notNull(),
  totalVisitors: integer('total_visitors').default(0),
  uniqueSessions: integer('unique_sessions').default(0),
  pageViews: integer('page_views').default(0),
  botsDetected: integer('bots_detected').default(0),
  aiDetected: integer('ai_detected').default(0),
  hotSessions: integer('hot_sessions').default(0),
  topPages: jsonb('top_pages'),
  topCountries: jsonb('top_countries'),
  topDevices: jsonb('top_devices'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  dateIdx: index('digest_date_idx').on(table.date),
}));

export type Visitor = typeof visitors.$inferSelect;
export type NewVisitor = typeof visitors.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type HeatmapData = typeof heatmapData.$inferSelect;
export type NewHeatmapData = typeof heatmapData.$inferInsert;
export const adminSettings = pgTable('admin_settings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  backupCodes: jsonb('backup_codes'), // Array of backup codes
  passwordHistory: jsonb('password_history'), // Array of password hashes (last 5)
  lastPasswordChange: timestamp('last_password_change'),
  sessionTimeout: integer('session_timeout').default(60 * 60 * 24 * 7), // 7 days in seconds
  allowedIPs: jsonb('allowed_ips'), // Array of allowed IP addresses (optional)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type AdminSettings = typeof adminSettings.$inferSelect;
export type NewAdminSettings = typeof adminSettings.$inferInsert;
export type DailyDigest = typeof dailyDigests.$inferSelect;
export type NewDailyDigest = typeof dailyDigests.$inferInsert;
