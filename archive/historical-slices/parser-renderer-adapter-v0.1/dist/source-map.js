import { classifyScope, nodeLabel, roleForNode, screenIdFromNode, semanticTargetId, } from "./utils.js";
import { resolveDocument } from "./resolver.js";
function variantKey(selection) {
    const parts = [];
    if (selection.mode)
        parts.push(selection.mode);
    if (selection.theme)
        parts.push(selection.theme);
    if (selection.breakpoint)
        parts.push(selection.breakpoint);
    if (selection.state)
        parts.push(selection.state);
    return parts.join("+") || "base";
}
function uniqueVariantRefs(refs) {
    const seen = new Set();
    const unique = [];
    for (const ref of refs) {
        if (seen.has(ref.key))
            continue;
        seen.add(ref.key);
        unique.push(ref);
    }
    return unique;
}
export function buildVariantRefs(document) {
    const grouped = new Map();
    for (const variant of document.variants) {
        const list = grouped.get(variant.kind) ?? [];
        list.push(variant.name);
        grouped.set(variant.kind, list);
    }
    const modeList = grouped.get("mode") ?? [];
    const themeList = grouped.get("theme") ?? [];
    const breakpointList = grouped.get("breakpoint") ?? [];
    const stateList = grouped.get("state") ?? [];
    const refs = [{ key: "base" }];
    const singletonKinds = [
        ["mode", modeList],
        ["theme", themeList],
        ["breakpoint", breakpointList],
        ["state", stateList],
    ];
    for (const [kind, values] of singletonKinds) {
        for (const value of values) {
            refs.push({
                key: variantKey({ [kind]: value }),
                [kind]: value,
            });
        }
    }
    for (const mode of modeList.length ? modeList : [undefined]) {
        for (const theme of themeList.length ? themeList : [undefined]) {
            for (const breakpoint of breakpointList.length ? breakpointList : [undefined]) {
                for (const state of stateList.length ? stateList : [undefined]) {
                    if (!mode && !theme && !breakpoint && !state) {
                        continue;
                    }
                    const selection = {};
                    if (mode)
                        selection.mode = mode;
                    if (theme)
                        selection.theme = theme;
                    if (breakpoint)
                        selection.breakpoint = breakpoint;
                    if (state)
                        selection.state = state;
                    refs.push({
                        key: variantKey(selection),
                        ...selection,
                    });
                }
            }
        }
    }
    return uniqueVariantRefs(refs);
}
function addTarget(seeds, target, variantKeyValue) {
    const existing = seeds.get(target.targetId);
    if (existing) {
        existing.variants.add(variantKeyValue);
        if (!existing.target.label && target.label) {
            existing.target.label = target.label;
        }
        return;
    }
    seeds.set(target.targetId, {
        target,
        variants: new Set([variantKeyValue]),
    });
}
function walkTargets(node, screenId, parentTargetId, semanticPath, callback) {
    const scope = classifyScope(node.kind, node.children.length > 0);
    const targetId = semanticTargetId(scope, node);
    const label = scope === "screen" ? undefined : nodeLabel(node);
    const currentPath = [...semanticPath, targetId];
    callback({
        targetId,
        scope,
        screenId,
        wireId: node.id,
        kind: node.kind,
        label,
        parentTargetId,
        semanticPath: currentPath,
        span: { ...node.span },
        dom: scope === "screen"
            ? {
                selector: `[data-ws-screen='${screenId}']`,
                screenId,
                kind: node.kind,
            }
            : {
                selector: `[data-ws-id='${node.id ?? node.kind}']`,
                screenId,
                wireId: node.id,
                kind: node.kind,
                path: currentPath.join("/"),
            },
        signature: {
            kind: node.kind,
            role: roleForNode(node),
            text: label,
        },
        variants: [],
    });
    for (const child of node.children) {
        walkTargets(child, screenId, targetId, currentPath, callback);
    }
}
export function buildSourceMap(document, options = {}) {
    const refs = options.variantRefs ?? buildVariantRefs(document);
    const seeds = new Map();
    const documentId = document.metadata.id ?? document.root.id ?? screenIdFromNode(document.root);
    const screenId = screenIdFromNode(document.root);
    for (const section of document.sections) {
        if (!section.body.trim()) {
            continue;
        }
        if (section.kind === "acceptance") {
            continue;
        }
        addTarget(seeds, {
            targetId: `prose:${section.id}`,
            scope: "prose",
            screenId,
            kind: section.kind,
            label: section.title,
            semanticPath: [`screen:${screenId}`, `prose:${section.id}`],
            span: { ...section.span },
            variants: [],
        }, "base");
    }
    for (let index = 0; index < document.acceptance.length; index += 1) {
        const criterion = document.acceptance[index];
        addTarget(seeds, {
            targetId: `acceptance:${documentId}-${String(index + 1).padStart(2, "0")}`,
            scope: "acceptance",
            screenId,
            kind: "acceptance",
            label: criterion.text,
            semanticPath: [`screen:${screenId}`, `acceptance:${documentId}-${String(index + 1).padStart(2, "0")}`],
            span: { ...criterion.span },
            variants: [],
        }, "base");
    }
    for (const ref of refs) {
        const selection = {
            mode: ref.mode,
            theme: ref.theme,
            breakpoint: ref.breakpoint,
            state: ref.state,
        };
        const resolved = resolveDocument(document, selection);
        const resolvedScreenId = screenIdFromNode(resolved.root);
        walkTargets(resolved.root, resolvedScreenId, undefined, [], (target) => {
            addTarget(seeds, target, ref.key);
        });
        for (const section of resolved.sections) {
            if (!section.body.trim() || section.kind === "acceptance") {
                continue;
            }
            addTarget(seeds, {
                targetId: `prose:${section.id}`,
                scope: "prose",
                screenId: resolvedScreenId,
                kind: section.kind,
                label: section.title,
                semanticPath: [`screen:${resolvedScreenId}`, `prose:${section.id}`],
                span: { ...section.span },
                variants: [],
            }, ref.key);
        }
        for (let index = 0; index < resolved.acceptance.length; index += 1) {
            const criterion = resolved.acceptance[index];
            addTarget(seeds, {
                targetId: `acceptance:${documentId}-${String(index + 1).padStart(2, "0")}`,
                scope: "acceptance",
                screenId: resolvedScreenId,
                kind: "acceptance",
                label: criterion.text,
                semanticPath: [`screen:${resolvedScreenId}`, `acceptance:${documentId}-${String(index + 1).padStart(2, "0")}`],
                span: { ...criterion.span },
                variants: [],
            }, ref.key);
        }
    }
    const targets = Array.from(seeds.values())
        .map((seed) => ({
        ...seed.target,
        variants: Array.from(seed.variants).sort(),
    }))
        .sort((left, right) => {
        const lineDiff = left.span.lineStart - right.span.lineStart;
        if (lineDiff !== 0) {
            return lineDiff;
        }
        return left.targetId.localeCompare(right.targetId);
    });
    return {
        version: "0.1",
        documentId,
        entryFile: options.entryFile ?? document.sourceFile,
        generatedAt: options.generatedAt ?? new Date().toISOString(),
        contentHash: options.contentHash,
        variants: refs,
        targets,
        renames: [],
    };
}
export function resolveTarget(sourceMap, ref) {
    const direct = sourceMap.targets.find((target) => target.targetId === ref.targetId);
    if (direct) {
        if (ref.variantKey && direct.variants && !direct.variants.includes(ref.variantKey)) {
            return {
                status: "missing-variant",
                target: direct,
                messages: [`Target ${ref.targetId} does not exist in variant ${ref.variantKey}.`],
            };
        }
        return {
            status: "matched",
            target: direct,
            messages: [],
        };
    }
    const rename = sourceMap.renames?.find((entry) => entry.fromTargetId === ref.targetId);
    if (rename) {
        const renamed = sourceMap.targets.find((target) => target.targetId === rename.toTargetId);
        if (renamed) {
            return {
                status: "renamed",
                target: renamed,
                messages: [
                    `Target ${ref.targetId} was relinked to ${rename.toTargetId}.`,
                    rename.reason ?? "No reason was recorded.",
                ],
            };
        }
    }
    return {
        status: "orphaned",
        messages: [`Target ${ref.targetId} could not be resolved.`],
    };
}
