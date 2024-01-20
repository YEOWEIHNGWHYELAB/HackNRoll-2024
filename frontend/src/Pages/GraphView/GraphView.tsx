import axios from "axios";
import React, { useEffect, useState } from "react";
import setHeaderToken from "../../Contexts/SetHeaderToken";
import { NetworkDiagram } from "./NetworkDiagram";
import { GraphData } from "./data";

import RequestGraph from "../../Hooks/RequestGraph";

const GraphView: React.FC = () => {
  const { res, loadFullGraph } = RequestGraph();

  const [d3Graph, setD3Graph] = useState<GraphData>({ nodes: [], links: [] });

  async function loadGraph() {
    try {
      loadFullGraph();
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadGraph();
  }, []);

  useEffect(() => {
    if (res) {
      const data = res.data;
      setD3Graph(data);
    }
  }, [res]);

  return (
    <div>
      <NetworkDiagram data={d3Graph} width={800} height={800} />
    </div>
  );
};

export default GraphView;
