import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Calendar, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TimetablePage() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];
  return (
    <div className="animate-fade-in">
      <PageHeader title="Timetable" description="Manage class and teacher timetables. Conflicts are prevented automatically." action="Create Slot" actionHref="#" actionIcon={<Plus className="w-4 h-4" />} />
      <div className="card p-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-2 text-left font-semibold text-xs uppercase text-slate-500">Period</th>
              {days.map((d) => <th key={d} className="p-2 text-left font-semibold text-xs uppercase text-slate-500">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p} className="border-t border-slate-100">
                <td className="p-2 font-semibold text-slate-700">Period {p}</td>
                {days.map((d) => (
                  <td key={d} className="p-2 text-slate-400 text-xs italic">—</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-500 mt-3">No timetable slots yet. Add slots using the button above. The system prevents teacher/class double-bookings.</p>
      </div>
    </div>
  );
}
