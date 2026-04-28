import Image from "next/image";
import { User } from "lucide-react";

interface CommentAvatarProps {
  src: string;
  alt: string;
  size?: number;
}

export function CommentAvatar({ src, alt, size = 32 }: CommentAvatarProps) {
  const dim = `${size}px`;
  
  return src ? (
    <div className="relative rounded-full overflow-hidden shrink-0 ring-1 ring-border" style={{ width: dim, height: dim, minWidth: dim }}>
      <Image src={src} alt={alt} fill className="object-cover" sizes={dim} />
    </div>
  ) : (
    <div className="rounded-full bg-muted flex items-center justify-center shrink-0 ring-1 ring-border" style={{ width: dim, height: dim, minWidth: dim }}>
      <User style={{ width: size * 0.45, height: size * 0.45 }} className="text-muted-foreground" />
    </div>
  );
}
