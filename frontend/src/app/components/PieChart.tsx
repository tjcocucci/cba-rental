"use client";

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

interface PieChartProps {
  data: { key: number | string; value: number }[];
  width?: number;
  height?: number;
  colors?: string[];
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  width = 400,
  height = 400,
  colors = d3.schemeCategory10,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const radius = Math.min(width, height) / 2;
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3
      .pie<{ key: number | string; value: number }>()
      .value((d) => d.value);

    const arc = d3.arc<d3.PieArcDatum<{ key: number | string; value: number }>>()
      .innerRadius(0) // Set to 0 for a full pie chart
      .outerRadius(radius);

    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(data.map((d) => d.key.toString()))
      .range(colors);

    svg
      .selectAll("path")
      .data(pie(data))
      .join("path")
      .attr("d", arc)
      .attr("fill", (d) => colorScale(d.data.key.toString()) || "gray")
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    // Add labels
    svg
      .selectAll("text")
      .data(pie(data))
      .join("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "white")
      .text((d) => `${d.data.key}: ${d.data.value}%`);

    return () => {
      d3.select(svgRef.current).selectAll("*").remove(); // Cleanup on unmount
    };
  }, [data, width, height, colors]);

  return <svg ref={svgRef}></svg>;
};

export default PieChart;
