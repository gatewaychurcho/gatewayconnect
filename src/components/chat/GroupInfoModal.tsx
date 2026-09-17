import React, { useState, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Shield, 
  ShieldCheck, 
  Camera, 
  Edit3, 
  Users, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music, 
  Settings, 
  Copy, 
  Share2, 
  Pin, 
  Trash2, 
  LogOut, 
  UserPlus, 
  UserMinus, 
  MessageSquare, 
  AlertTriangle, 
  Check, 
  Crown, 
  Lock, 
  Search, 
  Sparkles, 
  Upload, 
  CheckCircle2,
  Bell,
  BellOff,
  GraduationCap
} from 'lucide-react';
import { User, ChatGroup, ChatGroupMessage } from '../../types';
import { StorageService, arePhoneNumbersEqual } from '../../services/storageService';

// Client-side helper to compress uploaded group avatars smoothly for storage
const compressImage = (dataUrl: string, maxWidth = 512, maxHeight = 512): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

// Generates an Instagram-style colorful gradient for member avatars without a picture
const getAvatarGradient = (name: string) => {
  const gradients = [
    'from-amber-500 to-orange-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-pink-600',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return gradients[Math.abs(hash) % gradients.length];
};

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: ChatGroup;
  currentUser: User;
  groupMessages?: ChatGroupMessage[];
  onUpdateGroup: () => void;
  onOpenAddMember: () => void;
  onDirectMessageUser: (user: User) => void;
  onCopyInviteLink: (code: string) => void;
  onClearChat: () => void;
  onExitGroup: () => void;
  onPreviewMedia?: (preview: {
    url: string;
    type?: 'image' | 'video' | 'audio' | 'document';
    caption?: string;
    sender_name?: string;
    created_at?: string;
  }) => void;
}

