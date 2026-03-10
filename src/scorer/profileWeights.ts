import { AnalyzedFile } from "../types";
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

function hasAny(path: string, parts: string[]): boolean {
  return parts.some((part) => path.includes(part));
}

export function detectProfileFromFiles(files: AnalyzedFile[]): AnalysisProfile {
  let frontend = 0;
  let backend = 0;
  let infra = 0;

  for (const file of files) {
    const p = file.path.toLowerCase();

    if (hasAny(p, [".tsx", ".jsx", ".vue", ".svelte", ".css", ".scss", "/components/", "/pages/", "/ui/"])) {
      frontend += 2;
    }
    if (hasAny(p, ["/api/", "/server/", "/controllers/", "/routes/", "/db/", ".go", ".py", ".java", ".cs"])) {
      backend += 2;
    }
    if (
      hasAny(p, [
        ".github/workflows/",
        "dockerfile",
        "docker-compose",
        "/k8s/",
        "/kubernetes/",
        "/terraform/",
        ".tf",
        "helm",
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml"
      ])
    ) {
      infra += 2;
    }
  }

  if (infra >= frontend && infra >= backend && infra >= 3) {
    return "infra";
  }
  if (frontend >= backend && frontend >= 3) {
    return "frontend";
  }
  if (backend >= 3) {
    return "backend";
  }
  return "balanced";
}
