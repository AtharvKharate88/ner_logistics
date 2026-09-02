import React, { useState } from 'react';

const UserProfileModal = ({ isOpen, onClose, user, onSave, onLogout }) => {
  const [formData, setFormData] = useState(user || {
    fullName: 'Jane Doe',
    email: 'operator@ner-logistics.com',
    fleetId: 'NER-FLT-8092',
    role: 'Fleet Operator',
  });
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-md">
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-xl max-w-md w-full relative shadow-2xl">
        <div className="flex justify-between items-center mb-lg">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[24px]">manage_accounts</span>
            <h3 className="font-headline-md text-headline-md text-on-surface">Operator Profile</h3>
          </div>
          <button
            className="text-on-surface-variant hover:text-on-surface p-xs rounded cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {isSaved ? (
          <div className="p-md bg-primary/10 border border-primary/40 rounded-lg text-primary font-body-sm text-center my-md">
            ✓ Credentials and profile updated in local database!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-md">
            <div className="space-y-xs">
              <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase">Full Name</label>
              <input
                className="w-full bg-surface border border-outline-variant rounded-lg p-md text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-primary"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-xs">
              <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase">Work Email</label>
              <input
                className="w-full bg-surface border border-outline-variant rounded-lg p-md text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-primary"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase">Fleet ID</label>
                <input
                  className="w-full bg-surface border border-outline-variant rounded-lg p-md text-on-surface font-data-mono uppercase focus:outline-none focus:ring-1 focus:ring-primary"
                  type="text"
                  value={formData.fleetId}
                  onChange={(e) => setFormData({ ...formData, fleetId: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-xs">
                <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase">Role</label>
                <select
                  className="w-full bg-surface border border-outline-variant rounded-lg p-md text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Fleet Operator">Fleet Operator</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="System Administrator">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-md pt-md border-t border-outline-variant/10 mt-md">
              <button
                className="flex-1 py-md bg-error/10 border border-error/30 text-error hover:bg-error/20 rounded font-label-caps text-xs cursor-pointer"
                type="button"
                onClick={onLogout}
              >
                SIGN OUT
              </button>

              <button
                className="flex-1 py-md bg-primary text-on-primary rounded font-label-caps text-xs font-bold shadow-[0_0_12px_rgba(78,222,163,0.4)] cursor-pointer"
                type="submit"
              >
                SAVE CHANGES
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;