"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

interface PieChartProps {
  data: { key: number | string; value: number }[];
  width?: number;
  height?: number;
  colors?: string[];
  showList?: boolean; // Optional list of values
  tinyThreshold?: number; // Threshold for tiny categories (as a percentage)
  otherLabel?: string; // Label for grouped tiny categories
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  width = 400,
  height = 400,
  colors = d3.schemeCategory10,
  showList = true,
  tinyThreshold = 5, // Default to group categories <5% as "Other"
  otherLabel = "Other",
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Process data to group tiny categories
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const processedData = [...data].sort((a, b) => b.value - a.value);
  const tinyCategories = processedData.filter(
    (d) => (d.value / total) * 100 < tinyThreshold
  );
  const largeCategories = processedData.filter(
    (d) => (d.value / total) * 100 >= tinyThreshold
  );
  if (tinyCategories.length > 0) {
    const otherValue = tinyCategories.reduce((sum, d) => sum + d.value, 0);
    largeCategories.push({ key: otherLabel, value: otherValue });
  }

  useEffect(() => {
    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .select("g")
      .remove();

    const chartGroup = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3
      .pie<{ key: number | string; value: number }>()
      .value((d) => d.value);

    const arc = d3
      .arc<d3.PieArcDatum<{ key: number | string; value: number }>>()
      .innerRadius(0) // Full pie chart
      .outerRadius(radius);

    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(largeCategories.map((d) => d.key.toString()))
      .range(colors);

    const slices = chartGroup
      .selectAll("path")
      .data(pie(largeCategories))
      .join("path")
      .attr("d", arc)
      .attr("fill", (d) => colorScale(d.data.key.toString()) || "gray")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .on("mouseover", (_, i) => setHoveredIndex(i.index))
      .on("mouseout", () => setHoveredIndex(null));

    const tooltip = d3
      .select(svgRef.current)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "white")
      .style("opacity", 0);

    slices
      .on("mousemove", (event, d) => {
        const percentage = ((d.data.value / total) * 100).toFixed(2);
        tooltip
          .text(`${d.data.key}: ${percentage}%`)
          .attr("x", event.offsetX - 10)
          .attr("y", event.offsetY - 10)
          .style("opacity", 1);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    return () => {
      d3.select(svgRef.current).selectAll("*").remove(); // Cleanup on unmount
    };
  }, [largeCategories, width, height, colors, hoveredIndex, total]);

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <svg ref={svgRef}></svg>
      {showList && (
        <ul style={{ marginLeft: "20px" }}>
          {largeCategories.map((d, i) => (
            <li
              key={i}
              style={{
                color: hoveredIndex === i ? "steelblue" : "black",
                fontWeight: hoveredIndex === i ? "bold" : "normal",
              }}
              onMouseOver={() => setHoveredIndex(i)}
              onMouseOut={() => setHoveredIndex(null)}
            >
              {d.key}: {((d.value / total) * 100).toFixed(2)}%
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PieChart;
