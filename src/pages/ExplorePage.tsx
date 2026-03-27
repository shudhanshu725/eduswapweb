import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialCard } from '../components/MaterialCard';
import { Material, UserProfile } from '../types';
import { supabase } from '../auth';
import type { Database } from '../supabase.types';

interface ExplorePageProps {
  user: UserProfile | null;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const fetchMaterials = async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch materials:', error);
        setLoading(false);
        return;
      }

      const mapped: Material[] = (data || []).map((row: Database['public']['Tables']['materials']['Row']) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        type: row.type,
        subject: row.subject,
        authorId: row.author_id,
        authorName: row.author_name,
        authorAvatar: row.author_avatar || '',
        fileUrl: row.file_url || '',
        fileName: row.file_name || '',
        fileType: row.file_type || '',
        fileSize: row.file_size || 0,
        studentName: row.student_name || '',
        studentYear: row.student_year || '',
        studentDepartment: row.student_department || '',
        contactPhone: row.contact_phone || '',
        contactWhatsapp: row.contact_whatsapp || '',
        contactInstagram: row.contact_instagram || '',
        contactTelegram: row.contact_telegram || '',
        rating: row.rating || 0,
        downloads: row.downloads || 0,
        price: row.price || 0,
        isVerified: !!row.is_verified,
        isCommunityChoice: !!row.is_community_choice,
        icon: row.icon || 'description',
        status: row.status || 'available',
        completedAt: row.completed_at || undefined,
        createdAt: row.created_at,
      }));
      setMaterials(mapped);
      setLoading(false);
    };

    fetchMaterials();
  }, []);

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedSubject('All');
    setShowCompleted(false);
  };

  const filteredMaterials = materials.filter(m => {
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(m.type.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || m.subject === selectedSubject;
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = showCompleted || m.status !== 'completed';
    return matchesType && matchesSubject && matchesSearch && matchesAvailability;
  });
  const completedHiddenCount = materials.filter((m) => m.status === 'completed').length;

  return (
    <main className="pt-32 pb-20 px-8 max-w-7xl mx-auto">
      <header className="mb-16">
        <h1 className="font-headline text-5xl font-extrabold text-on-surface mb-6 tracking-tight">The Academic Curator</h1>
        <p className="text-on-surface-variant max-w-2xl text-lg mb-10 leading-relaxed">Discover college essentials from students: notes, books, lab equipment, bicycles, electronics, and downloadable PDF resources.</p>
        <div className="relative w-full max-w-3xl">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline">search</span>
          </div>
          <input 
            className="w-full pl-16 pr-6 py-5 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 text-lg shadow-sm outline-none" 
            placeholder="Search items, categories, or listing types..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-10">
          <div>
            <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-secondary mb-6">Transaction Type</h3>
            <div className="flex flex-col gap-3">
              {['Swap', 'Sell', 'Donate', 'Resource'].map((type) => (
                <label key={type} className="flex items-center gap-3 group cursor-pointer">
                  <input 
                    className="w-5 h-5 rounded border-outline-variant/30 text-primary focus:ring-primary/20 bg-surface-container" 
                    type="checkbox" 
                    checked={selectedTypes.includes(type.toLowerCase())}
                    onChange={() => toggleType(type.toLowerCase())}
                  />
                  <span className="text-on-surface-variant group-hover:text-on-surface transition-colors">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-secondary">Subject Area</h3>
              {(selectedTypes.length > 0 || selectedSubject !== 'All' || searchQuery || showCompleted) && (
                <button 
                  onClick={clearFilters}
                  className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {['All', 'Computer Science', 'Economics', 'Social Sciences', 'Engineering', 'Mathematics'].map((subject) => (
                <span 
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`px-4 py-2 ${selectedSubject === subject ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container text-on-surface-variant'} rounded-full text-xs font-bold transition-all cursor-pointer hover:bg-surface-variant`}
                >
                  {subject}
                </span>
              ))}
            </div>
            <label className="mt-5 flex items-center gap-2 text-xs text-on-surface-variant">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-outline-variant/30 text-primary"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
              />
              Show completed items
            </label>
            {!showCompleted && completedHiddenCount > 0 && (
              <p className="mt-2 text-[11px] text-on-surface-variant">{completedHiddenCount} completed items hidden</p>
            )}
          </div>
        </aside>

        <section className="flex-grow">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  currentUser={user}
                  onMessageAuthor={(author) =>
                    navigate(
                      `/chat?peer=${encodeURIComponent(author.id)}&name=${encodeURIComponent(author.name)}&avatar=${encodeURIComponent(author.avatar || '')}`
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/20">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">search_off</span>
              <h3 className="text-xl font-bold font-headline text-on-surface">No materials found</h3>
              <p className="text-on-surface-variant">Try adjusting your filters or search query.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
