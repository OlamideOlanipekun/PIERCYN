import { app } from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[PIERCYN COMMERCE BACKEND] running on http://0.0.0.0:${PORT}`);
  console.log(`[PIERCYN API] Available at http://localhost:${PORT}/api/products`);
});
