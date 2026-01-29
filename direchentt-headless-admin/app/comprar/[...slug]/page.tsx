import { redirect } from 'next/navigation';
import { getStoreData } from '../../../lib/backend';

export default async function BuyPermalinkPage({ params, searchParams }: any) {
  const { slug } = await params;
  const shopId = (await searchParams).shop || "5112334";
  const storeLocal = await getStoreData(shopId);
  
  if (!storeLocal) redirect('/');

  const rawParams = slug[0]; 
  const parts = rawParams.split('-');
  
  // Para el Checkout v3, el formato más compatible para un salto externo 
  // es construir el add-to-cart que Tiendanube transforma automáticamente en checkout
  let cartQuery = "";
  for (let i = 0; i < parts.length; i += 2) {
    const variantId = parts[i];
    const quantity = parts[i + 1] || "1";
    cartQuery += `${variantId}:${quantity}${i + 2 < parts.length ? ',' : ''}`;
  }

  // La URL de "permalink" fuerza a Tiendanube a crear el objeto Checkout (v3) 
  // y redirigir al usuario a la URL con el hash: /checkout/v3/start/...
  const checkoutUrl = `https://${storeLocal.domain}/cart/add/${cartQuery}?storefront=permalink&from_store=1&country=AR`;
  
  redirect(checkoutUrl);
}
