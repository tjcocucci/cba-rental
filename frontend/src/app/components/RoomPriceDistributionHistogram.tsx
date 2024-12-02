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

      let manyRoomsSum = 0;
      let manyRoomsCount = 0;

      console.log(rawData);
      const histogramData = rawData
        .filter((d: { rooms: number | null }) => d.rooms !== null)
        .reduce(
          (
            acc: { key: string; value: number }[],
            d: { rooms: number; average_price: number; property_count: number }
          ) => {
            if (d.rooms > 5) {
              manyRoomsSum += d.average_price * d.property_count;
              manyRoomsCount += d.property_count;
            } else {
              acc.push({
                key: `${d.rooms} rooms`,
                value: d.average_price,
              });
            }
            return acc;
          },
          []
        );

      console.log(manyRoomsSum, manyRoomsCount);

      if (manyRoomsCount > 0) {
        histogramData.push({
          key: "5+ rooms",
          value: manyRoomsSum / manyRoomsCount,
        });
      }
      console.log(histogramData);
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
