export function renderCharts(
  totalVencidos: number,
  totalHoje: number,
  totalAVencer: number,
  topDistritos: Array<{ districtNumber: string; quantity: number }>
): void {
  const Chart = (window as any)['Chart'];
  if (!Chart) return;

  new Chart(document.getElementById('chartjs-status'), {
    type: 'doughnut',
    data: {
      labels: ['Vencidos', 'Vencem Hoje', 'A Vencer'],
      datasets: [
        {
          data: [totalVencidos, totalHoje, totalAVencer],
          backgroundColor: ['#ef4444', '#f97316', '#10b981'],
          borderWidth: 0,
          hoverOffset: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '50%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: { family: 'system-ui' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,.9)',
          padding: 12,
          cornerRadius: 8
        }
      }
    }
  });

  new Chart(document.getElementById('chartjs-volume'), {
    type: 'bar',
    data: {
      labels: topDistritos.map((d) => d.districtNumber),
      datasets: [
        {
          label: 'Volume',
          data: topDistritos.map((d) => d.quantity),
          backgroundColor: '#3b82f6',
          borderRadius: 4,
          barPercentage: 0.85,
          categoryPercentage: 0.9
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,.9)',
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#e2e8f0' },
          border: { display: false },
          ticks: { font: { family: 'system-ui' }, color: '#64748b' }
        },
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { font: { family: 'system-ui' }, color: '#64748b' }
        }
      }
    }
  });
}

export async function ensureChartJs(): Promise<void> {
  if ((window as any)['Chart']) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/chart.js@4/dist/chart.umd.min.js';
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
