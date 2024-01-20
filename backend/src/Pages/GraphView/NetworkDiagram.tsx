import * as d3 from "d3";
import { D3Edge, D3Node, GraphData } from "./data";
import { useEffect, useRef } from "react";
import { drawNetworkSvg } from "./drawNetwork";

type NetworkDiagramProps = {
  width: number;
  height: number;
  data: GraphData;
};

export const NetworkDiagram = ({
  width,
  height,
  data,
}: NetworkDiagramProps) => {
  const links: D3Edge[] = data.links.map((d) => ({ ...d }));
  const nodes: D3Node[] = data.nodes.map((d) => ({ ...d }));

  const svgRef = useRef<SVGSVGElement>(null);
  const d3Svg = d3.select(svgRef.current);

  useEffect(() => {
    if (svgRef.current) {
      drawNetworkSvg(d3Svg, width, height, nodes, links);
    }
  }, [d3Svg, height, width, nodes, links]);

  return (
    <div>
      <svg
        ref={svgRef}
        style={{
          width,
          height,
        }}
        width={width}
        height={height}
      />
    </div>
  );
};
