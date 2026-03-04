import Image from 'next/image';

export default function Logo({ size = 32, variant = 'icon' }) {
  const src = variant === 'full' ? '/logo.svg' : '/icon.svg';
  const width = variant === 'full' ? size * 4 : size;
  return (
    <Image
      src={src}
      alt="Conduit AI"
      width={width}
      height={size}
      priority
    />
  );
}
