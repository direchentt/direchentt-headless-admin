"use client";
import dynamic from 'next/dynamic';

const EmailPopup = dynamic(() => import('./EmailPopup'), { ssr: false });

export default function EmailPopupWrapper() {
  return <EmailPopup />;
}