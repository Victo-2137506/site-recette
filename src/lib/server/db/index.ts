import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = mysql.createPool(env.DATABASE_URL);

// Drizzle permet d'utiliser MySQL avec le schéma défini dans schema.ts
export const db = drizzle(client, { schema, mode: 'default' });
