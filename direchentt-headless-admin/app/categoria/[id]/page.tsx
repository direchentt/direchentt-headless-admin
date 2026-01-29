import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ModalsWrapper from '../../components/ModalsWrapper';
import CategoryGrid from '../../components/CategoryGrid';
import { getStoreData, fetchTN, processProducts } from '../../../lib/backend';

interface CategoryPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ shop?: string; sort?: string; grid?: string; page?: string }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const storeId = query.shop || "5112334";
  
  const storeLocal = await getStoreData(storeId);
  if (!storeLocal) return null;

  // Construir query para productos de la categoría
  // TiendaNube usa category_id para filtrar
  let apiQuery = `&category_id=${id}`;
  if (query.sort) apiQuery += `&sort_by=${query.sort}`;

  // Fetch productos de la categoría, categorías y info de la tienda
  const [productsRaw, categories, storeInfo] = await Promise.all([
    fetchTN('products', storeLocal.storeId, storeLocal.accessToken, apiQuery),
    fetchTN('categories', storeLocal.storeId, storeLocal.accessToken),
    fetchTN('', storeLocal.storeId, storeLocal.accessToken) // Info general de la tienda
  ]);

  const products = processProducts(productsRaw);
  
  // Obtener nombre de la categoría actual
  const currentCategory = categories.find((c: any) => String(c.id) === String(id));
  const categoryName = currentCategory 
    ? (typeof currentCategory.name === 'object' 
        ? (currentCategory.name.es || currentCategory.name.en || 'Categoría')
        : (currentCategory.name || 'Categoría'))
    : 'Categoría';

  // Extraer info de pagos/cuotas de la tienda (si está disponible)
  const paymentInfo = storeInfo?.payment_methods || [];
  const installmentsInfo = storeInfo?.installments || [];

  return (
    <main style={{ backgroundColor: '#ffffff', color: '#000', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', minHeight: '100vh' }}>
      <ModalsWrapper products={products} storeId={storeLocal.storeId} />
      
      <Header 
        logo={storeLocal.logo} 
        storeId={storeLocal.storeId} 
        domain={storeLocal.domain}
        categories={categories}
      />
      
      <CategoryGrid 
        products={products}
        storeId={storeLocal.storeId}
        categoryName={categoryName}
        categoryId={id}
        initialGrid={query.grid ? parseInt(query.grid) : 4}
        currentSort={query.sort || ''}
        paymentInfo={paymentInfo}
        installmentsInfo={installmentsInfo}
      />
      
      <Footer 
        logo={storeLocal.logo} 
        storeName={storeLocal.name || 'DIRECHENTT'}
      />
    </main>
  );
}
