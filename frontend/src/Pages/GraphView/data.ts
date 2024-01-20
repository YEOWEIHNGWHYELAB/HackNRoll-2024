import { type SimulationNodeDatum, type SimulationLinkDatum } from "d3";

export interface D3Node extends SimulationNodeDatum {
  id: string;
  name: string;
  group: string;
  properties: Record<string, string>;
  breached?: boolean;
}

export interface D3Edge extends SimulationLinkDatum<D3Node> {
  id: string;
  value: string | number;
  linkNum?: number;
  properties: Record<string, string>;
}

export type GraphData = {
  nodes: D3Node[];
  links: D3Edge[];
};

export type GraphSelection = {
  type: string;
  id: string;
  name: string;
  properties: Record<string, string>;
  breached: boolean;
};

export const RADIUS = 30;
export const NODE_ATTRACT_STRENGTH = -60;
export const MIN_LINK_LEN = 300;
