"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface RoomHistogramData {
  average_price: number | null;
  property_count: number | null;
  rooms: number | null;
}

const RoomHistogram = () => {
  const API_URL = process.env.NEXT_PUBLIC_PROPERTIES_API_URL;
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`${API_URL}properties/stats/per-room`);
      const data: RoomHistogramData[] = (await response.json()).filter(
        (d: RoomHistogramData) => d.rooms !== null
      );

      const width = 500;
      const height = 300;
      const margin = { top: 20, right: 30, bottom: 50, left: 40 };

      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height);

      const x = d3
        .scaleBand()
        .domain(data.map((d: RoomHistogramData) => d.rooms!.toString()))
        .range([margin.left, width - margin.right])
        .padding(0.1);

      const y = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(data, (d: RoomHistogramData) => d.property_count) || 0,
        ])
        .nice()
        .range([height - margin.bottom, margin.top]);

      svg.selectAll("*").remove();

      svg
        .append("g")
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (d: RoomHistogramData) => x(d.rooms!.toString()) || 0)
        .attr("y", (d: RoomHistogramData) => y(d.property_count!) || 0)
        .attr("height", (d: RoomHistogramData) => y(0) - y(d.property_count!))
        .attr("width", x.bandwidth())
        .attr("fill", "steelblue");

      svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat((d: string) => `${d}`))
        .selectAll("text");

      svg
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));
    };

    fetchData();
  }, []);

  return <svg ref={svgRef}></svg>;
};

export default RoomHistogram;
