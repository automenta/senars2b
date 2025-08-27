export type UUID = string;

export type SemanticAtom = {
    id: UUID;
    content: any;
    embedding: number[];
    meta: {
        type: "Fact" | "CognitiveSchema" | "Observation" | "Rule";
        source: string;
        timestamp: string;
        author?: string;
        trust_score: number;
        domain?: string;
        license?: string;
        [key: string]: any;
    };
};

export type TruthValue = {
    frequency: number;
    confidence: number;
};

export type AttentionValue = {
    priority: number;
    durability: number;
};

export type DerivationStamp = {
    timestamp: number;
    parent_ids: UUID[];
    schema_id: UUID;
    module?: string;
};

export type CognitiveItem = {
    id: UUID;
    atom_id: UUID;
    type: 'BELIEF' | 'GOAL' | 'QUERY' | 'EVENT';
    truth?: TruthValue;
    attention: AttentionValue;
    stamp: DerivationStamp;
    goal_parent_id?: UUID;
    goal_status?: "active" | "blocked" | "achieved" | "failed";
    label?: string;
    meta?: Record<string, any>;
    payload?: Record<string, any>;
};

export type CognitiveSchema = {
    atom_id: UUID;
    apply: (a: CognitiveItem, b: CognitiveItem, worldModel: WorldModel) => CognitiveItem[];
};

export interface Agenda {
    push(item: CognitiveItem): void;
    pop(): Promise<CognitiveItem>;
    peek(): CognitiveItem | null;
    size(): number;
    updateAttention(id: UUID, newVal: AttentionValue): void;
    remove(id: UUID): boolean;
    get(id: UUID): CognitiveItem | null;
}

export interface WorldModel {
    add_atom(atom: SemanticAtom): UUID;
    add_item(item: CognitiveItem): void;
    get_atom(id: UUID): SemanticAtom | null;
    get_item(id: UUID): CognitiveItem | null;
    query_by_semantic(embedding: number[], k: number): CognitiveItem[];
    query_by_symbolic(pattern: any, k?: number): CognitiveItem[];
    query_by_structure(pattern: any, k?: number): CognitiveItem[];
    query_by_meta(key: string, value: any): CognitiveItem[];
    revise_belief(new_item: CognitiveItem): [CognitiveItem | null, CognitiveItem | null];
    register_schema_atom(atom: SemanticAtom): CognitiveSchema;
}

export interface BeliefRevisionEngine {
    merge(existing: TruthValue, newTv: TruthValue): TruthValue;
    detect_conflict(a: TruthValue, b: TruthValue): boolean;
}

export interface AttentionModule {
    calculate_initial(item: CognitiveItem): AttentionValue;
    calculate_derived(
        parents: CognitiveItem[],
        schema: CognitiveSchema,
        source_trust?: number
    ): AttentionValue;
    update_on_access(items: CognitiveItem[]): void;
    run_decay_cycle(world_model: WorldModel, agenda: Agenda): void;
}

export interface ResonanceModule {
    find_context(item: CognitiveItem, world_model: WorldModel, k: number): CognitiveItem[];
}

export interface SchemaMatcher {
    register_schema(schema: SemanticAtom, world_model: WorldModel): CognitiveSchema;
    find_applicable(a: CognitiveItem, b: CognitiveItem, world_model: WorldModel): CognitiveSchema[];
}

export interface GoalTreeManager {
    decompose(goal: CognitiveItem): CognitiveItem[];
    mark_achieved(goal_id: UUID): void;
    mark_failed(goal_id: UUID): void;
    get_ancestors(goal_id: UUID): UUID[];
}

export interface Transducer {
    process(data: any): CognitiveItem[] | Promise<CognitiveItem[]>;
}

export interface Executor {
    can_execute(goal: CognitiveItem): boolean;
    execute(goal: CognitiveItem): Promise<CognitiveItem>;
}