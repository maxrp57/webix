import React, { useState } from 'react';
import { Key, Hash, ShieldCheck, ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';

interface SetupGuideProps {
  isOpen: boolean;
  onToggle: () => void;
  botConfigured: boolean;
  botInviteUrl?: string;
}

export const SetupGuide: React.FC<SetupGuideProps> = ({ isOpen, onToggle, botConfigured, botInviteUrl }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Guide : Ce que tu dois me fournir pour faire fonctionner le bot
            </h2>
            <p className="text-xs text-slate-400">
              {botConfigured
                ? '✅ Token bot détecté. Tu as juste besoin de choisir ton salon.'
                : '📋 2 éléments requis : le Token du Bot et l\'ID du Salon Discord.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs font-medium hidden sm:inline">
            {isOpen ? 'Masquer le guide' : 'Voir les instructions'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Element 1: Bot Token */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    Le Token de ton Bot Discord
                  </h3>
                </div>
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  Developer Portal <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Le token est la clé d'authentification du bot. Il permet au serveur d'envoyer et modifier les messages à sa place.
              </p>

              <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside pl-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <li>Rends-toi sur le <strong>Discord Developer Portal</strong>.</li>
                <li>Sélectionne l'application de ton bot.</li>
                <li>Va dans le menu <strong>Bot</strong> à gauche.</li>
                <li>Clique sur <strong>Reset Token</strong> puis <strong>Copy</strong>.</li>
                <li>Ajoute la variable <code className="text-indigo-300 bg-indigo-950/50 px-1 py-0.5 rounded">DISCORD_BOT_TOKEN</code> dans les Secrets/Variables d'environnement.</li>
              </ol>

              <div className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-mono text-[11px]">DISCORD_BOT_TOKEN</span>
                <button
                  onClick={() => handleCopy('DISCORD_BOT_TOKEN', 'tokenVar')}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  {copiedKey === 'tokenVar' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'tokenVar' ? 'Copié' : 'Copier nom'}
                </button>
              </div>
            </div>

            {/* Element 2: Channel ID */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    L'identifiant du Salon (Channel ID)
                  </h3>
                </div>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  Dans l'application
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                C'est l'ID du salon textuel Discord où le message <span className="text-emerald-400 font-medium">Etat du flux</span> sera posté et mis à jour.
              </p>

              <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside pl-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <li>Dans Discord, ouvre <strong>Paramètres utilisateur</strong> (engrenage en bas à gauche).</li>
                <li>Va dans <strong>Avancés</strong> et active le <strong>Mode développeur</strong>.</li>
                <li>Fais un <strong>clic droit sur le salon</strong> souhaité.</li>
                <li>Clique sur <strong>« Copier l'identifiant du salon »</strong>.</li>
                <li>Colle cet identifiant directement dans le formulaire ci-dessous.</li>
              </ol>

              <div className="flex flex-col gap-2 text-[11px] bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 text-amber-300">
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Important : Le bot doit être invité sur le serveur avec les droits d'écrire !</span>
                </div>
                {botInviteUrl && (
                  <a
                    href={botInviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors self-start"
                  >
                    Inviter le bot sur mon serveur Discord <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
