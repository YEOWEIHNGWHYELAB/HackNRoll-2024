import * as d3 from "d3";
import {
  D3Edge,
  D3Node,
  MIN_LINK_LEN,
  NODE_ATTRACT_STRENGTH,
  RADIUS,
} from "./data";

const color = d3.scaleOrdinal(d3.schemeCategory10);
const markerSize = RADIUS / 2;

export const drawNetworkSvg = (
  d3Svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
  width: number,
  height: number,
  nodes: D3Node[],
  links: D3Edge[],
  setActiveItem: (
    type: string,
    id: string,
    name: string,
    properties: Record<string, string>
  ) => void
) => {
  links = cleanLinks(links);

  d3Svg.selectAll("*").remove();

  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 10])
    .translateExtent([
      [-100, -100],
      [width + 90, height + 100],
    ])
    .on("zoom", (e: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      d3Svg.attr("transform", e.transform.toString());
    });

  // @ts-expect-error
  d3Svg.call(zoom);

  d3Svg
    .append("svg:defs")
    .selectAll("marker")
    .data(["end"])
    .enter()
    .append("svg:marker")
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 0)
    .attr("refY", 0)
    .attr("markerWidth", markerSize)
    .attr("markerHeight", markerSize)
    .attr("orient", "auto")
    .attr("fill", "#fff")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => (d as D3Node).id)
        .distance(MIN_LINK_LEN)
    )
    .force("charge", d3.forceManyBody().strength(NODE_ATTRACT_STRENGTH))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("bounding-box", () => {
      for (let node of nodes) {
        node.x = Math.max(RADIUS, Math.min(width - RADIUS, node.x || 0));
        node.y = Math.max(RADIUS, Math.min(height - RADIUS, node.y || 0));
      }
    })
    .on("tick", () => ticked(width, height));

  const link = d3Svg
    .append("svg:g")
    .attr("stroke", "#fff")
    .selectAll("path")
    .data(links)
    .enter()
    .append("svg:path")
    .attr("marker-end", "url(#end)")
    .style("fill", "none")
    .attr("id", (d, i) => `link${i}`);

  d3Svg
    .selectAll(".link-text")
    .data(links)
    .enter()
    .append("text")
    .attr("class", "link-text")
    .attr("dx", 30)
    .attr("dy", 0)
    .attr("stroke", "#f00")
    .append("textPath")
    .attr("xlink:href", (d, i) => `#link${i}`)
    .text((d, i) => d.value)
    .style("cursor", "pointer")
    .style("user-select", "none")
    .on("click", (d, e) => {
      setActiveItem("Relationship", e.id, e.value.toString(), e.properties);
    });

  const node = d3Svg
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll()
    .data(nodes)
    .join("circle")
    .attr("r", RADIUS)
    .attr("fill", (d) => color(d.name))
    .attr("data-id", (d) => d.id)
    .style("cursor", "pointer")
    .on("click", (e, d) => {
      setActiveItem("Node", d.id, d.name, d.properties);
    });

  node.call(
    // Drag does not play well with typescript at all
    // @ts-expect-error
    d3
      .drag<SVGCircleElement, D3Node>()
      .on("start", (event, d) => dragstarted(event, d))
      .on("drag", (event, d) => dragged(event, d))
      .on("end", (event, d) => dragended(event, d))
  );

  const nodeLabels = d3Svg
    .append("g")
    .selectAll("g")
    .data(nodes.filter((d) => d.name))
    .enter()
    .append("g")
    .classed("label-box", true)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central");

  nodeLabels
    .append("text")
    .attr("stroke", "#fff")
    .text((d) => d.name)
    .style("cursor", "pointer")
    .style("user-select", "none")
    .on("click", (e, d) => {
      setActiveItem("Node", d.id, d.name, d.properties);
    });

  function dragstarted(
    event: d3.D3DragEvent<SVGCircleElement, D3Node, unknown>,
    d: D3Node
  ) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(
    event: d3.D3DragEvent<SVGCircleElement, D3Node, unknown>,
    d: D3Node
  ) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(
    event: d3.D3DragEvent<SVGCircleElement, D3Node, unknown>,
    d: D3Node
  ) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  function ticked(width: number, height: number) {
    link.attr("d", (d) => linkArc(d, width, height));

    node.attr("transform", (d) => {
      return `translate(${d.x!}, ${d.y})`;
    });

    nodeLabels
      .selectAll("text")
      .attr(
        "transform",
        (d) => `translate(${(d as D3Node).x}, ${(d as D3Node).y})`
      );
  }
};

function linkArc(d: D3Edge, width: number, height: number) {
  const dTarget = d.target as D3Node;
  const dSource = d.source as D3Node;

  const dx = dTarget.x! - dSource.x!,
    dy = dTarget.y! - dSource.y!,
    // dr = Math.sqrt(dx * dx + dy * dy),
    dr = 120 / (d.linkNum ?? 1),
    gamma = Math.atan2(dy, dx),
    sx = Math.max(
      RADIUS,
      Math.min(width - RADIUS, dSource.x! + Math.cos(gamma) * RADIUS)
    ),
    sy = Math.max(
      RADIUS,
      Math.min(height - RADIUS, dSource.y! + Math.sin(gamma) * RADIUS)
    ),
    tx = Math.max(
      RADIUS,
      Math.min(
        width - RADIUS,
        dTarget.x! - Math.cos(gamma) * (RADIUS + markerSize)
      )
    ),
    ty = Math.max(
      RADIUS,
      Math.min(
        height - RADIUS,
        dTarget.y! - Math.sin(gamma) * (RADIUS + markerSize)
      )
    );
  return `M${sx},${sy}A${dr},${dr} 0 0,1${tx},${ty}`;
}

function cleanLinks(links: D3Edge[]) {
  links.sort(function (a, b) {
    if (a.source > b.source) {
      return 1;
    } else if (a.source < b.source) {
      return -1;
    } else {
      if (a.target > b.target) {
        return 1;
      }
      if (a.target < b.target) {
        return -1;
      } else {
        return 0;
      }
    }
  });
  for (let i = 0; i < links.length; i++) {
    if (
      i !== 0 &&
      links[i].source === links[i - 1].source &&
      links[i].target === links[i - 1].target
    ) {
      links[i].linkNum = (links[i - 1].linkNum ?? 0) + 1;
    } else {
      links[i].linkNum = 1;
    }
  }
  return links;
}
