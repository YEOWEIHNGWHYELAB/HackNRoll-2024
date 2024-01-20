import * as d3 from "d3";
import { D3Edge, D3Node, GraphData, GraphSelection } from "./data";
import { useCallback, useEffect, useRef } from "react";
import { drawNetworkSvg } from "./drawNetwork";

type NetworkDiagramProps = {
  data: GraphData;
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
  setActiveItem,
}: NetworkDiagramProps) => {
  const links: D3Edge[] = data.links.map((d) => ({ ...d }));
  const nodes: D3Node[] = data.nodes.map((d) => ({ ...d }));

  const svgRef = useRef<SVGSVGElement>(null);
  const d3Svg = d3.select(svgRef.current);

  const itemClick = useCallback(
    (type: string, id: string, name: string) => {
      setActiveItem({
        type,
        id,
        name,
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
