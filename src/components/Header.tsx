import React from 'react';
import { Bot, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, UserPlus } from 'lucide-react';
import { BotStatusResponse } from '../types';

interface HeaderProps {
  botStatus: BotStatusResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  botStatus,
  loading,
  onRefresh,
  onOpenGuide,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-slate-100 flex items-center gap-2">
              Contrôleur Statut Flux
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Discord Bot
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Pilotez et modifiez en temps réel l'état du flux dans votre salon Discord
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Bot connection badge */}
          {botStatus?.valid && botStatus.bot ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                {botStatus.bot.avatar ? (
                  <img
                    src={botStatus.bot.avatar}
                    alt={botStatus.bot.username}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span className="hidden md:inline font-mono">
                  {botStatus.bot.global_name || botStatus.bot.username}
                </span>
                <span className="inline-flex items-center px-1 py-0.2 text-[10px] uppercase font-bold rounded bg-indigo-600 text-white">
                  BOT
                </span>
              </div>

              {botStatus.bot.inviteUrl && (
                <a
                  href={botStatus.bot.inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium transition-colors border border-indigo-500/30"
                  title="Inviter ce bot sur votre serveur Discord"
                >
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline">Inviter sur serveur</span>
                </a>
              )}
            </div>
          ) : botStatus?.configured ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Token Invalide</span>
            </div>
          ) : (
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Token Bot à configurer</span>
              <span className="underline ml-1">Aide</span>
            </button>
          )}

          {/* Guide button */}
          <button
            id="open-guide-btn"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700"
            title="Guide : Que dois-je fournir ?"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Que dois-je donner ?</span>
          </button>

          {/* Refresh button */}
          <button
            id="refresh-bot-btn"
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 disabled:opacity-50"
            title="Rafraîchir la connexion"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
