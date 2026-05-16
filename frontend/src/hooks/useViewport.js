import { useEffect, useState } from "react";

export default function useViewport(fallback = 1280) {
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") {
      return fallback;
    }

    return window.innerWidth;
  });

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}
