'use client';

import { useEffect, useState } from 'react';

const PROPORCAO_MOLDURA = 16 / 9;

type Props = {
  src: string;
  alt: string;
  posicaoX?: number | null;
  posicaoY?: number | null;
  zoom?: number | null;
};

export function CatalogoImagemEnquadrada({ src, alt, posicaoX, posicaoY, zoom }: Props) {
  const x = limitarPercentual(posicaoX);
  const y = limitarPercentual(posicaoY);
  const zoomNormalizado = limitarZoom(zoom);
  const [escalaCobertura, setEscalaCobertura] = useState(1);
  const [carregada, setCarregada] = useState(false);
  const escala = calcularEscalaEnquadramento(zoomNormalizado, escalaCobertura);

  useEffect(() => {
    setEscalaCobertura(1);
    setCarregada(false);
  }, [src]);

  return (
    <>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-xl"
        style={{ objectPosition: `${x}% ${y}%` }}
      />
      <div className="absolute inset-0 bg-[#153B31]/10" aria-hidden="true" />
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full max-w-none object-contain drop-shadow-[0_5px_14px_rgba(13,42,33,0.20)] transition-[opacity,transform] duration-200 ${carregada ? 'opacity-100' : 'opacity-0'}`}
        style={{
          objectPosition: `${x}% ${y}%`,
          transform: `scale(${escala})`,
          transformOrigin: `${x}% ${y}%`,
        }}
        onLoad={(event) => {
          const imagem = event.currentTarget;
          setEscalaCobertura(calcularEscalaCobertura(imagem.naturalWidth, imagem.naturalHeight));
          setCarregada(true);
        }}
      />
    </>
  );
}

export function calcularEscalaEnquadramento(zoom: number, escalaCobertura: number) {
  const zoomNormalizado = limitarZoom(zoom);
  const cobertura = Math.max(1, escalaCobertura);
  if (zoomNormalizado <= 100) {
    const progresso = (zoomNormalizado - 60) / 40;
    return 1 + (cobertura - 1) * progresso;
  }
  return cobertura * (zoomNormalizado / 100);
}

export function calcularEscalaCobertura(larguraNatural: number, alturaNatural: number) {
  if (larguraNatural <= 0 || alturaNatural <= 0) return 1;
  const proporcaoImagem = larguraNatural / alturaNatural;
  return Math.max(proporcaoImagem / PROPORCAO_MOLDURA, PROPORCAO_MOLDURA / proporcaoImagem);
}

function limitarPercentual(value: unknown) {
  const numero = Number(value);
  return Number.isFinite(numero) ? Math.min(100, Math.max(0, Math.round(numero))) : 50;
}

function limitarZoom(value: unknown) {
  const numero = Number(value);
  return Number.isFinite(numero) ? Math.min(180, Math.max(60, Math.round(numero))) : 100;
}
