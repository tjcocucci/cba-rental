import React from "react";
import RoomHistogram from "./RoomDistributionHistogram";

export default function Dashboard() {
  return (
    <main className="container mx-auto p-4 flex-grow">
      <RoomHistogram />
    </main>
  );
}