const PRESET_ICONS = [
  { name: 'Apostle Joe Daniels', url: '/assets/apostle_joe_daniels_main.jpg' },
  { name: 'Discipleship School', url: '/assets/apostle_joe_daniels_grad.jpg' },
  { name: 'Apostolic Impartation', url: '/assets/images/apostle_grad_dark_1788354117156.jpg' },
  { name: 'Worship Fire', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80' },
  { name: 'Prayer & Grace', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80' },
  { name: 'Youth Revival', url: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=300&auto=format&fit=crop&q=80' },
  { name: 'Holy Bible Study', url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=300&auto=format&fit=crop&q=80' },
  { name: 'Sanctuary Fellowship', url: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=300&auto=format&fit=crop&q=80' }
];

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  isOpen,
  onClose,
  group,
  currentUser,
  groupMessages = [],
  onUpdateGroup,
  onOpenAddMember,
  onDirectMessageUser,
  onCopyInviteLink,
  onClearChat,
  onExitGroup,
  onPreviewMedia
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'media' | 'settings'>('members');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'admins' | 'members'>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all');
  
  // Icon change & preset picker modal
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconFileInputRef = useRef<HTMLInputElement>(null);
  const [iconUpdateSuccess, setIconUpdateSuccess] = useState<string | null>(null);

  // Group details editing state
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [editDesc, setEditDesc] = useState(group.description);
  const [editCategory, setEditCategory] = useState<string>(group.category || 'General');

  // Mute notification simulation state
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(`gcz_mute_group_${group.id}`) === 'true';
    } catch {
      return false;
    }
  });

  const allUsers = StorageService.getAllUsers();
  const isDeveloper = currentUser.role === 'developer' || currentUser.id === 'usr_developer' || arePhoneNumbersEqual(currentUser.phone, '0780699988');
  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.id === 'usr_apostle_joe';
  const isGroupAdmin = isDeveloper || isSuperAdmin || (group.admin_ids || [group.created_by]).includes(currentUser.id);
  const isGroupPinned = group.pinned_by_users?.includes(currentUser.id);
  const isUserMember = group.member_ids.includes(currentUser.id);

  // Extract shared media from group messages
  const mediaItems = useMemo(() => {
    return groupMessages.filter(m => Boolean(m.media_url) && !m.deleted_for_everyone);
  }, [groupMessages]);

  const filteredMedia = useMemo(() => {
    if (mediaFilter === 'all') return mediaItems;
    return mediaItems.filter(m => m.media_type === mediaFilter);
  }, [mediaItems, mediaFilter]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    const list = group.member_ids.map(mid => {
      const u = allUsers.find(user => user.id === mid) || {
        id: mid,
        full_name: 'Believer Member',
        phone: '',
        role: 'member',
        is_verified: false,
        member_id: mid
      } as User;
      const isAdmin = (group.admin_ids || [group.created_by]).includes(mid) || u.role === 'super_admin' || u.role === 'developer';
      const isCreator = mid === group.created_by;
      return { user: u, isAdmin, isCreator };
    });

    return list.filter(({ user, isAdmin }) => {
      if (memberRoleFilter === 'admins' && !isAdmin) return false;
      if (memberRoleFilter === 'members' && isAdmin) return false;
      if (!memberSearch.trim()) return true;
      const q = memberSearch.toLowerCase();
      return (
        user.full_name.toLowerCase().includes(q) ||
        (user.handle && user.handle.toLowerCase().includes(q)) ||
        (user.phone && user.phone.includes(q)) ||
        (user.role && user.role.toLowerCase().includes(q))
      );
    }).sort((a, b) => {
      if (a.isCreator) return -1;
      if (b.isCreator) return 1;
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      return a.user.full_name.localeCompare(b.user.full_name);
    });
  }, [group, allUsers, memberSearch, memberRoleFilter]);

  // Compute number of members currently active / online in this group
  const onlineMembersCount = useMemo(() => {
    return group.member_ids.reduce((acc, mid) => {
      if (mid === currentUser.id) return acc + 1;
      const u = allUsers.find(user => user.id === mid);
      if (u) {
        const lastSeen = StorageService.getUserLastSeen(u);
        if (lastSeen.toLowerCase() === 'online') return acc + 1;
      }
      return acc;
    }, 0);
  }, [group.member_ids, allUsers, currentUser.id]);

  if (!isOpen) return null;

  // Handle uploading custom group icon from user's device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const rawDataUrl = reader.result;
        compressImage(rawDataUrl, 512, 512).then((compressedUrl) => {
          StorageService.updateGroupSettings(group.id, { avatar_url: compressedUrl });
          onUpdateGroup();
          setShowIconPicker(false);
          setIconUpdateSuccess('Group icon updated successfully!');
          try {
            confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
          } catch {}
          setTimeout(() => setIconUpdateSuccess(null), 3500);
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle choosing preset icon
  const handleSelectPreset = (url: string) => {
    StorageService.updateGroupSettings(group.id, { avatar_url: url });
    onUpdateGroup();
    setShowIconPicker(false);
    setIconUpdateSuccess('Group icon updated!');
    try {
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
    } catch {}
    setTimeout(() => setIconUpdateSuccess(null), 3000);
  };

  // Remove icon and revert to initials
  const handleRemoveIcon = () => {
    StorageService.updateGroupSettings(group.id, { avatar_url: '' });
    onUpdateGroup();
    setShowIconPicker(false);
    setIconUpdateSuccess('Group icon removed.');
    setTimeout(() => setIconUpdateSuccess(null), 3000);
  };

  // Toggle group mute
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    try {
      if (next) localStorage.setItem(`gcz_mute_group_${group.id}`, 'true');
      else localStorage.removeItem(`gcz_mute_group_${group.id}`);
    } catch {}
  };

  // Save edited details
  const handleSaveDetails = () => {
    if (!editName.trim()) return;
    StorageService.updateGroupInfo(group.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      category: editCategory as any
    });
    onUpdateGroup();
    setIsEditingDetails(false);
    setIconUpdateSuccess('Group details updated!');
    setTimeout(() => setIconUpdateSuccess(null), 3000);
  };

  return (
    <div 
      className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card border-0 sm:border border-border/80 rounded-t-[28px] sm:rounded-[28px] w-full max-w-lg h-[92vh] sm:h-auto sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-card-foreground animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden file input for changing group icon */}
        <input 
          ref={iconFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Top Header Bar (Sticky) */}
        <div className="h-14 px-3 sm:px-4 border-b border-border/70 flex items-center justify-between shrink-0 bg-card/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-bold text-sm tracking-tight text-foreground truncate">
                Group Info
              </h3>
              {/* Visual Online Indicator in Group Information Header */}
              <div 
                id="group-info-header-online-indicator"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold shrink-0 shadow-2xs"
                title={`${onlineMembersCount} member(s) currently active in this group`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{onlineMembersCount} Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {iconUpdateSuccess && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 animate-fade-in">
                {iconUpdateSuccess}
              </span>
            )}
            {isGroupAdmin && !isEditingDetails && (
              <button
                type="button"
                onClick={() => {
                  setEditName(group.name);
                  setEditDesc(group.description);
                  setEditCategory(group.category || 'General');
                  setIsEditingDetails(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center gap-1 border border-border transition-colors cursor-pointer"
                title="Edit Group Title & Description"
              >
                <Edit3 className="w-3.5 h-3.5 text-primary" />
                <span>Edit</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Container (Instagram Profile style) */}
        <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-border/60 scrollbar-thin">
          
          {/* ========================================================================= */}
          {/* 1. INSTAGRAM PROFILE HERO SECTION */}
          {/* ========================================================================= */}
          <div className="relative pt-6 pb-5 px-5 flex flex-col items-center text-center bg-gradient-to-b from-primary/5 via-card to-card">
            
            {/* Instagram Profile Avatar with Story-Ring & Camera Change Badge */}
            <div className="relative mb-2 group/avatar">
              <div className="p-1 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-400 shadow-md">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-secondary border-2 border-card flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-primary shadow-inner">
                  {group.avatar_url ? (
                    <img 
                      src={group.avatar_url} 
                      alt={group.name} 
                      className="w-full h-full object-cover group-hover/avatar:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-card flex items-center justify-center font-black tracking-tight text-primary">
                      {group.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* CHANGE GROUP ICON BADGE ON AVATAR */}
              <button
                type="button"
                onClick={() => setShowIconPicker(true)}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg border-2 border-card flex items-center justify-center cursor-pointer transition-all active:scale-90 hover:scale-105"
                title="Edit Group Icon"
                aria-label="Edit Group Icon"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* PROMINENT 'EDIT GROUP ICON' BUTTON */}
            <button
              type="button"
              onClick={() => setShowIconPicker(true)}
              className="mt-1 mb-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold shadow-xs hover:border-primary/50 transition-all cursor-pointer active:scale-95"
              title="Edit Group Icon"
            >
              <Camera className="w-3.5 h-3.5 text-primary" />
              <span>Edit Group Icon</span>
            </button>

            {/* Group Title & Badges */}
            {isEditingDetails ? (
              <div className="w-full mt-2 p-3.5 rounded-2xl bg-secondary/50 border border-border space-y-3 text-left animate-in fade-in-50">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. Ignite Youth Fellowship"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Description & Purpose
                  </label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary leading-relaxed"
                    placeholder="Describe group fellowship purpose..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Fellowship Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="General">General Fellowship</option>
                    <option value="Worship">Worship & Prayer</option>
                    <option value="Men">Men of Valour</option>
                    <option value="Women">Women of Grace</option>
                    <option value="Youth">Youth OnFire</option>
                    <option value="School">Foundation School</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingDetails(false)}
                    className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDetails}
                    className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                    {group.name}
                  </h2>
                  <span title="Official Church Group" className="text-primary inline-flex">
                    <CheckCircle2 className="w-4 h-4 fill-primary text-card" />
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                  {/* Group Active Online Indicator Badge */}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/25 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>{onlineMembersCount} {onlineMembersCount === 1 ? 'member' : 'members'} online</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                    {group.category || 'General Fellowship'}
                  </span>
                  {group.is_paid && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/25 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      <span>${group.price_usd || 150} / 3-Month Term</span>
                    </span>
                  )}
                  {group.id === 'group_foundation_school' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/25 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      <span>Discipleship School</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-2.5 max-w-sm leading-relaxed whitespace-pre-wrap">
                  {group.description || 'Welcome to this Gateway Church fellowship. Encouraging one another daily in prayer, faith, and apostolic grace.'}
                </p>
              </>
            )}

            {/* Instagram-style 3-Metric Stats Row */}
            <div className="w-full max-w-md mt-4 grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-secondary/40 border border-border/80">
              <div className="text-center">
                <span className="block text-base sm:text-lg font-extrabold text-foreground">
                  {group.member_ids.length}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Members
                </span>
              </div>
              <div className="text-center border-x border-border/70">
                <span className="block text-base sm:text-lg font-extrabold text-primary">
                  {(group.admin_ids || [group.created_by]).length}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Admins
                </span>
              </div>
              <div className="text-center">
                <span className="block text-base sm:text-lg font-extrabold text-foreground">
                  {mediaItems.length}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Media
                </span>
              </div>
            </div>

            {/* WhatsApp / Instagram Action Bar */}
            <div className="w-full max-w-md mt-4 flex items-center justify-center gap-2">
              {/* Message / Back to Chat */}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-98 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>

              {/* Edit Group Icon Button */}
              <button
                type="button"
                onClick={() => setShowIconPicker(true)}
                className="py-2 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Edit Group Icon"
              >
                <Camera className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Edit Icon</span>
              </button>

              {/* Share / Copy Link */}
              <button
                type="button"
                onClick={() => onCopyInviteLink(group.invite_code)}
                className="py-2 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Copy Group Invite Link"
              >
                <Share2 className="w-3.5 h-3.5 text-primary" />
                <span className="hidden xs:inline">Invite</span>
              </button>

              {/* Add Member */}
              {(isUserMember || isGroupAdmin) && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddMember();
                  }}
                  className="py-2 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Add Member"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden xs:inline">Add</span>
                </button>
              )}

              {/* Mute Toggle */}
              <button
                type="button"
                onClick={handleToggleMute}
                className={`py-2 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isMuted 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                    : 'bg-secondary hover:bg-secondary/80 border-border text-foreground'
                }`}
                title={isMuted ? 'Unmute Group' : 'Mute Notifications'}
              >
                {isMuted ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
              </button>

              {/* Pin Group */}
              <button
                type="button"
                onClick={() => {
                  StorageService.togglePinChatGroup(group.id, currentUser.id);
                  onUpdateGroup();
                }}
                className={`py-2 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isGroupPinned 
                    ? 'bg-primary/15 border-primary text-primary' 
                    : 'bg-secondary hover:bg-secondary/80 border-border text-foreground'
                }`}
                title={isGroupPinned ? 'Unpin Group' : 'Pin Group to Top'}
              >
                <Pin className={`w-3.5 h-3.5 ${isGroupPinned ? 'fill-primary' : ''}`} />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. INSTAGRAM-STYLE SEGMENTED TABS (Members | Media | Settings) */}
          {/* ========================================================================= */}
          <div className="sticky top-0 bg-card z-10 border-b border-border/80 px-4">
            <div className="grid grid-cols-3">
              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className={`py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                  activeTab === 'members'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Members ({group.member_ids.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('media')}
                className={`py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                  activeTab === 'media'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Media ({mediaItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: MEMBERS LIST WITH SEARCH & INSTANT DM */}
          {/* ========================================================================= */}
          {activeTab === 'members' && (
            <div className="p-4 space-y-3">
              
              {/* Search & Role Filter Pills */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members by name, phone or handle..."
                    className="w-full bg-secondary/60 border border-border/80 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  {memberSearch && (
                    <button
                      type="button"
                      onClick={() => setMemberSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMemberRoleFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        memberRoleFilter === 'all'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      All ({group.member_ids.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberRoleFilter('admins')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        memberRoleFilter === 'admins'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Admins ({(group.admin_ids || [group.created_by]).length})
                    </button>
                  </div>

                  {(isUserMember || isGroupAdmin) && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAddMember();
                      }}
                      className="text-xs text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Member</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Members List with User Avatars */}
              <div className="divide-y divide-border/60 max-h-[46vh] sm:max-h-[50vh] overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
                {filteredMembers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No members match "{memberSearch}"
                  </div>
                ) : (
                  filteredMembers.map(({ user, isAdmin, isCreator }) => {
                    const isSelf = user.id === currentUser.id;
                    const userStatus = StorageService.getUserLastSeen(user);
                    const isOnline = isSelf || userStatus.toLowerCase() === 'online';

                    return (
                      <div 
                        key={user.id} 
                        className="py-2.5 px-1.5 flex items-center justify-between gap-3 hover:bg-secondary/30 rounded-xl transition-colors"
                      >
                        {/* Avatar & User Details */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-full border border-border/80 overflow-visible flex items-center justify-center text-xs font-bold shrink-0 shadow-xs relative">
                            <div className="w-full h-full rounded-full overflow-hidden">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${getAvatarGradient(user.full_name)} text-white flex items-center justify-center font-bold text-xs`}>
                                  {user.full_name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            {/* Online / Active status green dot */}
                            {isOnline && (
                              <span 
                                title="Active Now" 
                                className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card ring-1 ring-black/10 shadow-xs" 
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-foreground truncate block">
                                {user.full_name}
                              </span>
                              {isOnline && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                  <span>Online</span>
                                </span>
                              )}
                              {isSelf && (
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  (You)
                                </span>
                              )}
                              {isCreator && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold">
                                  Leader
                                </span>
                              )}
                              {isAdmin && !isCreator && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-primary/15 text-primary border border-primary/25 font-bold">
                                  Admin
                                </span>
                              )}
                              {user.role === 'super_admin' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-primary/10 text-primary font-bold border border-primary/20">
                                  Apostle ✦
                                </span>
                              )}
                              {user.role === 'developer' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                                  Dev 🛡️
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {user.handle || (user.phone ? user.phone : 'Gateway Believer')}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons: Instant Direct Message & Admin Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* 1-click Direct Message Button */}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onDirectMessageUser(user);
                              }}
                              className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors cursor-pointer"
                              title={`Message ${user.full_name}`}
                              aria-label={`Message ${user.full_name}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Admin Actions (Promote / Dismiss / Remove) */}
                          {(isDeveloper || (isGroupAdmin && !isSelf && !isCreator)) && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  StorageService.togglePromoteGroupAdmin(group.id, user.id);
                                  onUpdateGroup();
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                  isAdmin
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                                    : 'bg-primary/10 text-primary border-primary/25 hover:bg-primary/20'
                                }`}
                                title={isAdmin ? 'Dismiss as Admin' : 'Promote to Admin'}
                              >
                                {isAdmin ? 'Dismiss' : 'Promote'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Remove ${user.full_name} from ${group.name}?`)) {
                                    StorageService.removeMemberFromGroup(group.id, user.id, currentUser.id);
                                    onUpdateGroup();
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/25 transition-colors cursor-pointer"
                                title="Remove member"
                                aria-label="Remove member"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: WHATSAPP-STYLE MEDIA, LINKS & DOCS GALLERY */}
          {/* ========================================================================= */}
          {activeTab === 'media' && (
            <div className="p-4 space-y-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {(['all', 'image', 'video', 'audio', 'document'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMediaFilter(t)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                      mediaFilter === t
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t === 'all' ? `All (${mediaItems.length})` : t}
                  </button>
                ))}
              </div>

              {filteredMedia.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="font-semibold text-foreground">No media shared yet</p>
                  <p>Photos, videos, audio notes and documents shared in the chat will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {filteredMedia.map((m) => {
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (onPreviewMedia && m.media_url) {
                            onPreviewMedia({
                              url: m.media_url,
                              type: m.media_type,
                              caption: m.text !== 'Shared a photo' ? m.text : undefined,
                              sender_name: m.sender_name,
                              created_at: m.created_at
                            });
                          }
                        }}
                        className="aspect-square rounded-xl overflow-hidden bg-secondary border border-border/80 relative group cursor-pointer"
                      >
                        {m.media_type === 'video' ? (
                          <div className="w-full h-full bg-black/90 flex items-center justify-center">
                            <Video className="w-6 h-6 text-white" />
                          </div>
                        ) : m.media_type === 'audio' ? (
                          <div className="w-full h-full bg-secondary p-2 flex flex-col items-center justify-center text-center">
                            <Music className="w-6 h-6 text-primary mb-1" />
                            <span className="text-[9px] text-muted-foreground line-clamp-1">Voice note</span>
                          </div>
                        ) : m.media_type === 'document' ? (
                          <div className="w-full h-full bg-secondary p-2 flex flex-col items-center justify-center text-center">
                            <FileText className="w-6 h-6 text-primary mb-1" />
                            <span className="text-[9px] text-muted-foreground line-clamp-1">{m.text.replace(/^Shared a document:\s*/, '') || 'Doc'}</span>
                          </div>
                        ) : (
                          <img
                            src={m.media_url}
                            alt="Shared Media"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                          <span className="text-[9px] text-white truncate font-medium">
                            {m.sender_name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SETTINGS, SECURITY & DISSOLVE CONTROLS */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="p-4 space-y-4">
              
              {/* Admin Permissions Controls */}
              {isGroupAdmin ? (
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border space-y-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5" />
                    <span>WhatsApp Group Permissions</span>
                  </div>

                  {/* Only Admins Post Messages */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-foreground font-semibold block">Send Messages</span>
                      <span className="text-[10px] text-muted-foreground">
                        {group.only_admins_can_send_messages ? 'Only admins can send messages' : 'All members can send messages'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        StorageService.updateGroupSettings(group.id, {
                          only_admins_can_send_messages: !group.only_admins_can_send_messages
                        });
                        onUpdateGroup();
                      }}
                      className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                        group.only_admins_can_send_messages ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span className={`block w-4 h-4 rounded-full bg-background shadow transition-transform ${
                        group.only_admins_can_send_messages ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Only Admins Add Members */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                    <div>
                      <span className="text-foreground font-semibold block">Add Members</span>
                      <span className="text-[10px] text-muted-foreground">
                        {group.only_admins_can_add_members ? 'Only admins can add believers' : 'All members can add believers'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        StorageService.updateGroupSettings(group.id, {
                          only_admins_can_add_members: !group.only_admins_can_add_members
                        });
                        onUpdateGroup();
                      }}
                      className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                        group.only_admins_can_add_members ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span className={`block w-4 h-4 rounded-full bg-background shadow transition-transform ${
                        group.only_admins_can_add_members ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Reset Invite Link */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                    <div className="pr-2">
                      <span className="text-foreground font-semibold block">Reset Invite Link</span>
                      <span className="text-[10px] text-muted-foreground">Immediately revoke previous links</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const res = StorageService.resetGroupInviteCode(group.id);
                        if (res.success) {
                          onUpdateGroup();
                          alert(`Invite link reset! New code: ${res.newCode}. Previous links can no longer be used.`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold cursor-pointer transition-colors"
                    >
                      Reset Link
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border text-xs text-muted-foreground">
                  <p>Group permissions are managed by fellowship administrators.</p>
                </div>
              )}

              {/* Group Meta Info */}
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground">Leader</span>
                  <span className="font-semibold text-foreground truncate block">{group.creator_name}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground">Category</span>
                  <span className="font-semibold text-primary truncate block">{group.category || 'General'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground">Invite Code</span>
                  <span className="font-mono font-semibold text-foreground truncate block">{group.invite_code}</span>
                </div>
                {group.is_paid && (
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Term Membership</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400 truncate block">${group.price_usd || 150}</span>
                  </div>
                )}
              </div>

              {/* Admin & Developer Dissolve Group Controls */}
              {(isDeveloper || isSuperAdmin || currentUser.role === 'admin') && (
                <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/40 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Administrative Controls
                    </span>
                    <span className="text-[9px] text-red-300 font-mono px-1.5 py-0.5 rounded bg-red-900/50">
                      {isDeveloper ? 'Developer' : 'Admin'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`ADMIN / DEV ACTION: Permanently DELETE and DISSOLVE "${group.name}"? This will dissolve the fellowship, wipe messages, and cancel active memberships.`)) {
                        StorageService.deleteChatGroup(group.id);
                        onClose();
                        onUpdateGroup();
                        alert(`Group "${group.name}" has been dissolved.`);
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete & Dissolve Group</span>
                  </button>
                </div>
              )}

              {/* Clear Chat & Exit Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onClearChat();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  <span>Clear Chat History from Device</span>
                </button>

                {isUserMember && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onExitGroup();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 border border-destructive/25 text-destructive font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit Group Fellowship</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* POPUP MODAL: EDIT GROUP ICON (Upload or Select Church Presets) */}
        {/* ========================================================================= */}
        {showIconPicker && (
          <div 
            className="fixed inset-0 z-70 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setShowIconPicker(false)}
          >
            <div 
              className="bg-card border border-border/80 rounded-3xl w-full max-w-md p-5 shadow-2xl overflow-hidden text-card-foreground animate-in zoom-in-95 duration-150 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      Edit Group Icon
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      Upload photo or choose ministry avatar
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Option 1: Drag-and-drop or Click Upload from Device */}
              <div className="space-y-2">
                <div 
                  onClick={() => iconFileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/30 hover:border-primary/80 bg-primary/5 hover:bg-primary/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group active:scale-98"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Upload from Device</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Click or drag a picture (PNG, JPG, WEBP, GIF)</span>
                </div>

                <button
                  type="button"
                  onClick={() => iconFileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Choose Photo from Device</span>
                </button>
              </div>

              {/* Option 2: Choose from Apostolic & Ministry Presets */}
              <div className="space-y-2 pt-1">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Or Choose Ministry Preset Icon
                </span>
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_ICONS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      className="flex flex-col items-center gap-1 group/preset cursor-pointer"
                      title={preset.name}
                    >
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-border group-hover/preset:border-primary group-hover/preset:scale-105 transition-all shadow-xs">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center group-hover/preset:text-foreground">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 3: Remove custom icon */}
              {group.avatar_url && (
                <div className="pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={handleRemoveIcon}
                    className="w-full py-2 px-3 rounded-xl bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Custom Icon (Use Initials)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
