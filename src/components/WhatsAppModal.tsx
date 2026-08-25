import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateWhatsAppUrl } from '../lib/utils';
import { logWhatsAppApi } from '../lib/api';
import { MessageSquare, ExternalLink, X, Send, Copy, Check } from 'lucide-react';

export const WhatsAppModal: React.FC = () => {
  const { whatsappModal, closeWhatsAppModal, addToast, triggerRefresh } = useApp();
  const [editedMessage, setEditedMessage] = useState(whatsappModal.message);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEditedMessage(whatsappModal.message);
  }, [whatsappModal.message]);

  if (!whatsappModal.isOpen) return null;

  const handleSend = async () => {
    const url = generateWhatsAppUrl(whatsappModal.phone, editedMessage);
    
    try {
      await logWhatsAppApi(
        whatsappModal.tenantId,
        whatsappModal.type,
        editedMessage,
        whatsappModal.paymentId
      );
      addToast('Opening WhatsApp...', 'info');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to log message', err);
    }

    window.open(url, '_blank');
    closeWhatsAppModal();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedMessage);
    setCopied(true);
    addToast('Message copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={closeWhatsAppModal}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Send WhatsApp {whatsappModal.type}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              To: <span className="text-slate-900 dark:text-slate-200 font-semibold">{whatsappModal.tenantName}</span> ({whatsappModal.phone})
            </p>
          </div>
        </div>

        {/* Message Editor */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Message Preview (You can customize before sending):
          </label>
          <textarea
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            rows={5}
            className="w-full p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none font-sans"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={closeWhatsAppModal}
              className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              <span>Send WhatsApp Confirmation</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
