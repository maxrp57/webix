import React from 'react';
import { Eye, Hash, Bot as BotIcon } from 'lucide-react';
import { FlowStatus, BotInfo } from '../types';

interface DiscordPreviewProps {
  status: FlowStatus | '';
  useEmbed: boolean;
  botInfo?: BotInfo;
  channelName?: string;
  lastUpdated?: string | null;
}

export const DiscordPreview: React.FC<DiscordPreviewProps> = ({
  status = '🟢',
  useEmbed,
  botInfo,
  channelName = 'etat-du-flux',
  lastUpdated,
}) => {
  const effectiveStatus = status || '🟢';

  const embedBorderColors: Record<FlowStatus, string> = {
    '🟢': '#22c55e',
    '🔴': '#ef4444',
    '🟡': '#eab308',
  };

  const statusTitles: Record<FlowStatus, string> = {
    '🟢': 'Flux en direct (En Ligne)',
    '🔴': 'Flux arrêté (Hors Ligne)',
    '🟡': 'Flux en attente / pause',
  };

  const statusDescriptions: Record<FlowStatus, string> = {
    '🟢': 'Le flux est actuellement actif et opérationnel.',
    '🔴': 'Le flux est actuellement coupé ou terminé.',
    '🟡': 'Le flux est momentanément en pause ou va bientôt démarrer.',
  };

  const timeString = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Aperçu en Direct (Rendu Discord)
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Hash className="w-3.5 h-3.5 text-slate-400" />
          <span>{channelName}</span>
        </div>
      </div>

      {/* Discord Message Container (#313338 is native Discord chat dark theme) */}
      <div className="rounded-xl bg-[#313338] p-4 text-[#dbdee1] font-sans border border-slate-800 shadow-inner select-none">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {botInfo?.avatar ? (
            <img
              src={botInfo.avatar}
              alt="Bot Avatar"
              className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white shrink-0 mt-0.5">
              <BotIcon className="w-6 h-6" />
            </div>
          )}

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            {/* Header: Name + BOT Badge + Timestamp */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="font-semibold text-white text-sm hover:underline cursor-pointer">
                {botInfo?.global_name || botInfo?.username || 'Mon Bot Discord'}
              </span>
              <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.2 py-0.2 rounded uppercase leading-none tracking-wide">
                BOT
              </span>
              <span className="text-[11px] text-[#949ba4] ml-1">
                Aujourd'hui à {timeString}
              </span>
            </div>

            {/* Exact Content text as requested by user */}
            <div className="text-sm text-[#f2f3f5] font-normal leading-relaxed">
              Etat du flux : {effectiveStatus}
            </div>

            {/* Optional Discord Embed */}
            {useEmbed && (
              <div
                className="mt-2.5 max-w-md rounded-md bg-[#2b2d31] p-3 border-l-4 text-xs space-y-2 shadow-sm"
                style={{ borderLeftColor: embedBorderColors[effectiveStatus] }}
              >
                <div className="font-bold text-white text-sm">
                  {statusTitles[effectiveStatus]}
                </div>
                <div className="text-[#dbdee1] text-xs leading-relaxed">
                  {statusDescriptions[effectiveStatus]}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[#949ba4] tracking-wide">
                      Statut Actuel
                    </div>
                    <div className="font-semibold text-white mt-0.5">
                      Etat du flux : {effectiveStatus}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[#949ba4] tracking-wide">
                      Mise à jour
                    </div>
                    <div className="text-[#dbdee1] mt-0.5">
                      {timeString} (En direct)
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-[#949ba4] pt-1 border-t border-[#35373c] flex items-center justify-between">
                  <span>Contrôleur de Flux Discord</span>
                  <span>{effectiveStatus}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
