import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/cn";
import markAsset from "../../../public/brand/vantor-mark.png";
import bannerAsset from "../../../public/brand/vantor-banner.png";

/*
 * Vantor brand lockups, rendered from the supplied original assets in
 * public/brand/ (white artwork on a pure-black ground):
 * - vantor-mark.png: the primary V mark
 * - vantor-banner.png: the VANTOR / CAPITAL MARKETS banner lockup
 *
 * The files are used exactly as supplied. Two rendering techniques make
 * them sit on the UI without touching the artwork:
 * - mix-blend-mode: screen composites the black ground onto whatever
 *   surface is underneath (canvas, deep, paper), so no dark rectangle
 *   shows on the near-black theme.
 * - Each image is proportionally scaled and cropped to its measured
 *   content bounds, so layout sizes refer to the visible artwork, not
 *   the file's built-in margins. Measured bounds (px, in-file):
 *   mark 233,210-1056,957 (1254x1254); banner 259,183-1960,548 (2172x724).
 */

type Bounds = { xf: number; yf: number; wf: number; hf: number };

const MARK_BOUNDS: Bounds = { xf: 233 / 1254, yf: 210 / 1254, wf: 823 / 1254, hf: 747 / 1254 };
const BANNER_BOUNDS: Bounds = { xf: 259 / 2172, yf: 183 / 724, wf: 1701 / 2172, hf: 365 / 724 };

function BrandImage({
  asset,
  bounds,
  height,
  sizes,
  priority = false,
  alt = "",
}: {
  asset: StaticImageData;
  bounds: Bounds;
  height: number;
  sizes: string;
  priority?: boolean;
  alt?: string;
}) {
  const imgH = height / bounds.hf;
  const imgW = imgH * (asset.width / asset.height);
  const boxW = imgW * bounds.wf;
  return (
    <span
      className="relative block shrink-0 overflow-hidden"
      style={{ width: boxW, height }}
      aria-hidden={alt === "" ? true : undefined}
    >
      <Image
        src={asset}
        alt={alt}
        priority={priority}
        sizes={sizes}
        style={{
          position: "absolute",
          left: -bounds.xf * imgW,
          top: -bounds.yf * imgH,
          width: imgW,
          height: imgH,
          maxWidth: "none",
          mixBlendMode: "screen",
        }}
      />
    </span>
  );
}

export function VantorMark({
  height = 24,
  className,
  priority = false,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={className}>
      <BrandImage asset={markAsset} bounds={MARK_BOUNDS} height={height} sizes="64px" priority={priority} />
    </span>
  );
}

type LogoSize = "sm" | "md" | "lg";

/* Visible-artwork heights (px) for the mark and the banner lockup. */
const sizeStyles: Record<LogoSize, { mark: number; banner: number; gap: string }> = {
  sm: { mark: 20, banner: 24, gap: "gap-2.5" },
  md: { mark: 26, banner: 30, gap: "gap-3" },
  lg: { mark: 38, banner: 46, gap: "gap-3.5" },
};

export function Logo({
  className,
  href = "/",
  size = "md",
  stacked = false,
  markOnly = false,
}: {
  className?: string;
  href?: string;
  size?: LogoSize;
  stacked?: boolean;
  markOnly?: boolean;
}) {
  const s = sizeStyles[size];
  return (
    <Link
      href={href}
      aria-label="Vantor Capital Markets"
      className={cn(
        "group flex shrink-0 items-center transition-opacity hover:opacity-80",
        stacked ? "flex-col gap-4" : s.gap,
        className,
      )}
    >
      <BrandImage asset={markAsset} bounds={MARK_BOUNDS} height={s.mark} sizes="96px" priority />
      {markOnly ? null : (
        <BrandImage asset={bannerAsset} bounds={BANNER_BOUNDS} height={s.banner} sizes="256px" priority />
      )}
    </Link>
  );
}
