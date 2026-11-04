/**
 * Tek bir paylaşılan <audio> ile anlatım. iOS, kullanıcı dokunuşu dışında yeni bir ses
 * öğesinin çalmasına izin vermediği için ilk "Dinle" dokunuşunda kilit açılır, sonra
 * sadece src değiştirilir. Dosya yüklenemezse tarayıcının Türkçe sesine düşer.
 */
export class Anlatici {
  private ses: HTMLAudioElement | null = null;
  private bitir: (() => void) | null = null;
  private konusma: SpeechSynthesisUtterance | null = null;
  sessiz = false;

  private oge(): HTMLAudioElement {
    if (!this.ses) {
      this.ses = new Audio();
      this.ses.preload = "auto";
    }
    return this.ses;
  }

  private acik = false;
  private kilit: Promise<void> = Promise.resolve();

  /** Kullanıcı dokunuşunun içinde çağrılmalı: öğe bir kez dokunuşla çalınınca iOS sonrakilere izin verir. */
  kilidiAc(ilkSrc: string): void {
    if (this.acik) return;
    this.acik = true;
    const a = this.oge();
    a.muted = true;
    a.src = ilkSrc;
    this.kilit = a
      .play()
      .then(() => a.pause())
      .catch(() => {})
      .finally(() => {
        a.muted = this.sessiz;
      });
  }

  get zaman(): number {
    return this.ses ? this.ses.currentTime : 0;
  }

  /** Sesi çalar; bitince (veya durdurulunca) çözülür. */
  cal(src: string, yedekMetin: string): Promise<void> {
    this.durdur();
    return new Promise<void>((coz) => {
      const bitir = () => {
        if (this.bitir === bitir) this.bitir = null;
        coz();
      };
      this.bitir = bitir;
      void this.kilit.then(() => {
        if (this.bitir !== bitir) return; // bu arada iptal edildi
        this.baslat(src, yedekMetin);
      });
    });
  }

  private baslat(src: string, yedekMetin: string): void {
    const a = this.oge();
    const bu = this.bitir;
    const yedek = () => {
      // iptal edilen ya da zaten yedeğe düşen adım için tekrar konuşma
      if (this.bitir !== bu || !bu || this.konusma) return;
      a.onerror = null;
      this.konus(yedekMetin);
    };
    a.muted = this.sessiz;
    a.src = src;
    a.currentTime = 0;
    a.onended = () => this.bitir?.();
    a.onerror = yedek;
    a.play().catch((e: unknown) => {
      if (e instanceof DOMException && e.name === "AbortError") return; // durdur() kesti
      yedek();
    });
  }

  private konus(metin: string): void {
    if (typeof speechSynthesis === "undefined" || this.sessiz) {
      // Ses yoksa okuma süresi kadar bekle (dakikada ~150 kelime)
      const sure = Math.max(1800, metin.split(/\s+/).length * 400);
      setTimeout(() => this.bitir?.(), sure);
      return;
    }
    const u = new SpeechSynthesisUtterance(metin);
    u.lang = "tr-TR";
    u.rate = 0.92;
    const tr = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("tr"));
    if (tr) u.voice = tr;
    u.onend = () => this.bitir?.();
    u.onerror = () => this.bitir?.();
    this.konusma = u;
    speechSynthesis.speak(u);
  }

  duraklat(): void {
    this.ses?.pause();
    if (this.konusma) speechSynthesis.pause();
  }

  surdur(): void {
    if (this.konusma) speechSynthesis.resume();
    else this.ses?.play().catch(() => {});
  }

  sessizYap(s: boolean): void {
    this.sessiz = s;
    if (this.ses) this.ses.muted = s;
  }

  /** Çalanı keser; bekleyen cal() sözü çözülmez (iptal edilen adım devam etmesin diye). */
  durdur(): void {
    this.bitir = null;
    if (this.ses) {
      this.ses.onended = null;
      this.ses.onerror = null;
      this.ses.pause();
    }
    if (this.konusma) {
      speechSynthesis.cancel();
      this.konusma = null;
    }
  }

  onYukle(src: string): void {
    const l = document.createElement("link");
    l.rel = "preload";
    l.as = "audio";
    l.href = src;
    document.head.appendChild(l);
  }
}
