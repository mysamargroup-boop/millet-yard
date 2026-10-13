'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, DollarSign, MousePointerClick, TrendingUp } from "lucide-react";
import type { Subscription } from '@/lib/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions = (text: string) => ({
  responsive: true,
  plugins: {
    legend: { position: 'top' as const },
    title: { display: true, text },
  },
});

function getLastNDaysLabels(n: number) {
  const labels: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    labels.push(d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
  }
  return labels;
}

const COLORS = [
  'rgba(255, 99, 132, 0.7)',
  'rgba(54, 162, 235, 0.7)',
  'rgba(255, 206, 86, 0.7)',
  'rgba(75, 192, 192, 0.7)',
  'rgba(153, 102, 255, 0.7)',
  'rgba(255, 159, 64, 0.7)',
];

export default function LeadsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/subscriptions');
        if (!res.ok) return;
        const data = await res.json();
        const rows = Array.isArray(data?.subscriptions)
          ? (data.subscriptions as Subscription[])
          : [];
        setSubscriptions(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const labels = useMemo(() => getLastNDaysLabels(7), []);
  const dailyCounts = useMemo(() => {
    const map: Record<string, number> = {};
    labels.forEach(l => (map[l] = 0));
    subscriptions.forEach(s => {
      const l = new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (map[l] !== undefined) map[l] += 1;
    });
    return labels.map(l => map[l] || 0);
  }, [subscriptions, labels]);

  const sources = useMemo(() => {
    const m: Record<string, number> = {};
    subscriptions.forEach(s => {
      const key = (s.source || 'unknown').toLowerCase();
      m[key] = (m[key] || 0) + 1;
    });
    return m;
  }, [subscriptions]);

  const lineData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Subscriptions',
        data: dailyCounts,
        borderColor: '#8884d8', // Purple
        backgroundColor: 'rgba(136, 132, 216, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  }), [labels, dailyCounts]);

  const barData = useMemo(() => {
    const sLabels = Object.keys(sources);
    const sData = sLabels.map(k => sources[k]);
    return {
      labels: sLabels.length ? sLabels : ['unknown'],
      datasets: [
        {
          label: 'Leads by Source',
          data: sData.length ? sData : [subscriptions.length],
          backgroundColor: COLORS.slice(0, sLabels.length || 1),
          borderColor: COLORS.slice(0, sLabels.length || 1).map(c => c.replace('0.7', '1')),
          borderWidth: 1,
        },
      ],
    };
  }, [sources, subscriptions.length]);

  const pieData = useMemo(() => {
    const sLabels = Object.keys(sources);
    const sData = sLabels.map(k => sources[k]);
    const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--secondary))'];
    return {
      labels: sLabels.length ? sLabels : ['unknown'],
      datasets: [{
        data: sData.length ? sData : [subscriptions.length],
        backgroundColor: colors.slice(0, sLabels.length || 1),
        hoverOffset: 4,
      }]
    };
  }, [sources, subscriptions.length]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-headline font-bold flex items-center justify-center gap-3"><Users /> Leads Dashboard</h1>
        <p className="text-muted-foreground mt-2">Monitor and analyze your lead performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Subscriptions</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{subscriptions.length}</div>
            <p className="text-xs text-blue-600/80">{loading ? 'Loading...' : 'All-time collected leads'}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Last 7 Days</CardTitle>
            <MousePointerClick className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{dailyCounts.reduce((a, b) => a + b, 0)}</div>
            <p className="text-xs text-emerald-600/80">Subscriptions in past week</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Top Source</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 capitalize">{Object.keys(sources).sort((a, b) => sources[b] - sources[a])[0] || 'unknown'}</div>
            <p className="text-xs text-amber-600/80">Most frequent lead source</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Unique Sources</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{Object.keys(sources).length || 1}</div>
            <p className="text-xs text-purple-600/80">Different lead sources tracked</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-t-4 border-t-indigo-500 shadow-sm">
          <CardHeader>
            <CardTitle>Leads Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <Line data={lineData} options={chartOptions('Subscriptions Over Time')} />
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-pink-500 shadow-sm">
          <CardHeader>
            <CardTitle>Leads by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={barData} options={chartOptions('Leads per Source')} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Traffic Source Overview</CardTitle>
          <CardDescription>Visual representation of where your leads originate.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="w-full max-w-sm">
            <Pie data={pieData} options={chartOptions('Lead Sources')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
          <CardDescription>Latest 5 form submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscriptions.slice(0, 5).map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-medium">{sub.name || 'N/A'}</td>
                    <td className="p-3">{sub.phone || 'N/A'}</td>
                    <td className="p-3 capitalize">{sub.source || 'Unknown'}</td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">No leads found yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
