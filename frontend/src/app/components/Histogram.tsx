"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface HistogramProps {
  data: { key: number | string; value: number }[];
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  barColor?: string;
  margin?: { top: number; right: number; bottom: number; left: number };
}

const Histogram: React.FC<HistogramProps> = ({
  data,
  width = 500,
  height = 300,
  xLabel = "Key",
  yLabel = "Value",
  barColor = "steelblue",
  margin = {
    top: height / 10,
    right: width / 10,
    bottom: height * 0.15,
    left: width / 10,
  },
}) => {
  console.log(data);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.key.toString()))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) || 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.selectAll("*").remove(); // Clear previous render

    // Tooltip group
    const tooltip = svg.append("g").style("display", "none");

    // Horizontal ruler
    const ruler = tooltip
      .append("line")
      .attr("stroke", "gray")
      .attr("stroke-dasharray", "4 4");

    // Bars
    svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.key.toString()) || 0)
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => y(0) - y(d.value))
      .attr("width", x.bandwidth())
      .attr("fill", barColor)
      .on("mouseover", function (_, d) {
        d3.select(this).attr("fill", "orange"); // Highlight bar
        tooltip.style("display", null); // Show tooltip group
      })
      .on("mousemove", function (event, d) {
        tooltip
          .select("line")
          .attr("x1", margin.left)
          .attr("x2", width - margin.right)
          .attr("y1", y(d.value))
          .attr("y2", y(d.value))
          .attr("stroke-width", 1);

        ruler
          .attr("x1", margin.left)
          .attr("x2", width - margin.right)
          .attr("y1", y(d.value))
          .attr("y2", y(d.value))
          .attr("stroke-width", 1);
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", barColor); // Reset bar color
        tooltip.style("display", "none"); // Hide tooltip group
      });

    // X-axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text");

    // Y-axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // X-axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
      .attr("y", height - 10)
      .attr("fill", "white")
      .text(xLabel);

    // Y-axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${margin.left - 30}, ${
          (height - margin.top - margin.bottom) / 2 + margin.top
        }) rotate(-90)`
      )
      .attr("fill", "white")
      .text(yLabel);
  }, [data, width, height, xLabel, yLabel, barColor, margin]);

  return <svg ref={svgRef}></svg>;
};

export default Histogram;
