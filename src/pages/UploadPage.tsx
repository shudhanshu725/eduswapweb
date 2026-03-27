import React, { useState } from 'react';
import { UserProfile, Page } from '../types';
import { supabase } from '../auth';
import { useAuthModal } from '../contexts/AuthModalContext';

interface UploadPageProps {
  user: UserProfile | null;
  onPageChange: (page: Page) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ user, onPageChange }) => {
  const { openAuthModal } = useAuthModal();
  const [shareType, setShareType] = useState<'swap' | 'sell' | 'donate' | 'resource' | 'question-paper'>('swap');
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    paperName: '',
    semester: '',
    subject: 'General',
    description: '',
    price: '',
    studentName: '',
    studentYear: '',
    studentDepartment: '',
    contactPhone: '',
    contactWhatsapp: '',
    contactInstagram: '',
    contactTelegram: '',
  });

  const requestLogin = async () => {
    await openAuthModal();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await requestLogin();
      return;
    }

    const isDocumentShare = shareType === 'resource' || shareType === 'question-paper';
    const requiresFile = isDocumentShare;

    if (requiresFile && !file) {
      alert('Please select a PDF file to upload');
      return;
    }
    if (isDocumentShare && file && file.type !== 'application/pdf') {
      alert('Only PDF files are allowed in Resource Share and Question Paper.');
      return;
    }
    if (shareType === 'question-paper' && (!formData.paperName.trim() || !formData.semester.trim())) {
      alert('Please fill Paper Name and Semester for Question Paper.');
      return;
    }
    if (!formData.studentName.trim() || !formData.studentYear.trim() || !formData.studentDepartment.trim()) {
      alert('Please fill Name, Year, and Department to verify your student profile.');
      return;
    }

    setIsUploading(true);
    try {
      let publicUrl = '';
      let fileName = '';
      let fileType = '';
      let fileSize = 0;

      if (file) {
        const sanitizedName = file.name.replace(/\s+/g, '_');
        const filePath = `${user.uid}/${Date.now()}_${sanitizedName}`;
        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, file, { upsert: false });
        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { data: publicFile } = supabase.storage.from('materials').getPublicUrl(filePath);
        publicUrl = publicFile.publicUrl;
        fileName = file.name;
        fileType = file.type;
        fileSize = file.size;
      }

      // 2. Save metadata to Supabase table
      const isQuestionPaper = shareType === 'question-paper';
      const dbType: 'swap' | 'sell' | 'donate' | 'resource' =
        shareType === 'swap' || shareType === 'sell' || shareType === 'donate' || shareType === 'resource'
          ? shareType
          : 'resource';
      const normalizedTitle = isQuestionPaper ? formData.paperName.trim() : formData.title.trim();
      const questionPaperPrefix = isQuestionPaper ? `Question Paper | Semester: ${formData.semester.trim()}` : '';
      const materialData = {
        title: normalizedTitle,
        subject: formData.subject,
        description: questionPaperPrefix
          ? `${questionPaperPrefix}${formData.description.trim() ? `\n\n${formData.description.trim()}` : ''}`
          : formData.description,
        type: dbType,
        price: shareType === 'sell' ? parseFloat(formData.price) : 0,
        author_id: user.uid,
        author_name: user.displayName,
        author_avatar: user.photoURL || '',
        file_url: publicUrl || null,
        file_name: fileName || null,
        file_type: fileType || null,
        file_size: fileSize || null,
        student_name: formData.studentName.trim() || null,
        student_year: formData.studentYear.trim() || null,
        student_department: formData.studentDepartment.trim() || null,
        contact_phone: formData.contactPhone.trim() || null,
        contact_whatsapp: formData.contactWhatsapp.trim() || null,
        contact_instagram: formData.contactInstagram.trim() || null,
        contact_telegram: formData.contactTelegram.trim() || null,
        rating: 5.0,
        downloads: 0,
        is_verified: false,
        icon: isQuestionPaper ? 'quiz' : shareType === 'resource' ? 'picture_as_pdf' : 'inventory_2',
        status: 'available' as const,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from('materials').insert(materialData);
      if (insertError) {
        throw new Error(
          `Database insert failed: ${insertError.message}${
            insertError.details ? ` (${insertError.details})` : ''
          }`
        );
      }
      alert('Item uploaded successfully!');
      onPageChange('dashboard');
    } catch (error) {
      console.error('Error uploading material:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : (() => {
                if (error && typeof error === 'object') {
                  const e = error as { message?: string; details?: string; hint?: string; code?: string };
                  const parts = [e.message, e.details, e.hint, e.code].filter(Boolean);
                  if (parts.length > 0) return parts.join(' | ');
                  try {
                    return JSON.stringify(error);
                  } catch {
                    return 'Unknown error';
                  }
                }
                return 'Unknown error';
              })();
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]"></div>
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center md:text-left">
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4">List Your College Items</h1>
          <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">Sell, swap, donate, or share student essentials like notes, lab equipment, calculators, bicycles, and more.</p>
        </div>

        {!user ? (
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-12 text-center shadow-[0_0_32px_0_rgba(35,44,81,0.06)] border border-white/40">
            <span className="material-symbols-outlined text-6xl text-primary mb-6">lock</span>
            <h2 className="text-2xl font-bold font-headline mb-4">Login Required</h2>
            <p className="text-on-surface-variant mb-8">Please login to upload and share your items/resources with the community.</p>
            <button 
              onClick={requestLogin}
              className="px-10 py-4 bg-primary text-white rounded-full font-headline font-bold text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              Login with Email
            </button>
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 shadow-[0_0_32px_0_rgba(35,44,81,0.06)] border border-white/40">
            <div className="relative group cursor-pointer">
              <div className={`w-full aspect-[21/9] min-h-[280px] rounded-xl border-2 border-dashed ${file ? 'border-primary bg-primary/5' : 'border-outline-variant/40 bg-surface-container-lowest/50'} flex flex-col items-center justify-center transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary-container/5`}>
                <div className={`w-20 h-20 ${file ? 'bg-primary text-white' : 'bg-surface-container'} rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <span className="material-symbols-outlined text-4xl">{file ? 'check' : 'upload_file'}</span>
                </div>
                <h3 className="font-headline text-xl font-bold text-on-surface mb-2">
                  {file
                    ? file.name
                    : shareType === 'resource'
                      ? 'Upload PDF Resource'
                      : shareType === 'question-paper'
                        ? 'Upload Question Paper (PDF)'
                        : 'Upload Item Photo/Document (Optional)'}
                </h3>
                <p className="text-on-surface-variant text-sm font-medium">
                  {file
                    ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                    : shareType === 'resource' || shareType === 'question-paper'
                      ? 'PDF only, up to 50MB'
                      : 'Image/PDF optional for better listing'}
                </p>
                <input 
                  aria-label="Upload item file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  type="file" 
                  accept={shareType === 'resource' || shareType === 'question-paper' ? 'application/pdf' : undefined}
                  onChange={handleFileChange}
                  required={shareType === 'resource' || shareType === 'question-paper'}
                />
              </div>
            </div>

            <form className="mt-12 space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <label className="block text-sm font-bold font-headline text-on-surface px-1">How would you like to share this?</label>
                <div className="flex flex-wrap gap-4 p-1.5 bg-surface-container-highest/20 rounded-2xl w-fit">
                  {(['swap', 'sell', 'donate', 'resource', 'question-paper'] as const).map((type) => (
                    <div key={type} className="relative">
                      <input 
                        className="sr-only" 
                        id={`type-${type}`} 
                        name="share-type" 
                        type="radio" 
                        checked={shareType === type}
                        onChange={() => setShareType(type)}
                      />
                      <label 
                        className={`px-8 py-3 rounded-xl text-sm font-bold font-headline cursor-pointer transition-all duration-300 flex items-center gap-2 ${shareType === type ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:bg-white/50'}`} 
                        htmlFor={`type-${type}`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {type === 'swap'
                            ? 'swap_horiz'
                            : type === 'sell'
                              ? 'payments'
                              : type === 'donate'
                                ? 'volunteer_activism'
                                : type === 'question-paper'
                                  ? 'quiz'
                                  : 'picture_as_pdf'}
                        </span>
                        {type === 'resource'
                          ? 'PDF Resource'
                          : type === 'question-paper'
                            ? 'Question Paper'
                            : type.charAt(0).toUpperCase() + type.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>

                {(shareType === 'resource' || shareType === 'question-paper') && (
                  <p className="text-xs text-on-surface-variant font-medium">
                    PDF Resource and Question Paper listings will show a download option. Sell/Swap/Donate listings will not show direct download.
                  </p>
                )}

                {shareType === 'sell' && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2 max-w-[200px]">
                      <label className="block text-sm font-bold font-headline text-on-surface px-1">Set Your Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">INR</span>
                        <input 
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          className="w-full h-12 pl-8 pr-4 bg-surface-container-highest/30 rounded-xl border-0 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none" 
                          placeholder="0.00" 
                          step="0.01" 
                          type="number" 
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-sm font-bold font-headline text-on-surface px-1">
                    {shareType === 'question-paper' ? 'Paper Name' : 'Item Title'}
                  </label>
                  <input 
                    name={shareType === 'question-paper' ? 'paperName' : 'title'}
                    value={shareType === 'question-paper' ? formData.paperName : formData.title}
                    onChange={handleInputChange}
                    className="w-full h-14 px-6 bg-surface-container-highest/30 rounded-xl border-0 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none" 
                    placeholder={shareType === 'question-paper' ? 'e.g. Data Structures End Sem 2025' : 'e.g. Lab Coat, Cycle, Engineering Notes'} 
                    type="text" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  {shareType === 'question-paper' ? (
                    <>
                      <label className="block text-sm font-bold font-headline text-on-surface px-1">Semester</label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        className="w-full h-14 px-6 bg-surface-container-highest/30 rounded-xl border-0 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none appearance-none"
                        required
                      >
                        <option value="" disabled>
                          Select semester
                        </option>
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                        <option value="Semester 3">Semester 3</option>
                        <option value="Semester 4">Semester 4</option>
                        <option value="Semester 5">Semester 5</option>
                        <option value="Semester 6">Semester 6</option>
                        <option value="Semester 7">Semester 7</option>
                        <option value="Semester 8">Semester 8</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-bold font-headline text-on-surface px-1">Category</label>
                      <select 
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full h-14 px-6 bg-surface-container-highest/30 rounded-xl border-0 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none appearance-none"
                      >
                        <option>General</option>
                        <option>Notes & Books</option>
                        <option>Lab Equipment</option>
                        <option>Electronics</option>
                        <option>Bicycle</option>
                        <option>Stationery</option>
                      </select>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold font-headline text-on-surface px-1">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-6 bg-surface-container-highest/30 rounded-xl border-0 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none resize-none" 
                  placeholder="Item condition, usage details, and exchange/sale preference..." 
                  rows={4}
                  required
                ></textarea>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold font-headline text-on-surface px-1">Student Details (Required)</label>
                  <p className="text-xs text-on-surface-variant mt-1 px-1">
                    Add your basic academic details so buyers/swap users can verify you are a genuine student.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-surface-container-highest/30 rounded-xl border-0 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                    placeholder="Your name"
                    type="text"
                    required
                  />
                  <select
                    name="studentYear"
                    value={formData.studentYear}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-surface-container-highest/30 rounded-xl border-0 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none appearance-none"
                    required
                  >
                    <option value="" disabled>
                      Select year
                    </option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="PG">PG</option>
                  </select>
                  <input
                    name="studentDepartment"
                    value={formData.studentDepartment}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-surface-container-highest/30 rounded-xl border-0 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                    placeholder="Department"
                    type="text"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold font-headline text-on-surface px-1">Contact Details (Optional)</label>
                  <p className="text-xs text-on-surface-variant mt-1 px-1">
                    Add only what you are comfortable sharing. Buyers can contact you directly using these details.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-surface-container-highest/30 rounded-xl border-0 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                    placeholder="Phone number (optional)"
                    type="tel"
                  />
                  <input
                    name="contactWhatsapp"
                    value={formData.contactWhatsapp}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-surface-container-highest/30 rounded-xl border-0 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                    placeholder="WhatsApp number (optional)"
                    type="tel"
                  />
                  <input
                    name="contactInstagram"
                    value={formData.contactInstagram}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-surface-container-highest/30 rounded-xl border-0 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                    placeholder="Instagram handle or link (optional)"
                    type="text"
                  />
                  <input
                    name="contactTelegram"
                    value={formData.contactTelegram}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-surface-container-highest/30 rounded-xl border-0 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                    placeholder="Telegram username or link (optional)"
                    type="text"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                <div className="flex items-center gap-3 text-tertiary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  <span className="text-sm font-semibold">Verified as Academic Content</span>
                </div>
                <button 
                  disabled={isUploading}
                  className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-primary to-primary-dim text-white rounded-full font-headline font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                  type="submit"
                >
                  {isUploading ? 'Uploading...' : 'Upload Now'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: 'auto_awesome', title: 'High Quality', desc: 'Ensure text is legible and charts are clear for better curation.' },
            { icon: 'copyright', title: 'Original Work', desc: 'Only upload content you have the rights to share.' },
            { icon: 'groups', title: 'Community First', desc: 'Detailed descriptions help your peers find exactly what they need.' }
          ].map((item) => (
            <div key={item.title} className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/5">
              <span className="material-symbols-outlined text-secondary mb-4">{item.icon}</span>
              <h4 className="font-headline font-bold mb-2">{item.title}</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

