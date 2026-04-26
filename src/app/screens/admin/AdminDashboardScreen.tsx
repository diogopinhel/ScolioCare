import React from 'react';
import { Users, Activity, Shield, AlertTriangle, Server, Database, Cpu, HardDrive, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const kpis = [
  { icon: Users, label: 'Utilizadores activos', value: '47', delta: '+3 esta semana', color: 'var(--scolio-primary-blue)', bg: 'var(--scolio-light-blue-surface)' },
  { icon: Activity, label: 'Exames últimas 24h', value: '128', delta: '+12% vs ontem', color: 'var(--scolio-success-green)', bg: 'var(--scolio-success-surface)' },
  { icon: Cpu, label: 'Uptime IA Engine', value: '99.97%', delta: 'Últimos 30 dias', color: 'var(--scolio-success-green)', bg: 'var(--scolio-success-surface)' },
  { icon: AlertTriangle, label: 'Alertas de segurança', value: '4', delta: '2 críticos', color: 'var(--scolio-danger-coral)', bg: 'var(--scolio-danger-surface)' },
];

const usageData = [
  { day: 'Seg', medico: 45, tecnico: 28, admin: 8 },
  { day: 'Ter', medico: 52, tecnico: 31, admin: 6 },
  { day: 'Qua', medico: 48, tecnico: 35, admin: 9 },
  { day: 'Qui', medico: 61, tecnico: 29, admin: 7 },
  { day: 'Sex', medico: 55, tecnico: 33, admin: 11 },
  { day: 'Sáb', medico: 18, tecnico: 12, admin: 2 },
  { day: 'Dom', medico: 9, tecnico: 4, admin: 1 },
];

const services = [
  { name: 'IA Engine (TorchServe)', status: 'ok', latency: '218ms', uptime: '99.97%' },
  { name: 'Base de dados (PostgreSQL)', status: 'ok', latency: '12ms', uptime: '99.99%' },
  { name: 'Storage DICOM (S3)', status: 'ok', latency: '45ms', uptime: '99.95%' },
  { name: 'API Gateway', status: 'warn', latency: '380ms', uptime: '99.82%' },
  { name: 'Serviço de notificações', status: 'ok', latency: '88ms', uptime: '99.91%' },
];

const securityEvents = [
  { time: '09:42', user: 'desconhecido@—', event: 'Login falhado (5 tentativas)', ip: '203.45.12.88', severity: 'high' },
  { time: '08:45', user: 'Dr. Ana Martins', event: 'Acesso Glass-Break a PT-2024-0756', ip: '192.168.1.45', severity: 'medium' },
  { time: '08:30', user: 'Paulo Oliveira', event: 'Exportação de dados anonimizados', ip: '192.168.1.38', severity: 'low' },
  { time: '07:12', user: 'Dr. Luísa Fernandes', event: 'Alteração de relatório assinado', ip: '192.168.1.67', severity: 'medium' },
];

export default function AdminDashboardScreen() {
  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <div>
        <h1 className="text-[var(--scolio-text-primary)]">Painel de administração</h1>
        <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-body)' }}>
          Centro Hospitalar Universitário de Lisboa Norte, EPE — visão global do sistema
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: k.bg }}>
                  <Icon className="w-6 h-6" style={{ color: k.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>{k.label}</p>
                  <p className="text-[var(--scolio-text-primary)] font-semibold mt-1" style={{ fontSize: 'var(--text-h2)' }}>{k.value}</p>
                  <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>{k.delta}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Usage chart */}
        <div className="col-span-2 bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">Utilização por módulo (últimos 7 dias)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--scolio-border-light)" />
              <XAxis dataKey="day" tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }} />
              <YAxis tick={{ fill: 'var(--scolio-text-secondary)', fontSize: 13 }} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid var(--scolio-border-light)', borderRadius: 'var(--radius-component)', fontSize: '13px' }} />
              <Bar dataKey="medico" stackId="a" fill="var(--scolio-primary-blue)" name="Médico" />
              <Bar dataKey="tecnico" stackId="a" fill="var(--scolio-success-green)" name="Técnico" />
              <Bar dataKey="admin" stackId="a" fill="var(--scolio-warning-amber)" name="Admin" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-4">
            <span className="flex items-center gap-2" style={{ fontSize: 'var(--text-caption)' }}>
              <span className="w-3 h-3 rounded bg-[var(--scolio-primary-blue)]"></span> Médico
            </span>
            <span className="flex items-center gap-2" style={{ fontSize: 'var(--text-caption)' }}>
              <span className="w-3 h-3 rounded bg-[var(--scolio-success-green)]"></span> Técnico
            </span>
            <span className="flex items-center gap-2" style={{ fontSize: 'var(--text-caption)' }}>
              <span className="w-3 h-3 rounded bg-[var(--scolio-warning-amber)]"></span> Admin
            </span>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] p-6">
          <h3 className="text-[var(--scolio-text-primary)] mb-4">Status dos serviços</h3>
          <ul className="space-y-3">
            {services.map(s => (
              <li key={s.name} className="flex items-center gap-3 p-3 rounded-[var(--radius-component)] bg-[var(--scolio-page-surface)]">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  s.status === 'ok' ? 'bg-[var(--scolio-success-green)]' :
                  s.status === 'warn' ? 'bg-[var(--scolio-warning-amber)]' :
                  'bg-[var(--scolio-danger-coral)]'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--scolio-text-primary)] truncate" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>{s.name}</p>
                  <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>Lat. {s.latency} · {s.uptime}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Security events */}
      <div className="bg-white rounded-[var(--radius-card)] shadow-sm border border-[var(--scolio-border-light)] overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <h3 className="text-[var(--scolio-text-primary)]">Eventos de segurança recentes</h3>
          <a href="#" className="text-[var(--scolio-primary-blue)] hover:underline" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>Ver auditoria completa →</a>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-y border-[var(--scolio-border-light)] bg-[var(--scolio-page-surface)]">
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>HORA</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>UTILIZADOR</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>EVENTO</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>IP</th>
              <th className="text-left px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)' }}>SEVERIDADE</th>
            </tr>
          </thead>
          <tbody>
            {securityEvents.map((e, i) => (
              <tr key={i} className="border-b border-[var(--scolio-border-light)] hover:bg-[var(--scolio-page-surface)]">
                <td className="px-6 py-3 text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>{e.time}</td>
                <td className="px-6 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{e.user}</td>
                <td className="px-6 py-3 text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>{e.event}</td>
                <td className="px-6 py-3 text-[var(--scolio-text-secondary)] font-mono" style={{ fontSize: 'var(--text-caption)' }}>{e.ip}</td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{
                    backgroundColor: e.severity === 'high' ? 'var(--scolio-danger-surface)' : e.severity === 'medium' ? 'var(--scolio-warning-surface)' : 'var(--scolio-neutral-surface)',
                    color: e.severity === 'high' ? 'var(--scolio-danger-coral)' : e.severity === 'medium' ? 'var(--scolio-warning-amber)' : 'var(--scolio-neutral-gray)',
                    fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)'
                  }}>
                    {e.severity === 'high' ? 'Alta' : e.severity === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
