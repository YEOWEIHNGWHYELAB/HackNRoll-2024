import { type SimulationNodeDatum, type SimulationLinkDatum } from "d3";

export interface D3Node extends SimulationNodeDatum {
  id: string;
  name: string;
  group: string;
}

export interface D3Edge extends SimulationLinkDatum<D3Node> {
  value: string | number;
}

export type GraphData = {
  nodes: D3Node[];
  links: D3Edge[];
};

export const RADIUS = 30;
export const NODE_ATTRACT_STRENGTH = -4000;
