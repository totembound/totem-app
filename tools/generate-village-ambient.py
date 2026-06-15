#!/usr/bin/env python3
"""
Synthesizes a fantasy-village ambient track for TotemBound.

Layers (front-to-back):
  1. Music pad — sustained A-minor / G chord changes every ~10s, slow envelope.
  2. Melody motif — sparse single notes from the Aeolian (natural minor) scale,
     played a few times over the 30s with long decays. Wandering, dream-like.
  3. Bird chirps — 4-6 short FM-modulated sine bursts at random times, mimicking
     varied bird calls (high register, fast pitch sweep + amplitude envelope).
  4. Drone — three detuned low sines (~60/92/148 Hz) with very slow breathing.
  5. Brown noise — distant wind through trees, low-passed and quiet.
  6. Water — barely-there mid-band noise, kept extremely subtle.
  7. Magical chimes — rare upper-register sine bursts (existing layer, kept faint).

Output: 96 kbps CBR mono MP3, ~30 seconds, with a 200 ms crossfade at the loop
boundary so the loop is seamless when looped via <audio loop>. The script
writes an intermediate WAV that ffmpeg encodes into MP3 and then deletes.

Run from repo root:
    python3 tools/generate-village-ambient.py
"""
from __future__ import annotations

import math
import random
import shutil
import struct
import subprocess
import sys
import wave
from pathlib import Path

SAMPLE_RATE = 44100
DURATION_SEC = 30
N = SAMPLE_RATE * DURATION_SEC
CROSSFADE_SEC = 0.2  # crossfade samples at the loop boundary
CROSSFADE_N = int(SAMPLE_RATE * CROSSFADE_SEC)

OUT = Path(__file__).resolve().parent.parent / "public" / "sounds" / "village" / "ambient.wav"
OUT_MP3 = OUT.with_suffix(".mp3")
# CBR 96k mono is plenty for a low-bandwidth ambient loop. Drops the file from
# ~2.5 MB to ~360 KB while staying transparent for diffuse synth content like
# this (no transients, no stereo image, narrow spectrum).
MP3_BITRATE = "96k"


