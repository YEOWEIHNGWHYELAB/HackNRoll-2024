export type N4JNode = {
    elementId: string;
    identity: { low: number; high: number };
    labels: string[];
    properties: Record<string, string>;
};

export type N4JEdge = {
    elementId: string;
    startNodeElementId: string;
    endNodeElementId: string;
    start: { low: number; high: number };
    end: { low: number; high: number };
    identity: { low: number; high: number };
    properties: Record<string, string>;
    type: string;
};

export type D3Node = {
    id: string;
    name: string;
    group: string;
    properties: Record<string, string>;
    breached?: boolean;
};

export type D3Edge = {
    id: string;
    source: string;
    target: string;
    value: string | number;
    properties: Record<string, string>;
};
