import React, { useState, useEffect } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { UserProfile, Material, Page } from '../types';
import { supabase } from '../auth';
import type { Database } from '../supabase.types';

interface DashboardPageProps {
  user: UserProfile | null;
  onPageChange: (page: Page) => void;
}

type DashboardTab = 'overview' | 'my-materials' | 'my-downloads' | 'profile' | 'settings';
type DownloadRow = Database['public']['Tables']['downloads']['Row'];
type PurchaseRow = Database['public']['Tables']['purchases']['Row'];

interface UserDownload {
  id: string;
  userId: string;
  materialId: string;
  materialTitle: string;
  materialAuthor: string;
  downloadedAt: string;
  fileUrl: string;
  fileName: string;
}

interface UserSale {
  id: string;
  materialId: string;
  materialTitle: string;
  buyerId: string;
  amount: number;
  purchasedAt: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onPageChange }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [userMaterials, setUserMaterials] = useState<Material[]>([]);
  const [userDownloads, setUserDownloads] = useState<UserDownload[]>([]);
  const [userSales, setUserSales] = useState<UserSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserMaterials([]);
      setUserDownloads([]);
      setUserSales([]);
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      const [materialsRes, downloadsRes, salesRes] = await Promise.all([
        supabase
          .from('materials')
          .select('*')
          .eq('author_id', user.uid)
          .order('created_at', { ascending: false }),
        supabase
          .from('downloads')
          .select('*')
          .eq('user_id', user.uid)
          .order('downloaded_at', { ascending: false }),
        supabase
          .from('purchases')
          .select('*')
          .eq('seller_id', user.uid)
          .order('purchased_at', { ascending: false }),
      ]);

      if (materialsRes.error) {
        console.error('Failed to fetch user materials:', materialsRes.error);
      } else {
        const mappedMaterials: Material[] = (materialsRes.data || []).map((row: Database['public']['Tables']['materials']['Row']) => ({
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
        setUserMaterials(mappedMaterials);
      }

      if (downloadsRes.error) {
        console.error('Failed to fetch user downloads:', downloadsRes.error);
      } else {
        setUserDownloads((downloadsRes.data || []).map((row: DownloadRow) => ({
          id: row.id,
          userId: row.user_id,
          materialId: row.material_id,
          materialTitle: row.material_title,
          materialAuthor: row.material_author,
          downloadedAt: row.downloaded_at,
          fileUrl: row.file_url,
          fileName: row.file_name,
        })));
      }

      if (salesRes.error) {
        console.error('Failed to fetch user sales:', salesRes.error);
      } else {
        setUserSales((salesRes.data || []).map((row: PurchaseRow) => ({
          id: row.id,
          materialId: row.material_id,
          materialTitle: row.material_title,
          buyerId: row.buyer_id,
          amount: row.amount || 0,
          purchasedAt: row.purchased_at,
        })));
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold font-headline mb-4 text-on-surface">Please login to view your dashboard</h2>
          <p className="text-on-surface-variant">Sign in with Google to access your materials and downloads.</p>
        </div>
      </div>
    );
  }

  const toggleMaterialStatus = async (material: Material, nextStatus: 'available' | 'completed') => {
    const payload = {
      status: nextStatus,
      completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from('materials')
      .update(payload)
      .eq('id', material.id)
      .eq('author_id', user.uid);

    if (error) {
      console.error('Failed to update material status:', error);
      return;
    }

    setUserMaterials((prev) =>
      prev.map((item) =>
        item.id === material.id
          ? { ...item, status: nextStatus, completedAt: payload.completed_at || undefined }
          : item
      )
    );
  };

  const deleteMaterial = async (material: Material) => {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', material.id)
      .eq('author_id', user.uid);

    if (error) {
      console.error('Failed to delete material:', error);
      return;
    }

    if (material.fileUrl && material.fileName) {
      try {
        const pathMatch = material.fileUrl.split('/materials/')[1];
        if (pathMatch) {
          await supabase.storage.from('materials').remove([decodeURIComponent(pathMatch)]);
        }
      } catch (storageErr) {
        console.error('Storage cleanup failed:', storageErr);
      }
    }

    setUserMaterials((prev) => prev.filter((item) => item.id !== material.id));
  };

  const stats = [
    { label: 'Total Materials', value: userMaterials.length, icon: 'description', color: 'text-primary bg-primary/10' },
    { label: 'Total Downloads', value: userMaterials.reduce((acc, m) => acc + (m.downloads || 0), 0), icon: 'download', color: 'text-secondary bg-secondary/10' },
    { label: 'Total Sales', value: userSales.length, icon: 'shopping_cart', color: 'text-tertiary bg-tertiary/10' },
    { label: 'Total Earnings', value: `INR ${userSales.reduce((acc, sale) => acc + (sale.amount || 0), 0).toFixed(2)}`, icon: 'payments', color: 'text-emerald-600 bg-emerald-600/10' }
  ];

  const sidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: 'dashboard' },
    { id: 'my-materials', label: 'My Materials', icon: 'folder' },
    { id: 'my-downloads', label: 'My Downloads', icon: 'download_for_offline' },
    { id: 'profile', label: 'My Profile', icon: 'person' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <main className="pt-28 pb-16 min-h-screen px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 space-y-2">
          <div className="p-4 mb-4">
            <h2 className="font-headline text-on-surface-variant text-xs uppercase tracking-widest font-bold">Workspace</h2>
          </div>
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as DashboardTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  activeTab === item.id 
                    ? 'bg-primary text-on-primary font-semibold shadow-sm' 
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "" }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="mt-12 p-6 rounded-xl bg-surface-container-high relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm font-semibold text-on-surface mb-2">Pro Member</p>
              <p className="text-xs text-on-surface-variant mb-4">You have unlimited downloads this month.</p>
              <button className="w-full py-2 bg-surface-container-lowest text-primary text-xs font-bold rounded-full hover:shadow-md transition-all">View Plan</button>
            </div>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary opacity-10 rounded-full blur-xl"></div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-12">
          {activeTab === 'overview' && (
            <>
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-headline font-extrabold text-on-surface">Overview</h1>
                <button 
                  onClick={() => onPageChange('upload')}
                  className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  <span className="material-symbols-outlined">add</span>
                  Upload New
                </button>
              </div>

              {/* Summary Stats Section */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-white/80 backdrop-blur-xl p-6 rounded-xl shadow-[0_0_32px_0_rgba(35,44,81,0.06)] border border-white/20 relative group">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`material-symbols-outlined ${stat.color} p-3 rounded-xl`}>{stat.icon}</span>
                    </div>
                    <h3 className="text-2xl font-headline font-extrabold text-on-surface">{stat.value}</h3>
                    <p className="text-on-surface-variant text-xs font-medium">{stat.label}</p>
                  </div>
                ))}
              </section>

              {/* Recent Activity */}
              <section className="space-y-6">
                <h2 className="text-xl font-headline font-bold text-on-surface">Recent Uploads</h2>
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : userMaterials.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userMaterials.slice(0, 4).map((material) => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        variant="compact"
                        currentUser={user}
                        onToggleStatus={toggleMaterialStatus}
                        onDeleteMaterial={deleteMaterial}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">
                    <p className="text-on-surface-variant">No uploads yet.</p>
                  </div>
                )}
              </section>

              <section className="space-y-6">
                <h2 className="text-xl font-headline font-bold text-on-surface">Recent Sales</h2>
                {userSales.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userSales.slice(0, 6).map((sale) => (
                      <div key={sale.id} className="bg-white p-5 rounded-2xl border border-surface-container shadow-sm">
                        <p className="font-bold text-on-surface truncate">{sale.materialTitle}</p>
                        <p className="text-xs text-on-surface-variant mt-1">Buyer: {sale.buyerId}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-bold text-emerald-700">INR {sale.amount.toFixed(2)}</span>
                          <span className="text-xs text-on-surface-variant">{new Date(sale.purchasedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">
                    <p className="text-on-surface-variant">No completed sales yet.</p>
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === 'my-materials' && (
            <section className="space-y-6">
              <h1 className="text-3xl font-headline font-extrabold text-on-surface">My Materials</h1>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userMaterials.map((material) => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      variant="compact"
                      currentUser={user}
                      onToggleStatus={toggleMaterialStatus}
                      onDeleteMaterial={deleteMaterial}
                    />
                  ))}
                  <button 
                    onClick={() => onPageChange('upload')}
                    className="group border-2 border-dashed border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 transition-all min-h-[200px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all">
                      <span className="material-symbols-outlined text-2xl">add</span>
                    </div>
                    <p className="font-headline font-bold text-on-surface-variant group-hover:text-primary transition-all">Upload New Material</p>
                  </button>
                </div>
              )}
            </section>
          )}

          {activeTab === 'my-downloads' && (
            <section className="space-y-6">
              <h1 className="text-3xl font-headline font-extrabold text-on-surface">My Downloads</h1>
              {userDownloads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userDownloads.map((download) => (
                    <div key={download.id} className="bg-white p-6 rounded-2xl border border-surface-container flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">description</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface truncate max-w-[150px]">{download.materialTitle}</h4>
                          <p className="text-xs text-on-surface-variant">By {download.materialAuthor}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => window.open(download.fileUrl, '_blank')}
                        className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all"
                      >
                        <span className="material-symbols-outlined">download</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">
                  <p className="text-on-surface-variant">No downloads yet.</p>
                  <button onClick={() => onPageChange('explore')} className="mt-4 text-primary font-bold hover:underline">Explore Materials</button>
                </div>
              )}
            </section>
          )}

          {activeTab === 'profile' && (
            <section className="space-y-6">
              <h1 className="text-3xl font-headline font-extrabold text-on-surface">My Profile</h1>
              <div className="bg-white p-8 rounded-3xl border border-surface-container space-y-8">
                <div className="flex items-center gap-6">
                  <img 
                    src={user.photoURL || `https://picsum.photos/seed/${user.uid}/128/128`} 
                    alt={user.displayName || 'User'} 
                    className="w-24 h-24 rounded-full ring-4 ring-primary/10"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h2 className="text-2xl font-headline font-bold text-on-surface">{user.displayName}</h2>
                    <p className="text-on-surface-variant">{user.email}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">{user.role}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-surface-container">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue={user.displayName || ''} 
                      className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={user.email || ''} 
                      className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'settings' && (
            <section className="space-y-6">
              <h1 className="text-3xl font-headline font-extrabold text-on-surface">Settings</h1>
              <div className="bg-white p-8 rounded-3xl border border-surface-container space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
                    <div>
                      <h4 className="font-bold text-on-surface">Email Notifications</h4>
                      <p className="text-xs text-on-surface-variant">Receive updates about your uploads and downloads</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-primary rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-on-surface-variant">dark_mode</span>
                    <div>
                      <h4 className="font-bold text-on-surface">Dark Mode</h4>
                      <p className="text-xs text-on-surface-variant">Switch between light and dark themes</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-surface-container-highest rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>

                <div className="pt-6 border-t border-surface-container">
                  <button className="text-error font-bold flex items-center gap-2 hover:underline">
                    <span className="material-symbols-outlined">delete_forever</span>
                    Delete Account
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
};