def generate() -> list[float]:
    """Returns a list of float32 samples in [-1, 1]."""
    rng = random.Random(424242)

    # --- Noise generators with one-pole low-pass / band-pass filters ---
    # Brown noise: integrate white noise, gently leak.
    brown = 0.0
    brown_decay = 0.985

    # Mid-band noise: bandpass via two cascaded one-pole LPs minus another LP.
    mid_lp1 = 0.0
    mid_lp2 = 0.0
    mid_lp3 = 0.0
    # alpha values picked for ~600-1800 Hz emphasis
    a_lp1 = 0.18
    a_lp2 = 0.22
    a_lp3 = 0.05

    samples: list[float] = []

    # --- Sparse chime scheduling ---
    # 1-2 brief upper-register sparkles. Faster decay + lower gain so it's a
    # quick "shimmer" rather than a held bell tone.
    n_chimes = rng.randint(1, 2)
    chime_pitches = [880.0, 988.0, 1175.0, 1318.0, 1568.0]  # A5, B5, D6, E6, G6
    chime_events: list[tuple[float, float, float]] = []  # (start_sec, freq, gain)
    for _ in range(n_chimes):
        start = rng.uniform(2.0, DURATION_SEC - 3.0)
        freq = rng.choice(chime_pitches) * rng.uniform(0.99, 1.01)  # micro-detune
        gain = rng.uniform(0.006, 0.012)
        chime_events.append((start, freq, gain))

    def chime_at(t: float) -> float:
        out = 0.0
        for start, freq, gain in chime_events:
            dt = t - start
            if dt < 0 or dt > 1.5:
                continue
            attack = min(1.0, dt / 0.04)
            decay = math.exp(-dt * 1.8)
            out += gain * attack * decay * math.sin(2 * math.pi * freq * dt)
        return out

    # --- Bird chirps ---
    # Each chirp = sine with rising/falling pitch (FM sweep) + bell-shaped amp env.
    # 4-6 events spread across the duration. Different "species" use different
    # base pitches, sweep widths and durations so the calls feel varied.
    species = [
        # (base_freq, sweep_amount, duration_sec, repeats, repeat_gap)
        (2400.0,  600.0, 0.10, 2, 0.16),  # short two-note "tweet"
        (1800.0,  900.0, 0.18, 1, 0.0),   # single warble
        (3200.0, -400.0, 0.07, 3, 0.10),  # quick descending triple "tsi-tsi-tsi"
        (2000.0,  300.0, 0.22, 1, 0.0),   # gentle single call
    ]
    n_birds = rng.randint(4, 6)
    bird_events: list[tuple[float, tuple, float]] = []  # (start, species, gain)
    for _ in range(n_birds):
        start = rng.uniform(1.5, DURATION_SEC - 3.5)
        sp = rng.choice(species)
        gain = rng.uniform(0.05, 0.09)
        bird_events.append((start, sp, gain))

    def bird_at(t: float) -> float:
        """Sum of currently-active bird chirp samples at time t."""
        out = 0.0
        for start, (base, sweep, dur, repeats, gap), gain in bird_events:
            for k in range(repeats):
                ev_start = start + k * gap
                dt = t - ev_start
                if dt < 0 or dt > dur:
                    continue
                # Bell-shaped amp envelope (sin^2)
                env = math.sin(math.pi * dt / dur) ** 2
                # Pitch: linear sweep
                freq = base + sweep * (dt / dur)
                # Phase = integral of freq over time. For linear sweep,
                # integral = base*dt + sweep*dt^2/(2*dur).
                phase = 2 * math.pi * (base * dt + sweep * dt * dt / (2 * dur))
                out += gain * env * math.sin(phase)
        return out

    # --- Music pad: chord progression ---
    # Two chords alternating: Am (A2 110, C3 130.8, E3 164.8) → G (G2 98, B2 123.5, D3 146.8).
    # Each chord lasts ~10s, soft attack/release crossfade on the boundary.
    chord_dur = 10.0  # seconds per chord
    # Voicings sit in the C4-A4 range (mid-treble) — anything below ~150 Hz
    # adds a sustained "engine hum" quality to the pad, which we explicitly
    # don't want. So no notes below C4 (262 Hz).
    chords = [
        [261.63, 329.63, 392.00, 440.00],  # Am triad (C4-E4-G-A) airy voicing
        [246.94, 293.66, 349.23, 392.00],  # G  triad (B3-D-F-G)   airy voicing
    ]

    def pad_at(t: float) -> float:
        idx = int(t / chord_dur) % len(chords)
        next_idx = (idx + 1) % len(chords)
        local_t = (t / chord_dur) - int(t / chord_dur)  # 0..1 within current chord
        # Crossfade region: last 12% of each chord
        cross_start = 0.88
        if local_t < cross_start:
            chord = chords[idx]
            other = None
            mix_a, mix_b = 1.0, 0.0
        else:
            chord = chords[idx]
            other = chords[next_idx]
            x = (local_t - cross_start) / (1.0 - cross_start)
            mix_a = 1.0 - x
            mix_b = x

        def render(notes: list[float]) -> float:
            s = 0.0
            for n_idx, f in enumerate(notes):
                # Slight detune per voice for chorus-y warmth
                detune = 1.0 + 0.0014 * (n_idx - len(notes) / 2)
                # Slow vibrato
                vib = 1.0 + 0.0025 * math.sin(2 * math.pi * 0.18 * t + n_idx)
                s += math.sin(2 * math.pi * f * detune * vib * t)
            return s / max(1, len(notes))

        a = render(chord) * mix_a
        b = render(other) * mix_b if other else 0.0
        # Soft envelope shaping over the chord duration to "breathe"
        shape = 0.5 + 0.5 * math.sin(2 * math.pi * (local_t - 0.25))
        return (a + b) * (0.6 + 0.4 * shape)

    # --- Melody motif ---
    # Sparse notes from A natural minor. Muted way down and given a much
    # faster decay so the dominant elements are the stream + birds; the
    # melody is now a barely-there occasional tonal hint rather than a
    # foreground line.
    minor = [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00]  # A3-A4
    n_notes = rng.randint(2, 3)
    melody_events: list[tuple[float, float, float]] = []
    for _ in range(n_notes):
        start = rng.uniform(3.0, DURATION_SEC - 3.0)
        freq = rng.choice(minor)
        gain = rng.uniform(0.010, 0.016)
        melody_events.append((start, freq, gain))

    def melody_at(t: float) -> float:
        out = 0.0
        for start, freq, gain in melody_events:
            dt = t - start
            # Tighter window + faster exponential decay = short tonal flicker.
            if dt < 0 or dt > 2.5:
                continue
            attack = min(1.0, dt / 0.08)
            decay = math.exp(-dt * 1.4)
            out += gain * attack * decay * math.sin(2 * math.pi * freq * dt)
        return out

    def lfo(t: float, freq: float, depth: float) -> float:
        return 1.0 - depth * 0.5 + depth * 0.5 * math.sin(2 * math.pi * freq * t)

    for i in range(N):
        t = i / SAMPLE_RATE

        white = rng.uniform(-1.0, 1.0)

        # Brown noise (integrated white) — wind base, low-passed
        brown = brown_decay * brown + 0.05 * white
        wind = brown * 1.4

        # Bandpass-ish mid noise — water (kept VERY faint)
        mid_lp1 = mid_lp1 + a_lp1 * (white - mid_lp1)
        mid_lp2 = mid_lp2 + a_lp2 * (mid_lp1 - mid_lp2)
        mid_lp3 = mid_lp3 + a_lp3 * (mid_lp2 - mid_lp3)
        water = (mid_lp2 - mid_lp3) * lfo(t, 0.11, 0.4)

        drone = (
            0.045 * math.sin(2 * math.pi * 60 * t) * lfo(t, 0.07, 0.6)
            + 0.035 * math.sin(2 * math.pi * 92 * t) * lfo(t, 0.05, 0.5)
            + 0.025 * math.sin(2 * math.pi * 148 * t) * lfo(t, 0.13, 0.4)
        )

        # Mix levels (front to back):
        s = (
            melody_at(t)              # sparse single notes, decay quickly
            + bird_at(t)              # bird chirps
            + water * 0.10            # gentle stream
            + chime_at(t)             # rare upper-register sparkle
            # All sustained layers (pad, drone, wind) removed per user request —
            # any continuous synthesized tone reads as drone/hum/moan, which
            # this track explicitly does not want.
        )
        samples.append(s)

    # --- Soft normalize ---
    peak = max(abs(s) for s in samples)
    if peak > 0.95:
        scale = 0.95 / peak
        samples = [s * scale for s in samples]

    # --- Crossfade tail with head for seamless looping ---
    # Take the last CROSSFADE_N samples and crossfade them with what would be
    # the first CROSSFADE_N samples; mutate the head accordingly. The result:
    # the very end of the file fades into the very beginning's content, so when
    # the browser loops sample-N → sample-0, the energy is continuous.
    if CROSSFADE_N > 0 and N > 2 * CROSSFADE_N:
        for i in range(CROSSFADE_N):
            # Linear crossfade weight: head dominates at i=N-CROSSFADE_N, tail at end
            # Apply to the LAST CROSSFADE_N samples: mix in the FIRST samples.
            tail_idx = N - CROSSFADE_N + i
            head_idx = i
            w = i / CROSSFADE_N  # 0..1
            samples[tail_idx] = samples[tail_idx] * (1 - w) + samples[head_idx] * w

    return samples


