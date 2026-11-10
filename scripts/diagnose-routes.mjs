const routes = [
  '/',
  '/shop',
  '/products',
  '/products/character-tees-6eacac16',
  '/product/character-tees-6eacac16',
  '/checkout',
  '/cart',
  '/account',
  '/admin',
  '/affiliate',
  '/affiliate/login',
  '/affiliate/register',
  '/login',
  '/shipping',
  '/returns',
  '/men',
  '/women',
  '/new',
  '/accessories',
  '/lookbook',
  '/collections',
  '/about',
  '/faq',
  '/search',
  '/non-existent-route-123'
];

async function testAll() {
  for (const r of routes) {
    try {
      const res = await fetch('https://piercyn.vercel.app' + r, { redirect: 'manual' });
      const text = await res.text();
      const isVercel404 = text.includes('NOT_FOUND') && text.includes('The page could not be found');
      const isApp404 = text.includes('This PIERCYN page does not exist');
      console.log(r.padEnd(35), res.status, isVercel404 ? 'VERCEL_EDGE_404' : (isApp404 ? 'APP_404' : (res.status === 200 ? 'OK' : `STATUS_${res.status}`)));
    } catch (e) {
      console.log(r.padEnd(35), 'ERROR:', e.message);
    }
  }
}

testAll();

