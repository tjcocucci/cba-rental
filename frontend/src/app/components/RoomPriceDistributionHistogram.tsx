"use client";

import React, { useState, useEffect } from "react";
import Histogram from "./Histogram";

const RoomPriceHistogram = () => {
  const [data, setData] = useState<{ key: number; value: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const API_URL = process.env.NEXT_PUBLIC_PROPERTIES_API_URL;
      const response = await fetch(`${API_URL}properties/stats/per-room`);
      const rawData = await response.json();
      console.log(rawData);
      const histogramData = rawData
        .filter((d: { rooms: number | null }) => d.rooms !== null)
        .map((d: { rooms: number; average_price: number }) => ({
          key: d.rooms,
          value: d.average_price,
        }));
      setData(histogramData);
    };

    fetchData();
  }, []);

  return (
    <Histogram
      data={data}
      xLabel="Rooms"
      yLabel="Average Price [USD]"
      barColor="steelblue"
    />
  );
};

export default RoomPriceHistogram;
