import {
  NormalizedRect,
  SourceTarget,
  ThreadTargetRef,
} from "./review-types.js";

export interface HitCandidate {
  target: SourceTarget;
  depth: number;
  area: number;
  meaningful?: boolean;
  interactive?: boolean;
}

export interface PickOptions {
  preferParent?: boolean;
}

function scoreCandidate(
  candidate: HitCandidate,
  options: PickOptions,
): number {
  const meaningfulScore = candidate.meaningful ? 10_000 : 0;
  const interactiveScore = candidate.interactive ? 1_000 : 0;
  const depthScore = options.preferParent ? -candidate.depth * 10 : candidate.depth * 10;
  const areaScore = options.preferParent ? candidate.area : -candidate.area;

  return meaningfulScore + interactiveScore + depthScore + areaScore;
}

export function pickBestTarget(
  candidates: HitCandidate[],
  options: PickOptions = {},
): HitCandidate | undefined {
  return [...candidates].sort(
    (left, right) => scoreCandidate(right, options) - scoreCandidate(left, options),
  )[0];
}

export function makeThreadTarget(
  candidate: HitCandidate,
  variantKey?: string,
): ThreadTargetRef {
  const target: ThreadTargetRef = {
    targetId: candidate.target.targetId,
    screenId: candidate.target.screenId,
    scope: candidate.target.scope,
  };

  if (candidate.target.wireId) {
    target.wireId = candidate.target.wireId;
  }

  if (variantKey) {
    target.variantKey = variantKey;
  }

  return target;
}

export function buildRegionThreadTarget(
  screenId: string,
  rect: NormalizedRect,
  baseTargetId?: string,
  variantKey?: string,
): ThreadTargetRef {
  const target: ThreadTargetRef = {
    targetId: baseTargetId ?? `region:${screenId}`,
    screenId,
    scope: "region",
    region: rect,
  };

  if (variantKey) {
    target.variantKey = variantKey;
  }

  return target;
}
