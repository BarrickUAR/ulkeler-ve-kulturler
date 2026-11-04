import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // /dev/* sayfaları canlı derlemede çıkmasın diye pageExtensions ile ayrılır
  pageExtensions:
    process.env.NODE_ENV === "production" ? ["tsx", "ts"] : ["tsx", "ts", "dev.tsx"],
};

export default config;
