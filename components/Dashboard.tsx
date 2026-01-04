
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { AnalysisResult } from '../types';
import { Clock, CheckCircle2, TrendingUp, Lightbulb, Activity, Calendar, Trash2, ChevronRight, FileText, ListChecks } from 'lucide-react';

interface DashboardProps {
  results: AnalysisResult[];
  onRemove: (index: number) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

const Dashboard: React.FC<DashboardProps> = ({ results, onRemove }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedDayIndex !== null && selectedDayIndex >= results.length) {
      setSelectedDayIndex(results.length > 0 ? results.length - 1 : null);
    }
  }, [results, selectedDayIndex]);

  // 彙整所有建議項目
  const allSuggestions = useMemo(() => {
    return results.flatMap(res => 
      (res.suggestions || []).map(s => ({
        date: res.reportDate,
        text: s
      }))
    );
  }, [results]);

  const aggregateStats = useMemo(() => {
    if (!results || results.length === 0) return null;

    const counts: Record<string, number> = {};
    let totalMinutes = 0;
    let avgEfficiency = 0;

    results.forEach(res => {
      totalMinutes += (res.totalDurationMinutes || 0);
      avgEfficiency += (res.efficiencyScore || 0);
      res.tasks?.forEach(t => {
        if (t.category) {
          counts[t.category] = (counts[t.category] || 0) + (t.durationMinutes || 0);
        }
      });
    });

    const categoryData = Object.entries(counts).map(([name, value]) => ({ 
      name, 
      value: Number((value / 60).toFixed(1)) 
    }));
    const topCategory = [...categoryData].sort((a, b) => b.value - a.value)[0]?.name || '無資料';

    return {
      categoryData,
      topCategory,
      totalHours: (totalMinutes / 60).toFixed(1),
      avgEfficiency: (avgEfficiency / results.length).toFixed(0),
      trendData: results.map(res => ({
        date: res.reportDate || '未知日期',
        hours: Number(((res.totalDurationMinutes || 0) / 60).toFixed(1)),
        efficiency: res.efficiencyScore || 0
      }))
    };
  }, [results]);

  const currentData = (selectedDayIndex !== null && results[selectedDayIndex]) ? results[selectedDayIndex] : null;

  if (!aggregateStats) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-slate-200 text-slate-400">
        <Activity className="w-12 h-12 mb-4 opacity-20 animate-pulse" />
        <p>尚未載入足夠的分析資料</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 print:space-y-4">
      {/* 數據概覽卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<Calendar className="w-6 h-6 text-indigo-500" />}
          label="已輸入天數"
          value={`${results.length} 天`}
          subtext="累積資料範圍"
        />
        <StatCard 
          icon={<Clock className="w-6 h-6 text-emerald-500" />}
          label="總累積工時"
          value={`${aggregateStats.totalHours} 小時`}
          subtext="所有日報工時總計"
        />
        <StatCard 
          icon={<Activity className="w-6 h-6 text-amber-500" />}
          label="平均產效評分"
          value={`${aggregateStats.avgEfficiency}%`}
          subtext="AI 綜合效能指標"
        />
        <StatCard 
          icon={<TrendingUp className="w-6 h-6 text-violet-500" />}
          label="主要任務類型"
          value={aggregateStats.topCategory}
          subtext="全期佔比最高"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 工時趨勢圖 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-indigo-500 rounded-full" />
            工時趨勢分析 (小時)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregateStats.trendData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  formatter={(value) => [`${value} 小時`, '投入時間']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="hours" stroke="#6366f1" fillOpacity={1} fill="url(#colorHours)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 類別分佈圖 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            工時類別佔比 (小時)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aggregateStats.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {aggregateStats.categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} 小時`, '累計工時']} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 優化建議總表區塊 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ListChecks className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">產能優化建議總表</h3>
              <p className="text-xs text-slate-500">彙整自 AI 針對每日工作內容所提出的改善回饋</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
            共計 {allSuggestions.length} 項優化點
          </span>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-sm font-bold text-slate-500 w-32 uppercase tracking-wider">日期</th>
                  <th className="py-3 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">優化建議內容</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allSuggestions.length > 0 ? (
                  allSuggestions.map((s, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 align-top">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">
                          <Calendar className="w-3 h-3" /> {s.date}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-sm" />
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            {s.text}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-10 text-center text-slate-400 italic">
                      目前尚無任何優化建議資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 每日清單選擇與細節 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-700 px-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> 選擇單日查看任務細節
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {results.map((res, idx) => (
              <div 
                key={`${res.reportDate}-${idx}`}
                onClick={() => setSelectedDayIndex(idx)}
                className={`
                  group relative flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all
                  ${selectedDayIndex === idx 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg ring-2 ring-indigo-200' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-md'}
                `}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`w-5 h-5 ${selectedDayIndex === idx ? 'text-indigo-200' : 'text-slate-400'}`} />
                  <div>
                    <p className="font-bold text-sm truncate max-w-[150px]">{res.reportDate || '未具名日期'}</p>
                    <p className={`text-xs ${selectedDayIndex === idx ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {((res.totalDurationMinutes || 0) / 60).toFixed(1)} 小時 • {res.tasks?.length || 0} 項任務
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if(window.confirm('確定要刪除這筆紀錄嗎？')) {
                        onRemove(idx);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${selectedDayIndex === idx ? 'hover:bg-indigo-500 text-indigo-200' : 'hover:bg-red-50 text-slate-300 hover:text-red-500'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className={`w-4 h-4 opacity-50 ${selectedDayIndex === idx ? 'block' : 'hidden md:block'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {currentData ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 h-full">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{currentData.reportDate} 詳細分析</h3>
                  <p className="text-sm text-slate-500">效率評分: {currentData.efficiencyScore || 0}%</p>
                </div>
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  今日投入 {((currentData.totalDurationMinutes || 0) / 60).toFixed(1)} 小時
                </span>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 italic text-indigo-800 text-sm">
                  「{currentData.summary || '今日尚無總結報告'}」
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">每日任務清單</h4>
                  <div className="space-y-3">
                    {currentData.tasks?.map((task, tidx) => (
                      <div key={`${task.id}-${tidx}`} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-400" />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{task.title}</p>
                            <p className="text-xs text-slate-400">{task.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold text-indigo-600">{task.durationMinutes || 0} 分鐘</p>
                        </div>
                      </div>
                    )) || <p className="text-sm text-slate-400 italic">無任務細節</p>}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" /> 本日優化建議
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentData.suggestions?.map((s, si) => (
                      <li key={si} className="text-xs text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100">
                        {s}
                      </li>
                    )) || <p className="text-xs text-slate-400">目前尚無建議</p>}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
              <Calendar className="w-12 h-12 mb-4 opacity-20" />
              <p>請從左側列表選擇日期以查看細節</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  subtext: string;
}> = ({ icon, label, value, subtext }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{label}</span>
    </div>
    <div>
      <h4 className="text-2xl font-black text-slate-800 mb-1">{value}</h4>
      <p className="text-xs text-slate-400">{subtext}</p>
    </div>
  </div>
);

export default Dashboard;
