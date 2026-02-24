import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiReference } from '@scalar/express-api-reference';

import authRoutes from './routes/auth';
import companyRoutes from './routes/company';
import usersRoutes from './routes/users';
import rolesRoutes from './routes/roles';
import applicationsRoutes from './routes/applications';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/docs', apiReference({ url: '/openapi.json', theme: 'default' }));

app.use(errorHandler);
