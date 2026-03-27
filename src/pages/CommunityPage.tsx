import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, SwapRequest } from '../types';
import { supabase } from '../auth';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Plus, Search, User, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { useAuthModal } from '../contexts/AuthModalContext';
import type { Database } from '../supabase.types';

interface CommunityPageProps {
  user: UserProfile | null;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const { openAuthModal } = useAuthModal();
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lookingFor: '',
  });

  const requestLogin = async () => {
    await openAuthModal();
  };

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('swap_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch swap requests:', error);
        setLoading(false);
        return;
      }

      const mapped = (data || []).map((row: Database['public']['Tables']['swap_requests']['Row']) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userAvatar: row.user_avatar || '',
        title: row.title,
        description: row.description,
        lookingFor: row.looking_for,
        status: row.status,
        createdAt: row.created_at,
      })) as SwapRequest[];
      setRequests(mapped);
      setLoading(false);
    };

    fetchRequests();
  }, []);

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await requestLogin();
      return;
    }

    setIsSubmitting(true);
    try {
      const newRequest: Database['public']['Tables']['swap_requests']['Insert'] = {
        user_id: user.uid,
        user_name: user.displayName,
        user_avatar: user.photoURL || '',
        title: formData.title,
        description: formData.description,
        looking_for: formData.lookingFor,
        status: 'open',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('swap_requests')
        .insert(newRequest)
        .select('*')
        .single();
      if (error || !data) {
        throw error;
      }
      const inserted = data as Database['public']['Tables']['swap_requests']['Row'];
      setRequests((prev) => [
        {
          id: inserted.id,
          userId: inserted.user_id,
          userName: inserted.user_name,
          userAvatar: inserted.user_avatar || '',
          title: inserted.title,
          description: inserted.description,
          lookingFor: inserted.looking_for,
          status: inserted.status,
          createdAt: inserted.created_at,
        },
        ...prev,
      ]);
      setShowPostModal(false);
      setFormData({ title: '', description: '', lookingFor: '' });
    } catch (error) {
      console.error('Failed to create swap request:', error);
      alert('Failed to post request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (requestId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';
      const { error } = await supabase
        .from('swap_requests')
        .update({ status: newStatus })
        .eq('id', requestId);
      if (error) {
        throw error;
      }
      setRequests((prev) => prev.map((request) => (
        request.id === requestId ? { ...request, status: newStatus as 'open' | 'closed' } : request
      )));
    } catch (error) {
      console.error('Failed to update request status:', error);
      alert('Failed to update request status.');
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      const { error } = await supabase
        .from('swap_requests')
        .delete()
        .eq('id', requestId);
      if (error) {
        throw error;
      }
      setRequests((prev) => prev.filter((request) => request.id !== requestId));
    } catch (error) {
      console.error('Failed to delete request:', error);
      alert('Failed to delete request.');
    }
  };

  const openChatWithUser = async (request: SwapRequest) => {
    if (!user) {
      await requestLogin();
      return;
    }
    if (user.uid === request.userId) return;

    navigate(
      `/chat?peer=${encodeURIComponent(request.userId)}&name=${encodeURIComponent(request.userName)}&avatar=${encodeURIComponent(request.userAvatar || '')}`
    );
  };

  const filteredRequests = requests.filter(req => 
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.lookingFor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Swap Community</h1>
            <p className="text-slate-600">Connect with peers, post requests, and find the materials you need.</p>
          </div>
          <button 
            onClick={() => user ? setShowPostModal(true) : requestLogin()}
            className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            Post Swap Request
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text"
                placeholder="Search requests (e.g. 'Calculus', 'Python notes')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-6 bg-white rounded-2xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredRequests.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredRequests.map((req) => (
                  <motion.div 
                    key={req.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                          {req.userAvatar ? (
                            <img src={req.userAvatar} alt={req.userName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <User size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 leading-none mb-1">{req.userName}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock size={12} />
                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Just now'}
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${req.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {req.status}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">{req.title}</h3>
                    <p className="text-slate-600 mb-4 line-clamp-2">{req.description}</p>
                    
                    <div className="bg-primary/5 rounded-2xl p-4 mb-6 border border-primary/10">
                      <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
                        <Search size={14} />
                        Looking For:
                      </div>
                      <p className="text-slate-700 font-medium">{req.lookingFor}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <button
                        onClick={() => openChatWithUser(req)}
                        className="flex items-center gap-2 text-slate-600 font-bold text-sm hover:text-primary transition-colors"
                      >
                        <MessageSquare size={18} />
                        {user?.uid === req.userId ? 'Your Request' : 'Interested'}
                      </button>
                      
                      {user?.uid === req.userId && (
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => toggleStatus(req.id, req.status)}
                            className={`flex items-center gap-2 font-bold text-sm transition-colors ${req.status === 'open' ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                          >
                            {req.status === 'open' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                            {req.status === 'open' ? 'Close Request' : 'Reopen Request'}
                          </button>
                          <button 
                            onClick={() => deleteRequest(req.id)}
                            className="text-rose-500 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={32} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No requests found</h3>
                <p className="text-slate-500">Try adjusting your search or be the first to post a request!</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-primary" />
                Community Guidelines
              </h3>
              <ul className="space-y-4">
                {[
                  'Be respectful to peers',
                  'Only swap academic content',
                  'Verify materials before swapping',
                  'Report suspicious activity'
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-primary/20">
              <h3 className="text-lg font-bold mb-2">Join the Conversation</h3>
              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                Help your peers and earn Community Points. Top swappers get featured on the homepage!
              </p>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/20 w-fit px-3 py-1 rounded-full">
                <Plus size={12} />
                Coming Soon: Chat
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post Request Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPostModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">New Swap Request</h2>
                <button 
                  onClick={() => setShowPostModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <XCircle size={24} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handlePostRequest} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 px-1">What do you need?</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Looking for CS201 Final Exam Notes"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full h-14 px-6 bg-slate-50 rounded-2xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 px-1">What are you offering in exchange?</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Can swap for my Data Structures notes"
                    value={formData.lookingFor}
                    onChange={(e) => setFormData(prev => ({ ...prev, lookingFor: e.target.value }))}
                    className="w-full h-14 px-6 bg-slate-50 rounded-2xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 px-1">Additional Details</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Describe your request in more detail..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-6 bg-slate-50 rounded-2xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                  />
                </div>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-4 bg-primary text-white rounded-full font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Post Request'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};
