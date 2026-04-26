'use client';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true,
}: ModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    info: {
      accentColor: 'text-blue-400',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
    },
    warning: {
      accentColor: 'text-yellow-400',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
    },
    error: {
      accentColor: 'text-red-400',
      buttonBg: 'bg-red-600 hover:bg-red-700',
    },
    success: {
      accentColor: 'text-green-400',
      buttonBg: 'bg-green-600 hover:bg-green-700',
    },
  };

  const style = typeStyles[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-md">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-8 space-y-6">
          {/* Title */}
          <h2 className={`text-2xl font-bold ${style.accentColor}`}>
            {title}
          </h2>

          {/* Message */}
          <p className="text-gray-200 whitespace-pre-line leading-relaxed text-base">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            {showCancel && (
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition border border-white/20"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => {
                onConfirm?.();
                onClose();
              }}
              className={`px-6 py-2.5 ${style.buttonBg} text-white rounded-lg font-medium transition`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
