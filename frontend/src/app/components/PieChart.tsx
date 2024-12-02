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
  margin?: { top: number; right: number; bottom: number; left: number }; // Margins for spacing
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  width = 400,
  height = 400,
  colors = d3.schemeCategory10,
  showList = true,
  tinyThreshold = 5, // Default to group categories <5% as "Other"
  otherLabel = "Other",
  margin = { top: 10, right: 10, bottom: 10, left: 10 },
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
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const radius = Math.min(chartWidth, chartHeight) / 2;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .select("g")
      .remove();

    const chartGroup = d3
      .select(svgRef.current)
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left + chartWidth / 2}, ${
          margin.top + chartHeight / 2
        })`
      );

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
  }, [largeCategories, width, height, margin, colors, hoveredIndex, total]);

  return (
    <div className="flex flex-row items-start gap-6">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="flex-1 w-60 h-full w-full h-full"
        ref={svgRef}
      ></svg>
      {showList && (
        <ul className="flex-1 w-40 h-full bg-gray-100 list-none rounded-lg p-5 m-0">
          {largeCategories.map((d, i) => (
            <li
              key={i}
              className={`mb-1 ${
                hoveredIndex === i ? "text-blue-600 font-bold" : "text-black"
              }`}
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
