'use client';

interface BuyNowButtonProps {
  productId: string;
  className?: string;
  text?: string;
  storeUrl?: string;
  openInNewTab?: boolean;
}

export default function BuyNowButton({
  productId,
  className = '',
  text = 'Comprar Ahora',
  storeUrl = 'https://direchentt.mitiendanube.com',
  openInNewTab = true
}: BuyNowButtonProps) {

  const handleClick = () => {
    const productUrl = `${storeUrl}/products/${productId}`;

    if (openInNewTab) {
      window.open(productUrl, '_blank');
    } else {
      window.location.href = productUrl;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors ${className}`}
    >
      {text}
    </button>
  );
}