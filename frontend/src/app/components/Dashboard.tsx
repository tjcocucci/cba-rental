import React from "react";
import RoomHistogram from "./RoomDistributionHistogram";
import RoomPriceHistogram from "./RoomPriceDistributionHistogram";
import RoomsPieChart from "./RoomDistributionPiechart";

export default function Dashboard() {
  return (
    <main className="container mx-auto p-4 flex-grow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RoomHistogram />
        <RoomPriceHistogram />
        <RoomsPieChart />
      </div>
    </main>
  );
}
