"use client";

import useFetchData from "../hooks/useFetchData";
import PieChart from "./PieChart";

interface RoomsPieChartProps {
  rooms: number;
  property_count: number;
}

const RoomsPieChart = () => {
  const API_URL = process.env.NEXT_PUBLIC_PROPERTIES_API_URL;

  const { data, loading, error } = useFetchData<RoomsPieChartProps[]>(
    `${API_URL}properties/stats/per-room`
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const totalProperties = data?.reduce(
    (sum, item) => sum + (item.property_count || 0),
    0
  );

  const pieChartData = (data || [])
    .filter((d: { rooms: number | null }) => d.rooms !== null)
    .map((d: { rooms: number; property_count: number }) => ({
      key: d.rooms,
      value: (d.property_count / totalProperties!) * 100,
    }));

  return <PieChart data={pieChartData} width={400} height={400} />;
};

export default RoomsPieChart;
