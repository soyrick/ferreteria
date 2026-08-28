/* Gráfica de visitas con Chart.js.
   Se importan solo las piezas que hacen falta —línea, escalas, relleno y
   tooltip— para no arrastrar los tipos de gráfico que no usamos. */

import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Filler, Tooltip,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

const lienzo = document.querySelector('[data-grafica]');

if (lienzo) {
  const datos = JSON.parse(lienzo.dataset.grafica);   // [{ fecha, corta, valor }]
  const css = getComputedStyle(document.documentElement);
  const color = (n) => css.getPropertyValue(n).trim();

  const AMARILLO = color('--amarillo') || '#FFDD00';
  const NEGRO = color('--negro') || '#111214';
  const GRIS = color('--gris-500') || '#7C828C';
  const BORDE = color('--gris-200') || '#E4E7EC';

  Chart.defaults.font.family = css.getPropertyValue('--texto').trim() || 'Inter, sans-serif';

  new Chart(lienzo, {
    type: 'line',
    data: {
      labels: datos.map((d) => d.corta),
      datasets: [{
        data: datos.map((d) => d.valor),
        borderColor: NEGRO,
        borderWidth: 2.5,
        tension: 0.35,                 // curva suave, no picos rectos
        fill: true,
        backgroundColor(ctx) {
          const { ctx: c, chartArea: area } = ctx.chart;
          if (!area) return 'transparent';   // primer frame, todavía sin medidas
          const grad = c.createLinearGradient(0, area.top, 0, area.bottom);
          grad.addColorStop(0, `${AMARILLO}99`);
          grad.addColorStop(1, `${AMARILLO}00`);
          return grad;
        },
        pointRadius: 0,                // limpio; el punto aparece al apuntar
        pointHoverRadius: 6,
        pointHoverBackgroundColor: AMARILLO,
        pointHoverBorderColor: NEGRO,
        pointHoverBorderWidth: 2.5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },   // agarra el día más cercano
      layout: { padding: { top: 8 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: NEGRO,
          padding: 11,
          displayColors: false,
          titleColor: AMARILLO,
          titleFont: { size: 17, weight: '800' },
          bodyColor: '#C9CDD4',
          bodyFont: { size: 12 },
          callbacks: {
            // Arriba el número, abajo la fecha completa.
            title: (items) => items[0].parsed.y.toLocaleString('es-VE') + ' visitas',
            label: (item) => datos[item.dataIndex].fecha,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: BORDE },
          ticks: { color: GRIS, font: { size: 11 }, maxRotation: 0, autoSkipPadding: 24 },
        },
        y: {
          beginAtZero: true,
          grid: { color: BORDE },
          border: { display: false },
          ticks: { color: GRIS, font: { size: 11 }, maxTicksLimit: 5, padding: 8 },
        },
      },
    },
  });
}

/* El selector de mes recarga solo al cambiar. Va acá y no como onchange en el
   HTML: los manejadores en línea rompen con una CSP estricta (F10). */
const formMes = document.querySelector('#form-mes');
if (formMes) {
  formMes.querySelector('select').addEventListener('change', () => formMes.submit());
  formMes.querySelector('button').hidden = true;   // con JS el botón sobra
}
