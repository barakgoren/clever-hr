import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

const colorMap = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
];

function getColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return colorMap[Math.abs(hash) % colorMap.length];
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeMap[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold select-none',
        sizeMap[size],
        getColor(name),
        className
      )}
    >
      {getInitials(name)}
    </span>
  );
}
