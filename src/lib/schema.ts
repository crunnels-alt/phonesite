import { pgTable, text, integer, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

// Photos table
export const photos = pgTable('photos', {
  id: uuid('id').primaryKey(),
  url: text('url').notNull(),
  title: text('title').notNull(),
  location: text('location').notNull().default(''),
  date: text('date').notNull(),
  width: integer('width').notNull().default(1600),
  height: integer('height').notNull().default(1200),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  position: jsonb('position').$type<{
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  }>(),
});

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  excerpt: text('excerpt').notNull(),
  tech: text('tech').notNull().default(''),
  year: text('year').notNull(),
  status: text('status').notNull(),
  position: jsonb('position').$type<{
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Writings table
export const writings = pgTable('writings', {
  id: uuid('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  excerpt: text('excerpt').notNull(),
  date: text('date').notNull(),
  category: text('category').notNull().default('GENERAL'),
  position: jsonb('position').$type<{
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Readwise Books table (sources: kindle, web articles, podcasts, etc.)
export const readwiseBooks = pgTable('readwise_books', {
  id: integer('id').primaryKey(), // Readwise's book ID
  title: text('title').notNull(),
  author: text('author').notNull().default(''),
  category: text('category').notNull().default(''), // books, articles, podcasts, etc.
  source: text('source').notNull().default(''), // kindle, web, etc.
  coverImageUrl: text('cover_image_url'),
  sourceUrl: text('source_url'),
  asin: text('asin'),
  numHighlights: integer('num_highlights').notNull().default(0),
  lastHighlightAt: timestamp('last_highlight_at'),
  tags: jsonb('tags').$type<{ id: number; name: string }[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Readwise Highlights table
export const readwiseHighlights = pgTable('readwise_highlights', {
  id: integer('id').primaryKey(), // Readwise's highlight ID
  bookId: integer('book_id').notNull().references(() => readwiseBooks.id),
  text: text('text').notNull(),
  note: text('note').default(''),
  location: integer('location'),
  locationType: text('location_type').default(''),
  highlightedAt: timestamp('highlighted_at'),
  url: text('url'),
  color: text('color').default('yellow'),
  tags: jsonb('tags').$type<{ id: number; name: string }[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Export types
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Writing = typeof writings.$inferSelect;
export type NewWriting = typeof writings.$inferInsert;

export type ReadwiseBook = typeof readwiseBooks.$inferSelect;
export type NewReadwiseBook = typeof readwiseBooks.$inferInsert;

export type ReadwiseHighlight = typeof readwiseHighlights.$inferSelect;
export type NewReadwiseHighlight = typeof readwiseHighlights.$inferInsert;
