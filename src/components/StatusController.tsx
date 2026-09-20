import React from 'react';
import { Send, Edit3, CheckCircle2, AlertCircle, Sparkles, RefreshCw, Radio } from 'lucide-react';
import { FlowStatus } from '../types';

interface StatusControllerProps {
  currentStatus: FlowStatus | '';
  lastUpdated: string | null;
  messageId: string;
  channelId: string;
  loading: boolean;
  onSendOrEdit: (status: FlowStatus, forceNew?: boolean) => void;
  useEmbed: boolean;
  onToggleEmbed: (value: boolean) => void;
  feedback: { type: 'success' | 'error' | null; message: string };
}

export const StatusController: React.FC<StatusControllerProps> = ({
  currentStatus,
  lastUpdated,
  messageId,
  channelId,
  loading,
  onSendOrEdit,
  useEmbed,
  onToggleEmbed,
  feedback,
}) => {
  const statusOptions: Array<{
    status: FlowStatus;
    label: string;
    description: string;
    badgeColor: string;
    borderColor: string;
    activeBg: string;
    hoverBorder: string;
    glowClass: string;
  }> = [
    {
      status: '🟢',
      label: 'En Ligne (Live Actif)',
      description: 'Le flux diffuse correctement sans interruption.',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      borderColor: 'border-emerald-500/40',
      activeBg: 'bg-emerald-950/40 ring-2 ring-emerald-500/50',
      hoverBorder: 'hover:border-emerald-500/60',
      glowClass: 'shadow-[0_0_25px_-5px_rgba(16,185,129,0.3)]',
    },
    {
      status: '🟡',
      label: 'En Pause / Attente',
      description: 'Le flux va démarrer ou est momentanément en pause.',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      borderColor: 'border-amber-500/40',
      activeBg: 'bg-amber-950/40 ring-2 ring-amber-500/50',
      hoverBorder: 'hover:border-amber-500/60',
      glowClass: 'shadow-[0_0_25px_-5px_rgba(245,158,11,0.3)]',
    },
    {
      status: '🔴',
      label: 'Hors Ligne (Coupé)',
      description: 'Le flux est éteint, terminé ou en panne.',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      borderColor: 'border-rose-500/40',
      activeBg: 'bg-rose-950/40 ring-2 ring-rose-500/50',
      hoverBorder: 'hover:border-rose-500/60',
      glowClass: 'shadow-[0_0_25px_-5px_rgba(244,63,94,0.3)]',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Top status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-slate-200">
              Changer l'État du Flux
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cliquez sur un statut pour mettre à jour instantanément le message Discord
          </p>
        </div>

        {/* Current State Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Statut actuel :</span>
          {currentStatus ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-100 shadow-inner">
              <span className="text-base">{currentStatus}</span>
              <span>Etat du flux : {currentStatus}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Non défini</span>
          )}
        </div>
      </div>

      {/* 3 Main Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statusOptions.map((opt) => {
          const isCurrent = currentStatus === opt.status;
          return (
            <button
              key={opt.status}
              type="button"
              disabled={loading || !channelId}
              onClick={() => onSendOrEdit(opt.status)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 relative group disabled:opacity-50 disabled:cursor-not-allowed ${
                isCurrent
                  ? `${opt.activeBg} ${opt.borderColor} ${opt.glowClass}`
                  : `bg-slate-950/70 border-slate-800 ${opt.hoverBorder} hover:bg-slate-800/40`
              }`}
            >
              {isCurrent && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Actif
                </div>
              )}

              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl filter drop-shadow-sm transition-transform group-hover:scale-110">
                  {opt.status}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    Etat du flux : {opt.status}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">{opt.label}</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                {opt.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-indigo-400 font-medium group-hover:text-indigo-300 flex items-center gap-1">
                  {messageId ? (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      Modifier le message
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Envoyer ce statut
                    </>
                  )}
                </span>
                <span className="text-[11px] text-slate-400 group-hover:text-slate-400">
                  1 clic
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Bar / Options */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Toggle Embed */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
          <input
            type="checkbox"
            checked={useEmbed}
            onChange={(e) => onToggleEmbed(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
          />
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Inclure l'embed Discord (carte colorée avec heure de mise à jour)
          </span>
        </label>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {messageId && (
            <button
              type="button"
              disabled={loading || !channelId}
              onClick={() => onSendOrEdit(currentStatus || '🟢', true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              title="Créer un nouveau message au lieu de modifier l'existant"
            >
              <Send className="w-3.5 h-3.5" />
              Forcer un nouveau message
            </button>
          )}

          {loading && (
            <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Mise à jour en cours sur Discord...
            </span>
          )}
        </div>
      </div>

      {/* Feedback banners */}
      {feedback.type === 'success' && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {feedback.type === 'error' && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
};
