import request from 'supertest';
import { app } from '../src/app';

export async function loginAs(email: string, password = 'password123') {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return {
    accessToken: res.body.data.accessToken as string,
    cookie: res.headers['set-cookie'][0] as string,
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
