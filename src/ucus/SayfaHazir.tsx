"use client";

import { useEffect } from "react";
import { sayfaHazir } from "./UcusGecisi";

/** Sunucu bileşeni olan sayfalarda (ana sayfa) perdeye "hazırım" der. */
export function SayfaHazir() {
  useEffect(() => {
    sayfaHazir();
  }, []);
  return null;
}
