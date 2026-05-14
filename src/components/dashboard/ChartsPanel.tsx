import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import type { ChartData } from "chart.js";
import { SectionCard } from "../ui";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

type Props = {
  chartCursosPorPrioridad: ChartData<"doughnut", number[], string>;
  chartEvaluacionesPorEstado: ChartData<"doughnut", number[], string>;
  chartPresupuesto: ChartData<"bar", number[], string>;
};

export default function ChartsPanel({
  chartCursosPorPrioridad,
  chartEvaluacionesPorEstado,
  chartPresupuesto,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionCard title="Cursos por prioridad">
        <div className="h-48">
          <Doughnut data={chartCursosPorPrioridad} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } } }} />
        </div>
      </SectionCard>
      <SectionCard title="Evaluaciones por estado">
        <div className="h-48">
          <Doughnut data={chartEvaluacionesPorEstado} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } } }} />
        </div>
      </SectionCard>
      <SectionCard title="Presupuesto: usado vs disponible">
        <div className="h-48">
          <Bar data={chartPresupuesto} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } }, scales: { x: { stacked: true }, y: { stacked: true } } }} />
        </div>
      </SectionCard>
    </div>
  );
}
