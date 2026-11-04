"use client";

/**
 * Uçak sesi, dosya indirmeden tarayıcıda üretilir (Web Audio):
 * önce kabin "dıt-dıt"ı (kemerlerinizi bağlayın), sonra soldan sağa geçen jet:
 * filtreli gürültü (rüzgâr/türbin) + perdesi düşen motor uğultusu (Doppler) + sağa kayan stereo.
 * Kullanıcı dokunuşunun içinde çağrılmalı (tarayıcılar sesi ancak böyle başlatır).
 */
let baglam: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  baglam ??= new AC();
  if (baglam.state === "suspended") void baglam.resume();
  return baglam;
}

function gurultu(c: AudioContext, sure: number): AudioBuffer {
  const b = c.createBuffer(1, Math.ceil(c.sampleRate * sure), c.sampleRate);
  const d = b.getChannelData(0);
  // Kahverengi gürültü: beyaz gürültünün birikimi, daha "dolgun" uğultu
  let son = 0;
  for (let i = 0; i < d.length; i++) {
    const beyaz = Math.random() * 2 - 1;
    son = (son + 0.02 * beyaz) / 1.02;
    d[i] = son * 3.5;
  }
  return b;
}

function dit(c: AudioContext, cikis: AudioNode, zaman: number, frekans: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.value = frekans;
  g.gain.setValueAtTime(0.0001, zaman);
  g.gain.exponentialRampToValueAtTime(0.18, zaman + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, zaman + 0.6);
  o.connect(g).connect(cikis);
  o.start(zaman);
  o.stop(zaman + 0.65);
}

export function ucakSesi(): void {
  const c = ctx();
  if (!c) return;
  const t0 = c.currentTime + 0.02;
  const ana = c.createGain();
  ana.gain.value = 0.55;
  ana.connect(c.destination);

  // Kabin sesi
  dit(c, ana, t0, 1046);
  dit(c, ana, t0 + 0.28, 784);

  // Jet geçişi
  const bas = t0 + 0.35;
  const sure = 2.6;
  const tepe = bas + sure * 0.42;
  const bit = bas + sure;

  const pan = c.createStereoPanner ? c.createStereoPanner() : null;
  if (pan) {
    pan.pan.setValueAtTime(-0.9, bas);
    pan.pan.linearRampToValueAtTime(0.9, bit);
    pan.connect(ana);
  }
  const hedef: AudioNode = pan ?? ana;

  const kaynak = c.createBufferSource();
  kaynak.buffer = gurultu(c, sure + 0.2);
  const bant = c.createBiquadFilter();
  bant.type = "bandpass";
  bant.Q.value = 0.9;
  bant.frequency.setValueAtTime(280, bas);
  bant.frequency.exponentialRampToValueAtTime(1500, tepe);
  bant.frequency.exponentialRampToValueAtTime(240, bit);
  const ruzgar = c.createGain();
  ruzgar.gain.setValueAtTime(0.0001, bas);
  ruzgar.gain.exponentialRampToValueAtTime(0.9, tepe);
  ruzgar.gain.exponentialRampToValueAtTime(0.0001, bit);
  kaynak.connect(bant).connect(ruzgar).connect(hedef);
  kaynak.start(bas);
  kaynak.stop(bit + 0.1);

  // Motor uğultusu: iki testere dişi, perde Doppler gibi düşer
  const motorFiltre = c.createBiquadFilter();
  motorFiltre.type = "lowpass";
  motorFiltre.frequency.value = 520;
  const motor = c.createGain();
  motor.gain.setValueAtTime(0.0001, bas);
  motor.gain.exponentialRampToValueAtTime(0.11, tepe);
  motor.gain.exponentialRampToValueAtTime(0.0001, bit);
  motorFiltre.connect(motor).connect(hedef);
  for (const [f0, f1] of [
    [128, 92],
    [193, 139],
  ]) {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(f0, bas);
    o.frequency.linearRampToValueAtTime(f0 * 0.98, tepe - 0.1);
    o.frequency.exponentialRampToValueAtTime(f1, tepe + 0.35);
    o.connect(motorFiltre);
    o.start(bas);
    o.stop(bit + 0.1);
  }
}
