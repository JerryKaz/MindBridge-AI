import mongoose from 'mongoose';
import { logger } from '../common/logger.js';

mongoose.set('strictQuery', true);
// NoSQL operator injection is prevented at the edge: every request body, query
// and param is parsed by a Zod schema into primitives before reaching a query.

export async function connectDatabase(uri: string): Promise<typeof mongoose> {
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  logger.info({ db: conn.connection.name }, 'MongoDB connected');
  return conn;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
