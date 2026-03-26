import FlowDiagram from "@/components/FlowDiagram"

export default function Page() {
  const mockData = {
    inbound_calls: 100,
    missed_calls: 25,
    booked_appointments: 40,
    estimates_presented: 30,
    estimates_sold: 15,
    revenue: 12000,
  }

  return (
    <div className="p-6 flex justify-center">
      <FlowDiagram data={mockData} />
    </div>
  )
}