import Image from "@/components/ProtectedImage";

const FADE = "linear-gradient(180deg, #000 55%, transparent 100%)";

/**
 * Decorative photo behind a page's dark header band. A side gradient keeps the heading's contrast
 * (darkest behind the text) and a mask fades the photo out at the bottom, so it melts into whatever
 * background the page has instead of ending in a hard edge.
 * The parent must be `relative overflow-hidden` and its content `relative` so it paints on top.
 */
export default function PageHeroBackdrop({ src, position = "center" }: { src: string; position?: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ maskImage: FADE, WebkitMaskImage: FADE }}
    >
      <Image
        fill
        src={src}
        alt=""
        auditIgnore
        loading="eager"
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: position, opacity: 0.62 }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(7,14,26,0.9) 0%, rgba(7,14,26,0.7) 45%, rgba(7,14,26,0.25) 100%)",
        }}
      />
    </div>
  );
}
