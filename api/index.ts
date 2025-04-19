import { app } from '../src/app.js';
import { NowRequest, NowResponse } from '@vercel/node';

export default function handler(req: NowRequest, res: NowResponse) {
  app(req, res); // Call Express app, don't return its result
}
