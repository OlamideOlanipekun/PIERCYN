// @ts-ignore — resolved from the esbuild bundle produced by build:server
import { app } from '../build/serverless.js';

export default function handler(req: any, res: any) {
  return app(req, res);
}