def write_wav(samples: list[float], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        # Convert to 16-bit signed PCM
        frames = bytearray()
        for s in samples:
            v = max(-1.0, min(1.0, s))
            frames += struct.pack("<h", int(v * 32767))
        w.writeframes(bytes(frames))


def encode_mp3(wav: Path, mp3: Path) -> bool:
    """Encode wav → mp3 via ffmpeg. Returns False if ffmpeg is missing."""
    if not shutil.which("ffmpeg"):
        print("ffmpeg not found on PATH; skipping mp3 encode.", file=sys.stderr)
        return False
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(wav),
        "-codec:a", "libmp3lame",
        "-b:a", MP3_BITRATE,
        "-ac", "1",
        str(mp3),
    ]
    subprocess.run(cmd, check=True)
    return True


def main() -> int:
    print(f"Generating {DURATION_SEC}s ambient @ {SAMPLE_RATE} Hz mono…")
    samples = generate()
    # WAV is an intermediate build artifact only; ffmpeg needs a file to read
    # from. We delete it after the mp3 is written so the repo only ships the
    # production file. If ffmpeg is missing we keep the wav so the run still
    # produces *something* playable and the user can install ffmpeg + rerun.
    write_wav(samples, OUT)
    if encode_mp3(OUT, OUT_MP3):
        mp3_kb = OUT_MP3.stat().st_size / 1024
        print(f"Wrote {OUT_MP3} ({mp3_kb:.0f} KB, {MP3_BITRATE})")
        OUT.unlink()
    else:
        size_kb = OUT.stat().st_size / 1024
        print(f"Wrote {OUT} ({size_kb:.0f} KB) — install ffmpeg to produce mp3", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
