import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Extensiones de imagen soportadas
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

export async function GET() {
  try {
    const bannersDir = path.join(process.cwd(), 'public', 'banners');
    
    // Verificar si la carpeta existe
    if (!fs.existsSync(bannersDir)) {
      return NextResponse.json({ banners: [], message: 'Carpeta de banners no existe' });
    }
    
    // Leer archivos de la carpeta
    const files = fs.readdirSync(bannersDir);
    
    // Filtrar solo imágenes
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });
    
    // Convertir a rutas públicas
    const bannerUrls = imageFiles.map(file => `/banners/${file}`);
    
    // Mezclar aleatoriamente (Fisher-Yates shuffle)
    for (let i = bannerUrls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bannerUrls[i], bannerUrls[j]] = [bannerUrls[j], bannerUrls[i]];
    }
    
    return NextResponse.json({ 
      banners: bannerUrls,
      count: bannerUrls.length 
    });
  } catch (error: any) {
    console.error('Error leyendo banners:', error);
    return NextResponse.json({ banners: [], error: error.message }, { status: 500 });
  }
}
