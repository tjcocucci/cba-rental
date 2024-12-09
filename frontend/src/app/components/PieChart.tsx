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
  margin = { top: 50, right: 50, bottom: 50, left: 50 },
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

    d3.select(svgRef.current)
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
      .selectAll("g.slice")
      .data(pie(largeCategories))
      .join("g")
      .attr("class", "slice")
      .on("mouseover", function (event, d) {
        setHoveredIndex(d.index);
        d3.select(this)
          .raise()
          .select("path")
          .attr("stroke-width", 4)
          .transition()
          .duration(200)
          .attr(
            "d",
            d3
              .arc()
              .innerRadius(0)
              .outerRadius(radius + 10)
          );

        const percentage = ((d.data.value / total) * 100).toFixed(2);
        const [x, y] = arc.centroid(d);
        d3.select(this)
          .select("g.tooltip")
          .attr("transform", `translate(${x - 50}, ${y - 25})`)
          .style("opacity", 1)
          .raise();
        d3.select(this).select("text").text(`${d.data.key}: ${percentage}%`);
      })
      .on("mouseout", function () {
        setHoveredIndex(null);
        d3.select(this)
          .select("path")
          .attr("stroke-width", 2)
          .transition()
          .duration(200)
          .attr("d", arc);

        d3.select(this).select("g.tooltip").style("opacity", 0);
      });

    slices
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => colorScale(d.data.key.toString()) || "gray")
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    const tooltipGroup = slices
      .append("g")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("pointer-events", "none");

    tooltipGroup
      .append("rect")
      .attr("width", 100)
      .attr("height", 50)
      .attr("fill", "black")
      .attr("rx", 5)
      .attr("ry", 5);

    tooltipGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("x", 50)
      .attr("y", 25);

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
