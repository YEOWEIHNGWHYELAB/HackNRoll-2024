import * as d3 from "d3";
import { D3Edge, D3Node, NODE_ATTRACT_STRENGTH, RADIUS } from "./data";

const color = d3.scaleOrdinal(d3.schemeCategory10);

export const drawNetworkSvg = (
  d3Svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
  width: number,
  height: number,
  nodes: D3Node[],
  links: D3Edge[]
) => {
  d3Svg.selectAll("*").remove();

  d3Svg
    .append("svg:defs")
    .selectAll("marker")
    .data(["end"])
    .enter()
    .append("svg:marker")
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", 0.5)
    .attr("markerWidth", 2)
    .attr("markerHeight", 2)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links).id((d) => (d as D3Node).id)
    )
    .force("charge", d3.forceManyBody().strength(NODE_ATTRACT_STRENGTH))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", ticked);

  const link = d3Svg
    .append("g")
    .attr("stroke", "#fff")
    .selectAll()
    .data(links)
    .join("line")
    .attr("marker-end", "url(#end)")
    .attr("stroke-width", 2);

  const node = d3Svg
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll()
    .data(nodes)
    .join("circle")
    .attr("r", RADIUS)
    .attr("fill", (d) => color(d.group));

  node
    .append("text")
    .text((d) => d.name)
    .attr("font", "monospace")
    .attr("text-anchor", "middle")
    .attr("fill", (d) => "#fff")
    .attr("font-size", "1em");

  node.call(
    // Drag does not play well with typescript at all
    // @ts-expect-error
    d3
      .drag<SVGCircleElement, D3Node>()
      .on("start", (event, d) => dragstarted(event, d))
      .on("drag", (event, d) => dragged(event, d))
      .on("end", (event, d) => dragended(event, d))
  );

  const labels = d3Svg
    .append("g")
    .selectAll("g")
    .data(nodes.filter((d) => d.name))
    .enter()
    .append("g")
    .classed("label-box", true)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central");

  labels
    .append("text")
    .classed("glow", true)
    .attr("stroke", "#fff")
    .attr("stroke-width", 5)
    .text((d) => d.name);
  labels
    .append("text")
    .attr("fill", "black")
    .text((d) => d.name);

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

  function ticked() {
    link
      .attr("x1", (d) => (d.source as D3Node).x!)
      .attr("y1", (d) => (d.source as D3Node).y!)
      .attr("x2", (d) => (d.target as D3Node).x!)
      .attr("y2", (d) => (d.target as D3Node).y!);

    node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);

    labels
      .selectAll("text")
      .attr("x", (d) => (d as D3Node).x!)
      .attr("y", (d) => (d as D3Node).y!);
  }
};
