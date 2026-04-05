import { getLocalizedText } from '@/lib/product-utils';
import { decodeHtmlEntities } from '@/lib/html-text';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function tipFromDescription(description: unknown, fallback: string, maxLen = 140): string {
  const raw = getLocalizedText(description, '');
  if (!raw) return fallback;
  const plain = decodeHtmlEntities(stripHtml(raw));
  if (plain.length <= maxLen) return plain;
  const cut = plain.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

export type RoutineShowcaseStep = {
  stepIndex: number;
  stepLabel: string;
  productName: string;
  tip: string;
  heroImage: string;
  swatchImage: string;
  productId: number;
};

const EXTRA_LABELS = ['COMBINÁ', 'SUMÁ', 'EXTRA', 'CIERRE'];

/**
 * Arma pasos estilo “GET READY” a partir del producto actual y relacionados (API TN).
 */
export function buildRoutineShowcaseSteps(
  mainProduct: any,
  relatedProducts: any[],
  processedMainName: string
): RoutineShowcaseStep[] {
  if (!mainProduct?.id) return [];

  const img = (p: any, i: number) => {
    const list = p?.images;
    if (!Array.isArray(list) || list.length === 0) return '';
    const a = list[0]?.src || list[0]?.url || '';
    const b = list[i]?.src || list[i]?.url || a;
    return typeof b === 'string' ? b : '';
  };

  const steps: RoutineShowcaseStep[] = [];

  steps.push({
    stepIndex: 0,
    stepLabel: 'BASE',
    productName: decodeHtmlEntities(processedMainName),
    tip: tipFromDescription(
      mainProduct.description,
      'Empezá con este esencial como primer paso de tu rutina.'
    ),
    heroImage: img(mainProduct, 0),
    swatchImage: img(mainProduct, 1) || img(mainProduct, 0),
    productId: Number(mainProduct.id),
  });

  const rel = (relatedProducts || []).filter((p) => p && p.id !== mainProduct.id).slice(0, 4);
  rel.forEach((p, i) => {
    const name = decodeHtmlEntities(getLocalizedText(p.name, 'Producto'));
    steps.push({
      stepIndex: i + 1,
      stepLabel: EXTRA_LABELS[i] || `PASO ${i + 2}`,
      productName: name,
      tip: tipFromDescription(
        p.description,
        'Sumá este producto para completar tu look.'
      ),
      heroImage: img(p, 0),
      swatchImage: img(p, 1) || img(p, 0),
      productId: Number(p.id),
    });
  });

  return steps;
}
