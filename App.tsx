
import React, { useState } from 'react';
import { ClipboardCheck, Loader2, Sparkles, Send, History, Trash2, PlusCircle, LayoutDashboard, AlertCircle } from 'lucide-react';
import { analyzeReport } from './services/geminiService';
import { AnalysisResult } from './types';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [viewMode, setViewMode] = useState<'input' | 'dashboard'>('input');
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const newResults = await analyzeReport(inputText);
      if (!newResults || newResults.length === 0) {
        throw new Error("未能從輸入內容中識別出有效的日報格式。");
      }
      setResults(prev => [...prev, ...newResults]);
      setViewMode('dashboard');
      setInputText('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '分析過程中發生錯誤，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    if (window.confirm("確定要清除所有已分析的資料嗎？")) {
      setResults([]);
      setViewMode('input');
    }
  };

  const removeResult = (index: number) => {
    setResults(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setViewMode('input');
      }
      return updated;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-10 text-center flex flex-col items-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
            <ClipboardCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            智能工作日報分析系統
          </h1>
        </div>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          貼入單日或多日的工作日報，由 AI 自動為您彙整跨日工時趨勢與效能統計。
        </p>
      </header>

      <main className="space-y-6">
        {results.length > 0 && (
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode('input')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'input' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <PlusCircle className="w-4 h-4" /> 增加日報
              </button>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> 統計儀表板
              </button>
            </div>
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" /> 清除資料
            </button>
          </div>
        )}

        {viewMode === 'input' ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Send className="w-5 h-5" />
                  <h2 className="text-lg font-bold">請輸入工作內容 (支援多天份內容)</h2>
                </div>
                {results.length > 0 && (
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold">
                    已有 {results.length} 筆資料
                  </span>
                )}
              </div>
              <textarea
                className="w-full h-80 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none bg-slate-50 text-slate-700 font-mono leading-relaxed"
                placeholder="輸入範例：
12/22(一)
1. 化妝品樣品抽檢 (08:30~10:00)
2. 微生物實驗室操作 (10:30~12:00)

12/23(二)
1. 會議討論 (09:00~10:00)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">分析失敗</p>
                    <p className="text-sm opacity-90">{error}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                {results.length > 0 && (
                  <button
                    onClick={() => setViewMode('dashboard')}
                    className="px-8 py-4 rounded-xl font-bold text-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    返回儀表板
                  </button>
                )}
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !inputText.trim()}
                  className={`
                    flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all
                    ${isLoading 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95'}
                  `}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      執行智能分析
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><History className="w-3 h-3" /> 支援多日自動辨識</span>
                <span className="flex items-center gap-1"><PlusCircle className="w-3 h-3" /> 資料可累計分析</span>
              </div>
            </div>
          </div>
        ) : (
          <Dashboard results={results} onRemove={removeResult} />
        )}
      </main>
      
      <footer className="mt-12 text-center text-slate-400 text-sm pb-8">
        © {new Date().getFullYear()} 智能日報分析系統 | AI 驅動的高效管理
      </footer>
    </div>
  );
};

export default App;
