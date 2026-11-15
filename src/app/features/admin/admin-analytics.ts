import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { AdminAnalytics } from '../../core/admin/admin.service';

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  templateUrl: './admin-analytics.html',
})
export class AdminAnalyticsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) analytics: AdminAnalytics | null = null;
  @ViewChild('salesCanvas') salesCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueCanvas') revenueCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusCanvas') statusCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('routesCanvas') routesCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly charts: Chart[] = [];
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['analytics'] && this.viewReady) this.renderCharts();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private destroyCharts(): void {
    for (const chart of this.charts.splice(0)) chart.destroy();
  }

  private renderCharts(): void {
    this.destroyCharts();
    const data = this.analytics;
    if (!data) return;

    if (this.salesCanvas) {
      this.charts.push(new Chart(this.salesCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: data.ticketSalesTrend.map((point) => point.date),
          datasets: [
            {
              label: 'Tickets sold',
              data: data.ticketSalesTrend.map((point) => point.bookings),
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              fill: true,
              tension: 0.3,
            },
            {
              label: 'Cancellations',
              data: data.ticketSalesTrend.map((point) => point.cancellations),
              borderColor: '#e11d48',
              backgroundColor: 'rgba(225, 29, 72, 0.1)',
              tension: 0.3,
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      }));
    }

    if (this.revenueCanvas) {
      this.charts.push(new Chart(this.revenueCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: data.revenueByMonth.map((point) => point.month),
          datasets: [{
            label: 'Revenue (₹)',
            data: data.revenueByMonth.map((point) => point.revenue),
            backgroundColor: '#0f766e',
          }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      }));
    }

    if (this.statusCanvas) {
      const statuses = Object.entries(data.flightStatusDistribution);
      this.charts.push(new Chart(this.statusCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: statuses.map(([status]) => status),
          datasets: [{
            data: statuses.map(([, count]) => count),
            backgroundColor: ['#16a34a', '#f59e0b', '#e11d48', '#64748b'],
          }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      }));
    }

    if (this.routesCanvas) {
      this.charts.push(new Chart(this.routesCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: data.topRoutes.map((route) => route.route),
          datasets: [{
            label: 'Tickets booked',
            data: data.topRoutes.map((route) => route.bookings),
            backgroundColor: '#7c3aed',
          }],
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' },
      }));
    }
  }
}
