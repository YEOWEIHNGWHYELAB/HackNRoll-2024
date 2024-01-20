import * as d3 from "d3";
import { D3Edge, D3Node, GraphData, GraphSelection } from "./data";
import { useCallback, useEffect, useRef } from "react";
import { drawNetworkSvg } from "./drawNetwork";

type NetworkDiagramProps = {
  data: GraphData;
  nodeFilter: string;
  setActiveItem: React.Dispatch<
    React.SetStateAction<GraphSelection | undefined>
  >;
};

// const WIDTH = "100%";
// const HEIGHT = "100%";
const WIDTH = 800;
const HEIGHT = 800;

export const NetworkDiagram = ({
  data,
  nodeFilter,
  setActiveItem,
}: NetworkDiagramProps) => {
  let links: D3Edge[] = data.links.map((d) => ({ ...d }));
  let nodes: D3Node[] = data.nodes.map((d) => ({ ...d }));

  nodeFilter = nodeFilter.toLowerCase().trim();

  // filter node through string properties
  nodes = nodes.filter((n) => {
    if (
      n.name.toLowerCase().trim().includes(nodeFilter) ||
      n.group.toLowerCase().trim().includes(nodeFilter)
    )
      return true;

    if (
      Object.values(n.properties).some((p) =>
        p.toLowerCase().trim().includes(nodeFilter)
      )
    )
      return true;

    return false;
  });

  // only include links where both source and target nodes are present
  links = links.filter((l) => {
    return (
      nodes.some((n) => n.id === l.source) &&
      nodes.some((n) => n.id === l.target)
    );
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const d3Svg = d3.select(svgRef.current);

  const itemClick = useCallback(
    (
      type: string,
      id: string,
      name: string,
      properties: Record<string, string>
    ) => {
      setActiveItem({
        type,
        id,
        name,
        properties,
      });
    },
    [setActiveItem]
  );

  useEffect(() => {
    if (svgRef.current) {
      const { clientWidth, clientHeight } = svgRef.current;
      drawNetworkSvg(d3Svg, clientWidth, clientHeight, nodes, links, itemClick);
    }
  }, [d3Svg, nodes, links, itemClick]);

  return (
    <div style={{ width: WIDTH, height: HEIGHT }}>
      <svg
        ref={svgRef}
        style={{
          width: WIDTH,
          height: HEIGHT,
        }}
      />
    </div>
  );
};
