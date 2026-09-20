import React, { useState, useEffect } from 'react';
import { Hash, Server, Check, AlertCircle, RefreshCw, MessageSquare, ExternalLink, Link2, Unlink } from 'lucide-react';
import { Guild, DiscordChannel } from '../types';

interface ChannelSelectorProps {
  channelId: string;
  onChannelChange: (newId: string) => void;
  messageId: string;
  onMessageIdChange: (newId: string) => void;
  botConfigured: boolean;
  botInviteUrl?: string;
}

export const ChannelSelector: React.FC<ChannelSelectorProps> = ({
  channelId,
  onChannelChange,
  messageId,
  onMessageIdChange,
  botConfigured,
  botInviteUrl,
}) => {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<string>('');
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [verifiedChannel, setVerifiedChannel] = useState<{ id: string; name: string; guildId?: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [showManualMessageInput, setShowManualMessageInput] = useState(false);

  // Fetch bot guilds if bot is configured
  useEffect(() => {
    if (!botConfigured) return;

    let isMounted = true;
    setLoadingGuilds(true);
    fetch('/api/bot/guilds')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.guilds && Array.isArray(data.guilds)) {
          setGuilds(data.guilds);
        }
      })
      .catch((err) => console.error('Failed to load guilds', err))
      .finally(() => {
        if (isMounted) setLoadingGuilds(false);
      });

    return () => {
      isMounted = false;
    };
  }, [botConfigured]);

  // When selected guild changes, fetch its channels
  useEffect(() => {
    if (!selectedGuild) {
      setChannels([]);
      return;
    }

    let isMounted = true;
    setLoadingChannels(true);
    fetch(`/api/bot/channels/${selectedGuild}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.channels && Array.isArray(data.channels)) {
          setChannels(data.channels);
        }
      })
      .catch((err) => console.error('Failed to load channels', err))
      .finally(() => {
        if (isMounted) setLoadingChannels(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGuild]);

  // Verify channel info when channelId changes
  const verifyChannel = async (idToVerify: string) => {
    if (!idToVerify || !/^\d{17,20}$/.test(idToVerify)) {
      setVerifyError('L\'ID doit contenir 17 à 20 chiffres');
      setVerifiedChannel(null);
      return;
    }

    setVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch(`/api/bot/channel/${idToVerify}`);
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        setVerifyError(`Réponse serveur inattendue (${res.status})`);
        setVerifiedChannel(null);
        return;
      }

      if (res.ok && data.channel) {
        setVerifiedChannel(data.channel);
        setVerifyError(null);
      } else {
        setVerifyError(data.error || 'Salon introuvable ou inaccessible par le bot');
        setVerifiedChannel(null);
      }
    } catch {
      setVerifyError('Impossible de contacter le serveur');
      setVerifiedChannel(null);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Hash className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">
            Salon Discord Cible
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Où le bot va poster et éditer le statut
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Manual or Direct Channel ID Input */}
        <div className="space-y-2">
          <label htmlFor="channel-id-input" className="block text-xs font-medium text-slate-300">
            Identifiant du Salon (Channel ID) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Hash className="w-4 h-4" />
            </div>
            <input
              id="channel-id-input"
              type="text"
              value={channelId}
              onChange={(e) => {
                const val = e.target.value.trim();
                onChannelChange(val);
                if (verifiedChannel) setVerifiedChannel(null);
              }}
              placeholder="Ex: 123456789012345678"
              className="w-full pl-9 pr-24 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
            />
            <button
              type="button"
              onClick={() => verifyChannel(channelId)}
              disabled={verifying || !channelId}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200 disabled:opacity-40 transition-colors border border-slate-700"
            >
              {verifying ? (
                <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
              ) : (
                'Vérifier'
              )}
            </button>
          </div>

          {verifiedChannel && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" />
              <span>
                Salon trouvé : <strong>#{verifiedChannel.name}</strong>
              </span>
            </div>
          )}

          {verifyError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-500/20">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}
        </div>

        {/* Server & Channel Helper (if bot in servers) */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Ou choisir parmi les serveurs du bot
          </label>
          {guilds.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="Sélectionner le serveur"
                value={selectedGuild}
                onChange={(e) => setSelectedGuild(e.target.value)}
                className="w-full px-2.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Sélectionner serveur...</option>
                {guilds.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Sélectionner le salon textuel"
                disabled={!selectedGuild || loadingChannels}
                onChange={(e) => {
                  if (e.target.value) {
                    onChannelChange(e.target.value);
                    const ch = channels.find((c) => c.id === e.target.value);
                    if (ch) {
                      setVerifiedChannel({ id: ch.id, name: ch.name });
                      setVerifyError(null);
                    }
                  }
                }}
                className="w-full px-2.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
              >
                <option value="">
                  {loadingChannels ? 'Chargement...' : 'Choisir salon...'}
                </option>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {botConfigured
                  ? loadingGuilds
                    ? 'Chargement des serveurs...'
                    : 'Le bot n\'est présent sur aucun serveur pour l\'instant.'
                  : 'Configurez le token pour lister les salons automatiquement.'}
              </span>
              {botConfigured && botInviteUrl && (
                <a
                  href={botInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Inviter le bot sur mon serveur <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            Conseil : Copiez directement l'ID du salon par clic droit dans Discord pour aller plus vite.
          </p>
        </div>
      </div>

      {/* Active Message Tracking Status */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-slate-400">Message suivi actuel :</span>
          {messageId ? (
            <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-700 text-slate-200 flex items-center gap-1">
              <Link2 className="w-3 h-3 text-indigo-400" />
              {messageId}
            </span>
          ) : (
            <span className="text-slate-400 italic">
              Aucun message existant — Le 1er clic sur un statut enverra le message
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {messageId ? (
            <button
              onClick={() => onMessageIdChange('')}
              className="text-[11px] text-slate-400 hover:text-rose-300 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800"
              title="Délier ce message pour en envoyer un tout nouveau"
            >
              <Unlink className="w-3 h-3" />
              Délier (créer un nouveau)
            </button>
          ) : (
            <button
              onClick={() => setShowManualMessageInput(!showManualMessageInput)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showManualMessageInput ? 'Fermer' : 'J\'ai déjà un Message ID'}
            </button>
          )}
        </div>
      </div>

      {showManualMessageInput && !messageId && (
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Collez l'ID du message Discord existant à modifier..."
            className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target.value.trim()) {
                  onMessageIdChange(target.value.trim());
                  setShowManualMessageInput(false);
                }
              }
            }}
          />
          <span className="text-[11px] text-slate-400">Appuyez sur Entrée</span>
        </div>
      )}
    </div>
  );
};
