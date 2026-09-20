/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SetupGuide } from './components/SetupGuide';
import { ChannelSelector } from './components/ChannelSelector';
import { StatusController } from './components/StatusController';
import { DiscordPreview } from './components/DiscordPreview';
import { HistoryLog } from './components/HistoryLog';
import { BotStatusResponse, TrackingState, FlowStatus } from './types';

export default function App() {
  const [botStatus, setBotStatus] = useState<BotStatusResponse | null>(null);
  const [loadingBot, setLoadingBot] = useState<boolean>(true);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);

  const [channelId, setChannelId] = useState<string>('');
  const [messageId, setMessageId] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<FlowStatus | ''>('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [history, setHistory] = useState<TrackingState['history']>([]);

  const [useEmbed, setUseEmbed] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  // Fetch bot status
  const fetchBotStatus = useCallback(async () => {
    setLoadingBot(true);
    try {
      const res = await fetch('/api/bot/status');
      const text = await res.text();
      let data: BotStatusResponse;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Le serveur renvoie une réponse non-JSON. Vérifiez que le serveur backend tourne correctement.');
      }
      setBotStatus(data);
      if (!data.valid) {
        // Automatically show guide if bot is not configured yet
        setGuideOpen(true);
      }
      if (data.channelId && !channelId) {
        setChannelId(data.channelId);
      }
    } catch (e: any) {
      console.error('Error fetching bot status:', e);
      setBotStatus({
        configured: false,
        valid: false,
        error: e.message || 'Impossible de joindre le serveur local',
      });
      setGuideOpen(true);
    } finally {
      setLoadingBot(false);
    }
  }, [channelId]);

  // Fetch tracking state
  const fetchTrackingState = useCallback(async () => {
    try {
      const res = await fetch('/api/status/current');
      if (!res.ok) return;
      const text = await res.text();
      try {
        const data: TrackingState = JSON.parse(text);
        if (data.currentChannelId) setChannelId(data.currentChannelId);
        if (data.currentMessageId) setMessageId(data.currentMessageId);
        if (data.currentStatus) setCurrentStatus(data.currentStatus);
        if (data.lastUpdated) setLastUpdated(data.lastUpdated);
        if (data.history) setHistory(data.history);
      } catch {
        // Silently ignore non-json response on tracking state
      }
    } catch (e) {
      console.error('Error fetching tracking state:', e);
    }
  }, []);

  useEffect(() => {
    fetchBotStatus();
    fetchTrackingState();
  }, [fetchBotStatus, fetchTrackingState]);

  // When user updates channel ID manually
  const handleChannelChange = (newId: string) => {
    setChannelId(newId);
    fetch('/api/status/target', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId: newId }),
    }).catch(console.error);
  };

  // When user unlinks or modifies message ID
  const handleMessageIdChange = (newId: string) => {
    setMessageId(newId);
    fetch('/api/status/target', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: newId }),
    }).catch(console.error);
  };

  // Send or Edit status message
  const handleSendOrEdit = async (status: FlowStatus, forceNew: boolean = false) => {
    if (!channelId) {
      setFeedback({
        type: 'error',
        message: 'Veuillez d\'abord renseigner l\'identifiant du salon (Channel ID) !',
      });
      return;
    }

    setActionLoading(true);
    setFeedback({ type: null, message: '' });

    const shouldEdit = !forceNew && Boolean(messageId);

    try {
      const endpoint = shouldEdit ? '/api/status/edit' : '/api/status/send';
      const method = shouldEdit ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          messageId: shouldEdit ? messageId : undefined,
          status,
          useEmbed,
        }),
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Erreur serveur inattendue (${res.status} ${res.statusText}). Le serveur n'a pas renvoyé de JSON.`
        );
      }

      if (!res.ok) {
        const errorInstance: any = new Error(data.error || 'Erreur lors de la mise à jour sur Discord');
        errorInstance.status = res.status;
        errorInstance.details = data.details;
        throw errorInstance;
      }

      setCurrentStatus(status);
      setMessageId(data.messageId);
      setLastUpdated(data.timestamp);

      // Refresh tracking state history
      fetchTrackingState();

      setFeedback({
        type: 'success',
        message: shouldEdit
          ? `Message existant modifié avec succès : "Etat du flux : ${status}"`
          : `Nouveau message envoyé avec succès dans le salon : "Etat du flux : ${status}"`,
      });
    } catch (err: any) {
      console.error('Action failed:', err);
      let errorMsg = err.message || 'Une erreur est survenue';
      if (errorMsg === 'MISSING_TOKEN') {
        errorMsg = 'Le token du bot Discord n\'est pas configuré. Consultez le guide "Que dois-je donner ?".';
        setGuideOpen(true);
      } else if (err.status === 403 || errorMsg.includes('Missing Access') || errorMsg.includes('code 50001')) {
        errorMsg = 'Accès refusé par Discord : Le bot n\'est pas encore présent sur votre serveur Discord, ou n\'a pas la permission de voir ce salon. Utilisez le bouton "Inviter sur serveur" en haut à droite !';
      } else if (errorMsg.includes('Missing Permissions') || errorMsg.includes('code 50013')) {
        errorMsg = 'Permissions insuffisantes : Donnez au rôle du bot les permissions "Envoyer des messages" et "Intégrer des liens" dans ce salon.';
      } else if (err.status === 404 || errorMsg.includes('Unknown Channel') || errorMsg.includes('code 10003')) {
        errorMsg = 'Salon Discord introuvable. Vérifiez que l\'identifiant du salon est exact et que le bot est invité sur le serveur.';
      } else if (errorMsg.includes('Unknown Message') || errorMsg.includes('code 10008')) {
        errorMsg = 'Le message précédent a été supprimé sur Discord. Cliquez sur "Forcer un nouveau message".';
        setMessageId('');
      }

      setFeedback({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        botStatus={botStatus}
        loading={loadingBot}
        onRefresh={() => {
          fetchBotStatus();
          fetchTrackingState();
        }}
        onOpenGuide={() => setGuideOpen((prev) => !prev)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Setup Guide (answers: "dis moi je dois te donner quoi") */}
        <SetupGuide
          isOpen={guideOpen}
          onToggle={() => setGuideOpen((prev) => !prev)}
          botConfigured={Boolean(botStatus?.valid)}
          botInviteUrl={botStatus?.bot?.inviteUrl}
        />

        {/* Channel Selection & Active Tracking */}
        <ChannelSelector
          channelId={channelId}
          onChannelChange={handleChannelChange}
          messageId={messageId}
          onMessageIdChange={handleMessageIdChange}
          botConfigured={Boolean(botStatus?.valid)}
          botInviteUrl={botStatus?.bot?.inviteUrl}
        />

        {/* 3 Status Buttons & Controls */}
        <StatusController
          currentStatus={currentStatus}
          lastUpdated={lastUpdated}
          messageId={messageId}
          channelId={channelId}
          loading={actionLoading}
          onSendOrEdit={handleSendOrEdit}
          useEmbed={useEmbed}
          onToggleEmbed={setUseEmbed}
          feedback={feedback}
        />

        {/* Discord Preview & History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DiscordPreview
            status={currentStatus}
            useEmbed={useEmbed}
            botInfo={botStatus?.bot}
            channelName={channelId ? `salon-${channelId.slice(-4)}` : 'etat-du-flux'}
            lastUpdated={lastUpdated}
          />

          <HistoryLog history={history} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Contrôleur de Flux Discord • Statuts : 🟢 En ligne, 🔴 Hors ligne, 🟡 En pause</span>
          <span className="text-slate-400">API Discord v10 REST</span>
        </div>
      </footer>
    </div>
  );
}
