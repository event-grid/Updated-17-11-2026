import Image from "next/image";

/**
 * The EVENTGRID logo emblem (owner-supplied artwork) in a circle. The artwork's background is the brand plum, so it
 * blends into the circle; a little padding keeps the lettering clear of the curved edge. Size it with `className`
 * (for example "size-12"); it is always square so it stays a circle.
 */
export function BrandMark({ className = "size-14" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 overflow-hidden rounded-full bg-plum ring-1 ring-champagne/40 ${className}`}>
      <Image
        src="/images/brand/eventgrid-emblem.jpg"
        alt="EVENTGRID"
        width={450}
        height={340}
        priority
        className="size-full object-contain p-[5%]"
      />
    </span>
  );
}
