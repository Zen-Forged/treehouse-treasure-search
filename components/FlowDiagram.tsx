"use client"

type FlowProps = {
  data: {
    inbound_calls: number
    missed_calls: number
    booked_appointments: number
    estimates_presented: number
    estimates_sold: number
    revenue: number
  }
}

export default function FlowDiagram({ data }: FlowProps) {
  const answered = data.inbound_calls - data.missed_calls
  const lostAfterEstimates =
    data.estimates_presented - data.estimates_sold

  return (
    <div className="flex flex-col items-center space-y-4">

      {/* CALLS */}
      <Node label="CALLS" value={data.inbound_calls} />

      <Pipe />

      {/* MISSED CALL LEAK */}
      {data.missed_calls > 0 && (
        <Leak
          label="Missed Calls"
          value={data.missed_calls}
        />
      )}

      {/* ANSWERED */}
      <Node label="ANSWERED" value={answered} />

      <Pipe />

      {/* BOOKINGS */}
      <Node
        label="BOOKED"
        value={data.booked_appointments}
        warning={data.booked_appointments < answered * 0.6}
      />

      <Pipe />

      {/* ESTIMATES */}
      <Node
        label="ESTIMATES"
        value={data.estimates_presented}
      />

      <Pipe />

      {/* CLOSE RATE LEAK */}
      {lostAfterEstimates > 0 && (
        <Leak
          label="Unsold Estimates"
          value={lostAfterEstimates}
        />
      )}

      {/* SALES */}
      <Node label="SALES" value={data.estimates_sold} />

      <Pipe />

      {/* REVENUE */}
      <Node
        label="REVENUE"
        value={`$${data.revenue}`}
        highlight
      />
    </div>
  )
}

function Node({
  label,
  value,
  warning,
  highlight,
}: any) {
  return (
    <div
      className={`w-40 text-center p-4 rounded-xl shadow
        ${highlight ? "bg-green-100" : "bg-white"}
        ${warning ? "border border-yellow-400" : ""}
      `}
    >
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

function Pipe() {
  return <div className="w-1 h-6 bg-gray-300" />
}

function Leak({ label, value }: any) {
  return (
    <div className="text-red-500 text-sm flex items-center gap-1">
      💨 {value} {label}
    </div>
  )
}