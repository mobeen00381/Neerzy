type LogoProps = {
  /** Full lockup (icon + wordmark) or just the square icon tile. */
  variant?: "full" | "icon";
  /** Which surface the logo sits on — controls the wordmark/text colour. */
  tone?: "onLight" | "onDark";
  className?: string;
  alt?: string;
};

/**
 * Single source of truth for the Neerzy brand mark.
 * Use everywhere a logo appears so every surface stays identical.
 *
 * - fixed height + `w-auto object-contain` keeps proportions correct
 * - `tone` swaps the wordmark colour for dark nav/footer vs light pages
 */
export default function Logo({
  variant = "full",
  tone = "onLight",
  className = "h-11 w-auto object-contain",
  alt = "Neerzy",
}: LogoProps) {
  const src =
    variant === "icon"
      ? "/images/logo-icon.svg"
      : tone === "onDark"
        ? "/images/logo-white.svg"
        : "/images/logo.svg";

  return <img src={src} alt={alt} className={className} width={214} height={64} />;
}
