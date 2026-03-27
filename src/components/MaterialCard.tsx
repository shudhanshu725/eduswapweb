import React from 'react';
import { Material, UserProfile } from '../types';
import { getCurrentUser, supabase } from '../auth';
import type { Database } from '../supabase.types';

interface MaterialCardProps {
  material: Material;
  variant?: 'compact' | 'full';
  currentUser?: UserProfile | null;
  onMessageAuthor?: (author: { id: string; name: string; avatar?: string }) => void;
  onToggleStatus?: (material: Material, nextStatus: 'available' | 'completed') => void | Promise<void>;
  onDeleteMaterial?: (material: Material) => void | Promise<void>;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  variant = 'full',
  currentUser,
  onMessageAuthor,
  onToggleStatus,
  onDeleteMaterial,
}) => {
  const typeColors = {
    swap: 'bg-primary text-on-primary',
    sell: 'bg-secondary text-on-secondary',
    donate: 'bg-tertiary text-on-tertiary',
    resource: 'bg-sky-600 text-white',
  };

  const isCompleted = material.status === 'completed';
  const isOwner = !!currentUser && currentUser.uid === material.authorId;
  const canMessageAuthor = !!currentUser && currentUser.uid !== material.authorId && !!onMessageAuthor;
  const hasContactDetails = !!(
    material.contactPhone ||
    material.contactWhatsapp ||
    material.contactInstagram ||
    material.contactTelegram
  );
  const hasStudentDetails = !!(material.studentName || material.studentYear || material.studentDepartment);

  const normalizeInstagramUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://instagram.com/${trimmed.replace(/^@/, '')}`;
  };

  const normalizeTelegramUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://t.me/${trimmed.replace(/^@/, '')}`;
  };

  const normalizeWhatsappUrl = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return `https://wa.me/${digits}`;
  };

  const typeLabels = {
    swap: 'Swap',
    sell: material.price ? `INR ${material.price.toFixed(2)}` : 'Sell',
    donate: 'Donation',
    resource: 'Resource',
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (material.type !== 'resource' || isCompleted || !material.fileUrl) return;

    const user = await getCurrentUser();
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('materials')
        .update({ downloads: (material.downloads || 0) + 1 })
        .eq('id', material.id);
      if (updateError) throw updateError;

      const { error: insertError } = await supabase.from('downloads').insert({
        material_id: material.id,
        user_id: user.id,
        material_title: material.title,
        material_author: material.authorName,
        downloaded_at: new Date().toISOString(),
        file_url: material.fileUrl,
        file_name: material.fileName || 'document',
      });
      if (insertError) throw insertError;

      window.open(material.fileUrl, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleBuy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted || !material.fileUrl) return;

    const user = await getCurrentUser();
    if (!user || user.id === material.authorId) return;

    try {
      const nowIso = new Date().toISOString();
      const purchasePayload: Database['public']['Tables']['purchases']['Insert'] = {
        material_id: material.id,
        material_title: material.title,
        seller_id: material.authorId,
        buyer_id: user.id,
        amount: Number(material.price || 0),
        purchased_at: nowIso,
      };

      const { error: purchaseError } = await supabase.from('purchases').insert(purchasePayload);
      if (purchaseError) throw purchaseError;

      const { error: downloadInsertError } = await supabase.from('downloads').insert({
        material_id: material.id,
        user_id: user.id,
        material_title: material.title,
        material_author: material.authorName,
        downloaded_at: nowIso,
        file_url: material.fileUrl,
        file_name: material.fileName || 'document',
      });
      if (downloadInsertError) throw downloadInsertError;

      const { error: updateError } = await supabase
        .from('materials')
        .update({ downloads: (material.downloads || 0) + 1 })
        .eq('id', material.id);
      if (updateError) throw updateError;

      window.open(material.fileUrl, '_blank');
    } catch (error) {
      console.error('Buy failed:', error);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-all group border border-transparent hover:border-primary/10">
        <div className="flex gap-4 items-start">
          <div className="w-16 h-20 bg-surface-container rounded-lg flex items-center justify-center text-on-surface-variant relative">
            <span className="material-symbols-outlined text-3xl">{material.icon || 'description'}</span>
            <div
              className={`absolute -top-2 -right-2 text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                material.type === 'swap'
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : material.type === 'sell'
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : material.type === 'donate'
                      ? 'bg-purple-100 text-purple-700 border-purple-200'
                      : 'bg-sky-100 text-sky-700 border-sky-200'
              }`}
            >
              {material.type}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-headline font-bold text-lg text-on-surface leading-tight">{material.title}</h4>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${
                    isCompleted ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {isCompleted ? 'Completed' : 'Available'}
                </span>
                {isOwner && onDeleteMaterial && (
                  <button
                    onClick={() => onDeleteMaterial(material)}
                    className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors text-xl"
                    title="Delete material"
                  >
                    delete
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary px-2 py-1 bg-secondary-container/20 rounded">
                {material.subject}
              </span>
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">download</span> {material.downloads}
              </span>
              {material.type === 'sell' && <span className="text-xs font-bold text-tertiary ml-auto">INR {material.price?.toFixed(2)}</span>}
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-surface-container pt-4">
          <div className="flex items-center gap-2">
            {material.isVerified && (
              <div className="w-6 h-6 rounded-full bg-tertiary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[12px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
            )}
            <span className="text-xs text-on-surface-variant font-medium">{material.isVerified ? 'Verified Curator' : 'Pending Review'}</span>
          </div>

          {isOwner && onToggleStatus ? (
            <button
              onClick={() => onToggleStatus(material, isCompleted ? 'available' : 'completed')}
              className="text-xs font-bold uppercase tracking-wide text-primary hover:underline"
            >
              {isCompleted ? 'Mark Available' : `Mark ${material.type} Done`}
            </button>
          ) : material.type === 'sell' ? (
            <button
              onClick={handleBuy}
              disabled={isCompleted}
              className={`flex items-center gap-2 text-sm font-bold ${
                isCompleted ? 'text-slate-400 cursor-not-allowed' : 'text-primary hover:underline'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{isCompleted ? 'lock' : 'shopping_cart'}</span>
              {isCompleted ? 'Closed' : 'Buy Now'}
            </button>
          ) : material.type === 'resource' ? (
            <button
              onClick={handleDownload}
              disabled={isCompleted}
              className={`flex items-center gap-2 text-sm font-bold ${
                isCompleted ? 'text-slate-400 cursor-not-allowed' : 'text-primary hover:underline'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{isCompleted ? 'lock' : 'download'}</span>
              {isCompleted ? 'Closed' : 'Download'}
            </button>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Connect in chat</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <article className="glass-card rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] shadow-[0_0_32px_0_rgba(35,44,81,0.06)] group">
      <div className="h-48 bg-surface-container relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-primary/30">{material.icon || 'description'}</span>
        </div>
        <div className={`absolute top-4 left-4 ${typeColors[material.type]} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter`}>
          {typeLabels[material.type]}
        </div>
        <div
          className={`absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${
            isCompleted ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isCompleted ? 'Completed' : 'Available'}
        </div>
        {material.isVerified && (
          <div className="absolute top-12 right-4 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
            Verified
          </div>
        )}
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{material.subject}</span>
          <div className="flex items-center gap-1 text-tertiary">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
            <span className="text-xs font-bold">{material.rating}</span>
          </div>
        </div>
        <h2 className="font-headline text-lg font-extrabold text-on-surface mb-2 leading-snug">{material.title}</h2>
        <p className="text-on-surface-variant text-sm mb-6 line-clamp-2">{material.description}</p>
        {!isOwner && hasStudentDetails && (
          <div className="mb-4 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">Student Details</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {material.studentName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-sm">person</span>
                  {material.studentName}
                </span>
              )}
              {material.studentYear && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-sm">school</span>
                  {material.studentYear}
                </span>
              )}
              {material.studentDepartment && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-sm">apartment</span>
                  {material.studentDepartment}
                </span>
              )}
            </div>
          </div>
        )}
        {!isOwner && hasContactDetails && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {material.contactPhone && (
              <a
                href={`tel:${material.contactPhone}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-all"
                title="Call seller"
              >
                <span className="material-symbols-outlined text-sm">call</span>
                Call
              </a>
            )}
            {material.contactWhatsapp && normalizeWhatsappUrl(material.contactWhatsapp) && (
              <a
                href={normalizeWhatsappUrl(material.contactWhatsapp)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all"
                title="Chat on WhatsApp"
              >
                <span className="material-symbols-outlined text-sm">chat</span>
                WhatsApp
              </a>
            )}
            {material.contactInstagram && normalizeInstagramUrl(material.contactInstagram) && (
              <a
                href={normalizeInstagramUrl(material.contactInstagram)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 transition-all"
                title="Open Instagram profile"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                Instagram
              </a>
            )}
            {material.contactTelegram && normalizeTelegramUrl(material.contactTelegram) && (
              <a
                href={normalizeTelegramUrl(material.contactTelegram)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-700 hover:bg-sky-200 transition-all"
                title="Open Telegram profile"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                Telegram
              </a>
            )}
          </div>
        )}
        <div className="mt-auto pt-6 border-t border-outline-variant/10 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
              <img
                alt={material.authorName}
                className="w-full h-full object-cover"
                src={material.authorAvatar || `https://picsum.photos/seed/${material.authorId}/32/32`}
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="truncate text-xs font-medium text-on-surface-variant">{material.authorName}</span>
          </div>
          {canMessageAuthor ? (
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() =>
                  onMessageAuthor?.({
                    id: material.authorId,
                    name: material.authorName,
                    avatar: material.authorAvatar || '',
                  })
                }
                className="rounded-full bg-surface-container p-2 hover:bg-surface-container-high transition-all flex items-center justify-center"
                title="Message seller"
              >
                <span className="material-symbols-outlined">chat</span>
              </button>
              {material.type === 'resource' && (
                <button
                  onClick={handleDownload}
                  disabled={isCompleted}
                  className={`rounded-full p-2 transition-all flex items-center justify-center ${
                    isCompleted ? 'bg-slate-300 text-white cursor-not-allowed' : 'bg-primary text-on-primary hover:opacity-80'
                  }`}
                  title="Download resource"
                >
                  <span className="material-symbols-outlined">{isCompleted ? 'lock' : 'download'}</span>
                </button>
              )}
            </div>
          ) : (
            <span className="text-[11px] font-semibold text-on-surface-variant">Connect in chat</span>
          )}
        </div>
      </div>
    </article>
  );
};
