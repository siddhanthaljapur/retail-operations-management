import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// --- Reusable Icons ---
const PhoneIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);
const EmailIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const HistoryIcon = () => (
  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const SendEmailIcon = () => (
  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const AvatarIcon = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-t-2xl">
    <svg className="w-20 h-20 text-gray-400 dark:text-gray-700" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  </div>
);
// --- End Icons ---

const CustomerCard = ({ customer, onSendEmail, onViewHistory, onDelete, canManage }) => {
  const { t } = useTranslation();
  const { id, name, email, mobile, totalPurchaseCount, lastPurchaseDate } = customer;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const getInitials = (n) => {
    if (!n) return '?';
    return n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="card flex flex-col md:flex-row items-center justify-between p-4 mb-4 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 w-full"
    >
      <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
          {getInitials(name || 'Customer')}
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{name || t('customerCard.unnamed')}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {mobile && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <PhoneIcon /> <span className="ml-1">{mobile}</span>
              </div>
            )}
            {email && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <EmailIcon /> <span className="ml-1">{email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
        <div className="flex gap-6 w-full sm:w-auto border-t sm:border-t-0 border-gray-200 dark:border-gray-700 pt-3 sm:pt-0">
          <div className="text-center sm:text-right">
            <p className="text-xs text-gray-500 font-medium">{t('customerCard.totalPurchases')}</p>
            <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{totalPurchaseCount || 0}</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs text-gray-500 font-medium">{t('customerCard.lastPurchase')}</p>
            <p className="text-md font-bold text-gray-900 dark:text-white">{formatDate(lastPurchaseDate)}</p>
          </div>
        </div>

        {canManage && (
          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <button onClick={() => onSendEmail(customer)} className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors" title={t('customerCard.sendEmail')}>
              <SendEmailIcon />
            </button>
            <button onClick={() => onViewHistory(customer)} className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 transition-colors" title={t('customerCard.viewHistory')}>
              <HistoryIcon />
            </button>
            <button onClick={() => onDelete(customer)} className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors" title={t('customerCard.delete')}>
              <DeleteIcon />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CustomerCard;