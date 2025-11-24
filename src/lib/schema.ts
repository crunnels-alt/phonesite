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

// Export types
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Writing = typeof writings.$inferSelect;
export type NewWriting = typeof writings.$inferInsert;
