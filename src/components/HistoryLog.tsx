import React from 'react';
import { History, Check, Edit3, Send, Clock } from 'lucide-react';
import { StatusHistoryItem } from '../types';

interface HistoryLogProps {
  history: StatusHistoryItem[];
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center text-slate-400 text-xs shadow-sm">
        <History className="w-5 h-5 mx-auto mb-2 text-slate-400 opacity-60" />
        <span>Aucun historique d'envoi pour le moment. Choisissez un statut pour commencer.</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Historique des Modifications
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {history.length} action{history.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y divide-slate-800/80 max-h-56 overflow-y-auto pr-1">
        {history.map((item) => (
          <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{item.status}</span>
              <div>
                <div className="font-medium text-slate-200 font-mono">
                  Etat du flux : {item.status}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    Salon : {item.channelId}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase border flex items-center gap-1 ${
                  item.action === 'edit'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {item.action === 'edit' ? (
                  <>
                    <Edit3 className="w-3 h-3" /> Modifié
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" /> Créé
                  </>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
