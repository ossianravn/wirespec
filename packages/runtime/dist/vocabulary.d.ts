export declare const ROOT_KINDS: Set<string>;
export declare const RESERVED_KINDS: Set<string>;
export declare const REQUIRED_PROPS_BY_KIND: Record<string, string[]>;
export declare const STRUCTURAL_CHILD_RULES: Record<string, Set<string>>;
export declare const INTERACTIVE_KINDS: Set<string>;
export declare const CANONICAL_PROP_ORDER: string[];
export declare function isKnownKind(kind: string): boolean;
