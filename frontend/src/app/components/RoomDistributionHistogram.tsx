"use client";

import Histogram from "./Histogram";
import useFetchData from "../hooks/useFetchData";

interface RoomsHistogramProps {
  rooms: number;
  property_count: number;
}

const RoomsHistogram = () => {
  const API_URL = process.env.NEXT_PUBLIC_PROPERTIES_API_URL;

  const { data, loading, error } = useFetchData<RoomsHistogramProps[]>(
    `${API_URL}properties/stats/per-room`
  );
  console.log(data);

  const totalProperties = (data || []).reduce(
    (acc, d) => acc + d.property_count,
    0
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const histogramData = (data || [])
    .filter((d: { rooms: number | null }) => d.rooms !== null)
    .map((d: { rooms: number; property_count: number }) => ({
      key: d.rooms,
      value: (d.property_count / totalProperties) * 100,
    }));

  return (
    <Histogram
      data={histogramData}
      xLabel="Rooms"
      yLabel="Number of Properties [%]"
      barColor="steelblue"
    />
  );
};

export default RoomsHistogram;
