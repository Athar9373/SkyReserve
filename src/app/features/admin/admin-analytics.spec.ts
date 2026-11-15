import { Chart } from 'chart.js';
import './admin-analytics';

describe('AdminAnalyticsComponent chart setup', () => {
  it('registers controllers for each analytics chart type', () => {
    expect(() => Chart.registry.getController('line')).not.toThrow();
    expect(() => Chart.registry.getController('bar')).not.toThrow();
    expect(() => Chart.registry.getController('doughnut')).not.toThrow();
  });
});
