import { AnalysisProfile } from "../config/configuration";
import { Signal } from "../types";

const PROFILE_TYPE_MULTIPLIERS: Record<AnalysisProfile, Partial<Record<Signal["type"], number>>> = {
  balanced: {},
  frontend: {
    feat: 1.08,
    fix: 1.05,
    style: 1.12,
    perf: 1.08,
    build: 0.92
  },
  backend: {
    feat: 1.07,
    fix: 1.1,
    perf: 1.1,
    refactor: 1.06,
    style: 0.92
  },
  infra: {
    build: 1.15,
    ci: 1.18,
    chore: 1.06,
    feat: 0.9,
    style: 0.9
  }
};

export function adjustSignalForProfile(signal: Signal, profile: AnalysisProfile): Signal {
  if (profile === "balanced") {
    return signal;
  }

  const multiplier = PROFILE_TYPE_MULTIPLIERS[profile][signal.type] ?? 1;
  const adjustedWeight = Math.min(1, Math.max(0, signal.weight * multiplier));
  if (adjustedWeight === signal.weight) {
    return signal;
  }

  return {
    ...signal,
    weight: adjustedWeight,
    reason: `${signal.reason} [profile:${profile}]`
  };
}
