import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Grid3X3, 
  Bookmark, 
  Tag, 
  UserPlus, 
  UserCheck, 
  Send, 
  Share2, 
  Link as LinkIcon, 
  MapPin, 
  Sparkles, 
  Check, 
  X,
  Heart,
  MessageCircle,
  Camera,
  Edit3,
  Plus,
  QrCode,
  Users,
  LogOut,
  Sun,
  Moon,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award,
  Phone,
  Play,
  Copy
} from 'lucide-react';
import { User, Testimony, DirectMessage, PostComment } from '../../types';
import { StorageService } from '../../services/storageService';
import { INITIAL_USERS } from '../../data/mockData';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { ImagePickerModal } from './ImagePickerModal';
import confetti from 'canvas-confetti';

interface StoryHighlight {
  id: string;
  title: string;
  img: string;
  type?: 'event' | 'sermon' | 'worship' | 'miracle';
  eventName?: string;
  snippetText?: string;
  scriptureRef?: string;
  date?: string;
}

const DEFAULT_HIGHLIGHTS: StoryHighlight[] = [
  { 
    id: 'h1', 
    title: 'Miracles \'26', 
    img: '/assets/apostle_joe_daniels_main.jpg',
    type: 'event',
    eventName: 'Harare National Miracle Crusade',
    snippetText: 'Apostle Joe Daniels: "Every delayed promise in your life is receiving supernatural acceleration by covenant power!"',
    scriptureRef: 'Habakkuk 2:3',
    date: 'March 2026'
  },
  { 
    id: 'h2', 
    title: 'Altar Fire', 
    img: '/assets/apostle_joe_daniels_preach.jpg',
    type: 'sermon',
    eventName: 'Annual Fire Impartation Conference',
    snippetText: 'Apostle Joe Daniels: "When your secret prayer altar catches fire, no force of darkness can withstand your public dominion."',
    scriptureRef: 'Leviticus 6:13',
    date: 'February 2026'
  },
  { 
    id: 'h3', 
    title: 'Cathedral', 
    img: 'https://images.unsplash.com/photo-1548625361-195972ebca88?w=600&auto=format&fit=crop&q=80',
    type: 'event',
    eventName: 'Cathedral of Faith Groundbreaking',
    snippetText: 'Apostle Joe Daniels: "The glory of this latter sanctuary will surpass the former. We are building for generations across Africa."',
    scriptureRef: 'Haggai 2:9',
    date: 'January 2026'
  },
  { 
    id: 'h4', 
    title: 'Rhema Speed', 
    img: '/assets/apostle_joe_daniels_podcast.jpg',
    type: 'sermon',
    eventName: 'Supernatural Acceleration Service',
    snippetText: 'Apostle Joe Daniels: "Grace compresses time. What would normally take a decade, God is releasing in months."',
    scriptureRef: 'Amos 9:13',
    date: 'March 2026'
  },
  { 
    id: 'h5', 
    title: 'Praise Night', 
    img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    type: 'worship',
    eventName: 'Gateway Worship Live Recording',
    snippetText: 'Gateway Praise Choir: "When praises rise from consecrated hearts, miracles overflow in the sanctuary."',
    scriptureRef: 'Psalm 149:3',
    date: 'December 2025'
  },
  { 
    id: 'h6', 
    title: 'Youth Blaze', 
    img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
    type: 'event',
    eventName: 'Campus Apostolic Movement',
    snippetText: 'Apostle Joe Daniels: "The youth of Zimbabwe are rising with purity, wisdom, and miraculous power to transform Africa!"',
    scriptureRef: 'Joel 2:28',
    date: 'November 2025'
  }
];

const RHEMA_SCRIPTURE_DETAILS: Record<string, { text: string; category: string; theme: string }> = {
  'Romans 8:28': {
    text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    category: 'Covenant Promise',
    theme: 'Divine Purpose'
  },
  'Isaiah 40:31': {
    text: 'Those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
    category: 'Supernatural Speed',
    theme: 'Renewed Strength'
  },
  'Psalms 23:1': {
    text: 'The LORD is my shepherd; I shall not want. He makes me lie down in green pastures, he leads me beside quiet waters.',
    category: 'Divine Peace',
    theme: 'Covenant Provision'
  },
  'Habakkuk 2:2-3': {
    text: 'Write the vision and make it plain on tablets... For the revelation awaits an appointed time; it speaks of the end and will not prove false.',
    category: 'Apostolic Rhema',
    theme: 'Appointed Speed'
  },
  'Philippians 4:13': {
    text: 'I can do all this through Christ who gives me strength.',
    category: 'Dominion & Grace',
    theme: 'Kingdom Authority'
  },
  'Jeremiah 29:11': {
    text: 'For I know the plans I have for you," declares the LORD, "plans to prosper you and not to harm you, plans to give you hope and a future.',
    category: 'Covenant Promise',
    theme: 'Prophetic Future'
  },
  'John 1:1': {
    text: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
    category: 'Living Rhema',
    theme: 'Eternal Truth'
  },
  'Matthew 6:33': {
    text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.',
    category: 'Kingdom First',
    theme: 'Supernatural Overflow'
  }
};

interface InstagramProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDirectChat?: (targetUserId: string) => void;
  onSelectPost?: (post: Testimony) => void;
  onUpdateUser?: (updated: User) => void;
  onLogout?: () => void;
}

export const InstagramProfileModal: React.FC<InstagramProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
  onOpenDirectChat,
  onSelectPost,
  onUpdateUser,
  onLogout
}) => {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Testimony[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [followersUsers, setFollowersUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'testimonies' | 'saved_verses' | 'tagged'>('testimonies');
  const [savedVersesList, setSavedVersesList] = useState<string[]>(() => StorageService.getSavedVerses());
  
  // Direct Message Drawer State
  const [showDmDrawer, setShowDmDrawer] = useState<boolean>(false);
  const [dmList, setDmList] = useState<DirectMessage[]>([]);
  const [dmInputText, setDmInputText] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showProfileToast, setShowProfileToast] = useState<string | null>(null);

  // Edit Profile Drawer State
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editHandle, setEditHandle] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [editWebsite, setEditWebsite] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');
  const [showImagePickerModal, setShowImagePickerModal] = useState<boolean>(false);
  const [imagePickerPurpose, setImagePickerPurpose] = useState<'avatar' | 'highlight'>('avatar');

  // Story Highlights State & Story Viewer - strictly real user highlights only
  const [storyHighlights, setStoryHighlights] = useState<StoryHighlight[]>(() => {
    try {
      const saved = localStorage.getItem('gcz_story_highlights_custom');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeStoryHighlight, setActiveStoryHighlight] = useState<StoryHighlight | null>(null);
  const [storyProgress, setStoryProgress] = useState<number>(0);
  const [showAddHighlightModal, setShowAddHighlightModal] = useState<boolean>(false);
  const [newHighlightTitle, setNewHighlightTitle] = useState<string>('');
  const [newHighlightImg, setNewHighlightImg] = useState<string>('');

  // 3-dots Profile Options Sheet
  const [showProfileOptions, setShowProfileOptions] = useState<boolean>(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState<boolean>(false);
  const [showMemberIdCard, setShowMemberIdCard] = useState<boolean>(false);
  const [copiedMemberId, setCopiedMemberId] = useState<boolean>(false);

  // Post Detail Modal (Instagram view on click)
  const [activeDetailPost, setActiveDetailPost] = useState<Testimony | null>(null);
  const [detailPostLiked, setDetailPostLiked] = useState<boolean>(false);
  const [detailPostLikesCount, setDetailPostLikesCount] = useState<number>(0);
  const [detailPostComments, setDetailPostComments] = useState<PostComment[]>([]);
  const [detailCommentText, setDetailCommentText] = useState<string>('');
  const [isPostSavedState, setIsPostSavedState] = useState<boolean>(false);

  // Accurate Followers / Following List Viewer
  const [showFollowsListModal, setShowFollowsListModal] = useState<'followers' | 'following' | null>(null);
  const [followsUsersList, setFollowsUsersList] = useState<User[]>([]);
  const [followsSearchQuery, setFollowsSearchQuery] = useState<string>('');
  const [profileHistory, setProfileHistory] = useState<string[]>([]);

  const currentUser = StorageService.getCurrentUser() || StorageService.getAllUsers()[0];
  const isMe = Boolean(
    currentUser &&
    profileUser &&
    (currentUser.id === profileUser.id || currentUser.phone === profileUser.phone)
  );

  const triggerToast = (msg: string) => {
    setShowProfileToast(msg);
    setTimeout(() => setShowProfileToast(null), 2800);
  };

  // Story Timer
  useEffect(() => {
    if (!activeStoryHighlight) {
      setStoryProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          setActiveStoryHighlight(null);
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [activeStoryHighlight]);

  const navigateToProfile = (targetUser: User) => {
    if (profileUser && profileUser.id !== targetUser.id) {
      setProfileHistory((prev) => [...prev, profileUser.id]);
    }
    setProfileUser(targetUser);
    setShowFollowsListModal(null);
    setShowDmDrawer(false);
    setShowEditProfile(false);
    setActiveDetailPost(null);
  };

  const handleBack = () => {
    if (activeStoryHighlight) {
      setActiveStoryHighlight(null);
      return;
    }
    if (activeDetailPost) {
      setActiveDetailPost(null);
      return;
    }
    if (showMemberIdCard) {
      setShowMemberIdCard(false);
      return;
    }
    if (showEditProfile) {
      setShowEditProfile(false);
      return;
    }
    if (showFollowsListModal) {
      setShowFollowsListModal(null);
      return;
    }
    if (showDmDrawer) {
      setShowDmDrawer(false);
      return;
    }
    if (profileHistory.length > 0) {
      const prevId = profileHistory[profileHistory.length - 1];
      setProfileHistory((prev) => prev.slice(0, prev.length - 1));
      const allUsers = StorageService.getAllUsers();
      const prevUser = allUsers.find((u) => u.id === prevId || u.phone === prevId);
      if (prevUser) {
        setProfileUser(prevUser);
        return;
      }
    }
    onClose();
  };

  const handleClose = () => {
    if (activeStoryHighlight) {
      setActiveStoryHighlight(null);
      return;
    }
    if (activeDetailPost) {
      setActiveDetailPost(null);
      return;
    }
    if (showMemberIdCard) {
      setShowMemberIdCard(false);
      return;
    }
    if (showEditProfile) {
      setShowEditProfile(false);
      return;
    }
    if (showFollowsListModal) {
      setShowFollowsListModal(null);
      return;
    }
    if (showDmDrawer) {
      setShowDmDrawer(false);
      return;
    }
    if (profileHistory.length > 0) {
      const prevId = profileHistory[profileHistory.length - 1];
      setProfileHistory((prev) => prev.slice(0, prev.length - 1));
      const allUsers = StorageService.getAllUsers();
      const prevUser = allUsers.find((u) => u.id === prevId || u.phone === prevId);
      if (prevUser) {
        setProfileUser(prevUser);
        return;
      }
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryHighlight, activeDetailPost, showMemberIdCard, showEditProfile, showFollowsListModal, showDmDrawer, profileHistory]);

  const loadUserData = (targetUserId: string) => {
    const allUsers = StorageService.getAllUsers();
    let found = allUsers.find((u) =>
      u.id === targetUserId ||
      u.phone === targetUserId ||
      u.handle === targetUserId ||
      u.handle?.toLowerCase() === targetUserId.toLowerCase() ||
      u.full_name.toLowerCase() === targetUserId.toLowerCase()
    );

    if (!found) {
      found = INITIAL_USERS.find((u) =>
        u.id === targetUserId ||
        u.handle?.toLowerCase() === targetUserId.toLowerCase() ||
        u.full_name.toLowerCase().includes(targetUserId.toLowerCase())
      );
    }

    if (!found) {
      found = {
        id: targetUserId,
        full_name: targetUserId.replace(/[@_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        handle: targetUserId.startsWith('@') ? targetUserId : `@${targetUserId}`,
        phone: '+263770000000',
        role: 'member',
        member_id: `GCZ-${Math.floor(1000 + Math.random() * 9000)}`,
        is_verified: true,
        badge_type: 'silver',
        bio: 'Believer walking in covenant faith & supernatural acceleration at Gateway International Church.',
        location: 'Harare, Zimbabwe',
        created_at: new Date().toISOString(),
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
      };
    }

    setProfileUser(found);

    // Follow status
    const following = StorageService.isFollowingUser(currentUser.id, found.id);
    setIsFollowing(following);
    setFollowersCount(StorageService.getUserFollowersCount(found.id));
    setFollowingCount(StorageService.getUserFollowingCount(found.id));
    setFollowersUsers(StorageService.getFollowersUsers(found.id));

    // User Posts
    const allTestimonies = StorageService.getTestimonies();
    const matches = allTestimonies.filter((t) =>
      (t.user_id && t.user_id === found?.id) ||
      (t.user_handle && t.user_handle.toLowerCase() === found?.handle?.toLowerCase()) ||
      t.user_name.toLowerCase().includes(found?.full_name.toLowerCase() || '___')
    );

    if (matches.length === 0) {
      setUserPosts(allTestimonies.slice(0, 6));
    } else {
      setUserPosts(matches);
    }

    // Load DMs
    setDmList(StorageService.getDirectMessages(currentUser.id, found.id));
  };

  useEffect(() => {
    if (!isOpen || !userId) {
      setProfileUser(null);
      setShowDmDrawer(false);
      setShowFollowsListModal(null);
      setShowEditProfile(false);
      setActiveDetailPost(null);
      setActiveStoryHighlight(null);
      setProfileHistory([]);
      return;
    }
    loadUserData(userId);
  }, [isOpen, userId]);

  // Real-time listener for profile updates anywhere in the app
  useEffect(() => {
    const handleProfileUpdatedEvent = (e: any) => {
      const updatedUser: User | undefined = e?.detail?.user || e?.detail;
      if (updatedUser && profileUser && (updatedUser.id === profileUser.id || updatedUser.phone === profileUser.phone)) {
        setProfileUser(updatedUser);
      }
    };
    window.addEventListener('gcz_user_profile_updated', handleProfileUpdatedEvent);
    return () => window.removeEventListener('gcz_user_profile_updated', handleProfileUpdatedEvent);
  }, [profileUser]);

  useEffect(() => {
    const handleFollowChange = () => {
      if (profileUser) {
        setIsFollowing(StorageService.isFollowingUser(currentUser.id, profileUser.id));
        setFollowersCount(StorageService.getUserFollowersCount(profileUser.id));
        setFollowingCount(StorageService.getUserFollowingCount(profileUser.id));
      }
    };
    window.addEventListener('gcz_follow_updated', handleFollowChange);
    return () => window.removeEventListener('gcz_follow_updated', handleFollowChange);
  }, [profileUser, currentUser.id]);

  useEffect(() => {
    if (!profileUser || !showFollowsListModal) return;
    if (showFollowsListModal === 'followers') {
      const list = StorageService.getFollowersUsers(profileUser.id);
      setFollowsUsersList(list);
    } else {
      const list = StorageService.getFollowingUsers(profileUser.id);
      setFollowsUsersList(list);
    }
  }, [showFollowsListModal, profileUser?.id, followersCount, followingCount]);

  if (!isOpen || !profileUser) return null;

  const handleToggleFollow = () => {
    const result = StorageService.toggleFollowUser(profileUser.id);
    setIsFollowing(result.isFollowing);
    setFollowersCount(StorageService.getUserFollowersCount(profileUser.id));
    setFollowingCount(StorageService.getUserFollowingCount(profileUser.id));

    if (result.blocked) {
      triggerToast(result.reason || 'Foundational Super Admins and Platform Developers cannot be unfollowed.');
      return;
    }

    if (result.isFollowing) {
      confetti({
        particleCount: 35,
        spread: 70,
        origin: { y: 0.6 }
      });
      triggerToast(`Now following ${profileUser.full_name}!`);
    } else {
      triggerToast(`Unfollowed ${profileUser.full_name}`);
    }

    window.dispatchEvent(
      new CustomEvent('gcz_follow_updated', {
        detail: { followerId: currentUser.id, targetUserId: profileUser.id, isFollowing: result.isFollowing }
      })
    );
  };

  const handleSendDm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmInputText.trim()) return;
    const msg = StorageService.sendDirectMessage(currentUser.id, profileUser.id, dmInputText.trim());
    setDmList((prev) => [...prev, msg]);
    setDmInputText('');
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}?profile=${profileUser.handle || profileUser.id}`;
    const shareText = `Connect with ${profileUser.full_name} (${profileUser.handle || '@gateway_member'}) on Gateway International Church:\n${profileUrl}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
    }
    triggerToast('Profile link copied! Opening WhatsApp...');
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleCopyLink = () => {
    const profileUrl = `${window.location.origin}?profile=${profileUser.handle || profileUser.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
    }
    setCopiedLink(true);
    triggerToast('Profile link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMemberId = () => {
    if (navigator.clipboard && profileUser.member_id) {
      navigator.clipboard.writeText(profileUser.member_id);
    }
    setCopiedMemberId(true);
    triggerToast('Member ID copied to clipboard!');
    setTimeout(() => setCopiedMemberId(false), 2000);
  };

  const handleOpenEditProfile = () => {
    setEditFullName(profileUser.full_name || '');
    setEditHandle(profileUser.handle || `@${profileUser.full_name.toLowerCase().replace(/\s+/g, '_')}`);
    setEditBio(profileUser.bio || '');
    setEditLocation(profileUser.location || 'Harare, Zimbabwe');
    setEditWebsite((profileUser as any).website || 'gatewayconnect.church/partner');
    setEditPhone(profileUser.phone || '');
    setEditAvatarUrl(profileUser.avatar_url || '');
    setShowEditProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedHandle = editHandle.trim().startsWith('@') 
      ? editHandle.trim() 
      : `@${editHandle.trim()}`;

    const updated = StorageService.updateUserProfile({
      full_name: editFullName.trim() || profileUser.full_name,
      handle: formattedHandle || profileUser.handle,
      bio: editBio.trim() || profileUser.bio,
      location: editLocation.trim() || profileUser.location,
      avatar_url: editAvatarUrl || profileUser.avatar_url,
      phone: editPhone.trim() || profileUser.phone,
      website: editWebsite.trim() || 'gatewayconnect.church/partner'
    } as any);

    if (updated) {
      setProfileUser(updated);
      onUpdateUser?.(updated);
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.5 }
      });
      triggerToast('Profile updated in real-time!');
    }
    setShowEditProfile(false);
  };

  // Direct avatar change shortcut
  const handleOpenDirectPhotoChange = () => {
    setImagePickerPurpose('avatar');
    setShowImagePickerModal(true);
  };

  const handleImagePickerSelect = (imgUrl: string) => {
    if (imagePickerPurpose === 'avatar') {
      if (showEditProfile) {
        setEditAvatarUrl(imgUrl);
      } else {
        // Direct save and real-time update
        const updated = StorageService.updateUserProfile({ avatar_url: imgUrl });
        if (updated) {
          setProfileUser(updated);
          onUpdateUser?.(updated);
          confetti({
            particleCount: 25,
            spread: 50,
            origin: { y: 0.5 }
          });
          triggerToast('Profile photo updated in real-time!');
        }
      }
    } else if (imagePickerPurpose === 'highlight') {
      setNewHighlightImg(imgUrl);
    }
  };

  // Add custom story highlight
  const handleCreateHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHighlightTitle.trim()) return;
    const newHighlight: StoryHighlight = {
      id: `h_${Date.now()}`,
      title: newHighlightTitle.trim(),
      img: newHighlightImg || profileUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'
    };
    const updated = [newHighlight, ...storyHighlights];
    setStoryHighlights(updated);
    try {
      localStorage.setItem('gcz_story_highlights_custom', JSON.stringify(updated));
    } catch {}
    setShowAddHighlightModal(false);
    setNewHighlightTitle('');
    setNewHighlightImg('');
    triggerToast('New highlight added!');
  };

  // Post Detail Click & Comments
  const handleOpenPostDetail = (post: Testimony) => {
    setActiveDetailPost(post);
    setDetailPostLiked(post.user_liked || false);
    setDetailPostLikesCount(post.likes_count || 0);
    setDetailPostComments(post.comments || []);
    setIsPostSavedState(StorageService.isPostSaved ? StorageService.isPostSaved(post.id, currentUser.id) : false);
  };

  const handleToggleLikeDetailPost = () => {
    if (!activeDetailPost) return;
    const res = StorageService.likeTestimony(activeDetailPost.id, currentUser.id);
    setDetailPostLiked(res.user_liked);
    setDetailPostLikesCount(res.likes_count);
    if (res.user_liked) {
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.7 }
      });
    }
  };

  const handleToggleSaveDetailPost = () => {
    if (!activeDetailPost) return;
    const saved = StorageService.toggleSavedPost(activeDetailPost.id, currentUser.id);
    setIsPostSavedState(saved);
    triggerToast(saved ? 'Post saved to your collection' : 'Post removed from saved');
  };

  const handleAddDetailComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetailPost || !detailCommentText.trim()) return;
    const createdComment = StorageService.addCommentToTestimony(activeDetailPost.id, detailCommentText.trim(), currentUser);
    if (createdComment) {
      setDetailPostComments((prev) => [...prev, createdComment]);
      setDetailCommentText('');
      triggerToast('Comment posted!');
    }
  };

  // Filtered followers/following
  const filteredFollowsList = followsUsersList.filter((u) =>
    u.full_name.toLowerCase().includes(followsSearchQuery.toLowerCase()) ||
    u.handle?.toLowerCase().includes(followsSearchQuery.toLowerCase())
  );

  // Saved testimonies
  const allTestimonies = StorageService.getTestimonies();
  const savedTestimonies = allTestimonies.filter((t) =>
    t.id && StorageService.isPostSaved ? StorageService.isPostSaved(t.id, currentUser.id) : false
  );

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-hidden select-none animate-profile-backdrop"
      onClick={handleClose}
    >
      <div 
        className="w-full sm:max-w-lg bg-card text-foreground border border-border sm:rounded-3xl h-[100dvh] sm:h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-profile-slide-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull / Drag Indicator Handle */}
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto my-1.5 sm:hidden shrink-0" />

        {/* Toast Notification Banner */}
        {showProfileToast && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-emerald-400/40 animate-in fade-in slide-in-from-top-2 flex items-center gap-1.5 pointer-events-none">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>{showProfileToast}</span>
          </div>
        )}

        {/* 1. INSTAGRAM TOP NAVIGATION BAR */}
        <header className="px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-border flex items-center justify-between shrink-0 bg-card z-10">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleBack}
              className="p-1.5 -ml-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 font-bold text-sm text-foreground tracking-tight min-w-0 truncate">
              <span className="truncate">{profileUser.handle || `@${profileUser.full_name.toLowerCase().replace(/\s+/g, '_')}`}</span>
              {profileUser.is_verified && (
                <VerifiedBadge type={profileUser.badge_type || 'gold'} size="xs" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isMe && (
              <button
                onClick={() => setShowAddHighlightModal(true)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors cursor-pointer"
                title="Add Story Highlight"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleShareProfile}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors cursor-pointer"
              title="Share profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowProfileOptions(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors cursor-pointer"
              title="More Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 2. SCROLLABLE INSTAGRAM BODY */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          
          {/* PROFILE HEADER & STATS ROW */}
          <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 min-w-0">
              
              {/* Profile Avatar with Instagram Gradient Ring */}
              <div className="relative group shrink-0">
                <div 
                  onClick={() => {
                    if (storyHighlights.length > 0) {
                      setActiveStoryHighlight(storyHighlights[0]);
                    } else if (isMe) {
                      handleOpenDirectPhotoChange();
                    }
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md cursor-pointer transition-transform hover:scale-105"
                  title={isMe ? 'Tap to view story or update photo' : 'Tap to view story'}
                >
                  <div className="w-full h-full rounded-full p-[1.5px] bg-background">
                    <img
                      src={profileUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                      alt={profileUser.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                {/* Camera badge for current user */}
                {isMe && (
                  <button
                    type="button"
                    onClick={handleOpenDirectPhotoChange}
                    className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-background hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    title="Change Profile Photo"
                  >
                    <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                )}
              </div>

              {/* Instagram Numbers Metric Bar (Summary Row: Testimonies, Followers, Following) */}
              <div className="flex-1 flex items-center justify-around text-center gap-1 min-w-0">
                <div 
                  className="cursor-pointer hover:opacity-80 transition-opacity p-1 rounded-lg min-w-0 flex-1" 
                  onClick={() => setActiveTab('testimonies')}
                  title="View testimonies"
                >
                  <span className="block font-black text-sm sm:text-base text-foreground leading-tight">
                    {userPosts.length}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground block truncate">
                    Testimonies
                  </span>
                </div>

                <div 
                  className="cursor-pointer hover:opacity-80 transition-opacity p-1 rounded-lg min-w-0 flex-1"
                  onClick={() => setShowFollowsListModal('followers')}
                  title="View followers"
                >
                  <span className="block font-black text-sm sm:text-base text-foreground leading-tight">
                    {followersCount}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground block truncate">
                    Followers
                  </span>
                </div>

                <div 
                  className="cursor-pointer hover:opacity-80 transition-opacity p-1 rounded-lg min-w-0 flex-1"
                  onClick={() => setShowFollowsListModal('following')}
                  title="View following"
                >
                  <span className="block font-black text-sm sm:text-base text-foreground leading-tight">
                    {followingCount}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground block truncate">
                    Following
                  </span>
                </div>
              </div>

            </div>

            {/* BIO & CREDENTIALS SECTION */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  {profileUser.full_name}
                </h3>
                {profileUser.is_verified && (
                  <VerifiedBadge type={profileUser.badge_type || 'gold'} size="xs" />
                )}
                {profileUser.role === 'super_admin' && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold">
                    Admin
                  </span>
                )}
                {profileUser.role === 'developer' && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold">
                    Mod
                  </span>
                )}
                {profileUser.role === 'pastor' && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                    Pastor
                  </span>
                )}
                {profileUser.role === 'member' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    {profileUser.is_verified ? 'Verified' : 'Member'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono">
                <span>{profileUser.handle || `@${profileUser.full_name.toLowerCase().replace(/\s+/g, '_')}`}</span>
                <span>•</span>
                <span>{profileUser.member_id}</span>
              </div>

              <p className="text-foreground/80 text-xs sm:text-sm leading-relaxed whitespace-pre-line pt-0.5">
                {profileUser.bio || 'Believer walking in covenant faith & supernatural acceleration at Gateway International Church.'}
              </p>

              {profileUser.location && (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{profileUser.location}</span>
                </p>
              )}

              <div 
                onClick={handleCopyLink}
                className="flex items-center gap-1 text-primary text-[11px] pt-0.5 font-medium hover:underline cursor-pointer"
              >
                <LinkIcon className="w-3 h-3" />
                <span>{(profileUser as any).website || 'gatewayconnect.church/partner'}</span>
                {copiedLink && <span className="text-emerald-500 font-bold ml-1">✓ Copied</span>}
              </div>

              {/* Social Proof Line (Real followers from database) */}
              <div className="pt-0.5">
                {followersUsers.length === 0 ? (
                  <div 
                    onClick={() => setShowFollowsListModal('followers')}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span>0 followers</span>
                  </div>
                ) : followersUsers.length === 1 ? (
                  <div 
                    onClick={() => setShowFollowsListModal('followers')}
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    <img 
                      src={followersUsers[0].avatar_url || '/assets/apostle_joe_daniels_main.jpg'} 
                      className="inline-block w-4 h-4 rounded-full ring-1 ring-background object-cover" 
                      alt="" 
                    />
                    <span>Followed by <strong className="text-foreground font-semibold">{(followersUsers[0].handle || followersUsers[0].full_name).replace('@', '')}</strong></span>
                  </div>
                ) : followersUsers.length === 2 ? (
                  <div 
                    onClick={() => setShowFollowsListModal('followers')}
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <img src={followersUsers[0].avatar_url || '/assets/apostle_joe_daniels_main.jpg'} className="inline-block w-4 h-4 rounded-full ring-1 ring-background object-cover" alt="" />
                      <img src={followersUsers[1].avatar_url || '/assets/apostle_joe_daniels_main.jpg'} className="inline-block w-4 h-4 rounded-full ring-1 ring-background object-cover" alt="" />
                    </div>
                    <span>Followed by <strong className="text-foreground font-semibold">{(followersUsers[0].handle || followersUsers[0].full_name).replace('@', '')}</strong> and <strong className="text-foreground font-semibold">{(followersUsers[1].handle || followersUsers[1].full_name).replace('@', '')}</strong></span>
                  </div>
                ) : (
                  <div 
                    onClick={() => setShowFollowsListModal('followers')}
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {followersUsers.slice(0, 2).map((u, i) => (
                        <img key={u.id || i} src={u.avatar_url || '/assets/apostle_joe_daniels_main.jpg'} className="inline-block w-4 h-4 rounded-full ring-1 ring-background object-cover" alt="" />
                      ))}
                    </div>
                    <span>Followed by <strong className="text-foreground font-semibold">{(followersUsers[0].handle || followersUsers[0].full_name).replace('@', '')}</strong>, <strong className="text-foreground font-semibold">{(followersUsers[1].handle || followersUsers[1].full_name).replace('@', '')}</strong>, and {followersUsers.length - 2} other{followersUsers.length - 2 === 1 ? '' : 's'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS (Compact Instagram Style) */}
            <div className="flex items-center gap-2 pt-1">
              {isMe ? (
                <>
                  <button
                    id="btn-edit-profile-action"
                    onClick={handleOpenEditProfile}
                    className="flex-1 h-8 px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border border-border"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-primary" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleShareProfile}
                    className="flex-1 h-8 px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border border-border"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={() => setShowMemberIdCard(true)}
                    className="h-8 w-8 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95 border border-border shrink-0"
                    title="Digital Member ID"
                    aria-label="Digital Member ID"
                  >
                    <QrCode className="w-4 h-4 text-primary" />
                  </button>
                </>
              ) : (
                <>
                  {/* Follow / Following Toggle Button */}
                  <button
                    id="btn-instagram-follow-toggle"
                    onClick={handleToggleFollow}
                    className={`flex-1 h-8 px-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs ${
                      isFollowing 
                        ? 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  {/* Direct Message (DM) Button */}
                  <button
                    id="btn-instagram-message"
                    onClick={() => {
                      if (onOpenDirectChat) {
                        onOpenDirectChat(profileUser.id);
                      } else {
                        setShowDmDrawer(true);
                      }
                    }}
                    className="flex-1 h-8 px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 border border-border cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5 -rotate-12" />
                    <span>Message</span>
                  </button>

                  {/* Share Profile Button */}
                  <button
                    onClick={handleShareProfile}
                    className="h-8 w-8 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs border border-border active:scale-95 shrink-0"
                    title="Share via WhatsApp"
                    aria-label="Share via WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* STORY HIGHLIGHTS ROW: Curated past church events & sermon snippets */}
            {(storyHighlights.length > 0 || isMe) && (
              <div className="pt-2">
                <div className="flex items-center justify-between pb-1.5 px-0.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>Story Highlights</span>
                  </span>
                  {isMe && (
                    <button
                      onClick={() => setShowAddHighlightModal(true)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Story</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1.5 scrollbar-none max-w-full">
                  {isMe && (
                    <button 
                      type="button"
                      onClick={() => setShowAddHighlightModal(true)}
                      className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                    >
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors bg-secondary/50">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">New</span>
                    </button>
                  )}

                  {storyHighlights.map((h) => (
                    <button 
                      type="button"
                      key={h.id} 
                      onClick={() => setActiveStoryHighlight(h)}
                      className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                    >
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform shadow-xs">
                        <div className="w-full h-full rounded-full overflow-hidden p-[1px] bg-background">
                          <img
                            src={h.img}
                            alt={h.title}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-foreground/80 font-medium truncate max-w-[54px] sm:max-w-[60px] text-center">
                        {h.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. INSTAGRAM TAB SWITCHER (Toggle between 'Testimonies' and 'Saved Verses') */}
          <div className="flex border-t border-border bg-card/70 sticky top-0 z-10 backdrop-blur-md">
            <button
              id="btn-tab-testimonies"
              onClick={() => setActiveTab('testimonies')}
              className={`flex-1 py-2.5 sm:py-3 flex items-center justify-center gap-1.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'testimonies' 
                  ? 'border-primary text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="tracking-wide">TESTIMONIES ({userPosts.length})</span>
            </button>

            <button
              id="btn-tab-saved-verses"
              onClick={() => {
                setActiveTab('saved_verses');
                setSavedVersesList(StorageService.getSavedVerses());
              }}
              className={`flex-1 py-2.5 sm:py-3 flex items-center justify-center gap-1.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'saved_verses' 
                  ? 'border-primary text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span className="tracking-wide">SAVED VERSES ({savedVersesList.length})</span>
            </button>

            <button
              id="btn-tab-tagged"
              onClick={() => setActiveTab('tagged')}
              className={`py-2.5 sm:py-3 px-3 sm:px-4 flex items-center justify-center gap-1.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'tagged' 
                  ? 'border-primary text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              title="Tagged in Community"
            >
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline tracking-wide">TAGGED</span>
            </button>
          </div>

          {/* 4. TAB CONTENTS (Testimonies Grid vs Saved Verses Grid) */}
          <div className="p-1 sm:p-2">
            {/* TAB 1: TESTIMONIES GRID */}
            {activeTab === 'testimonies' && (
              userPosts.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center mx-auto text-muted-foreground bg-secondary">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-foreground">No Testimonies Yet</p>
                  <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                    When {isMe ? 'you share' : `${profileUser.full_name} shares`} testimonies and community updates, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {userPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => handleOpenPostDetail(post)}
                      className="aspect-square bg-secondary relative group cursor-pointer overflow-hidden rounded-md"
                    >
                      <img
                        src={post.image_url || '/assets/apostle_joe_daniels_main.jpg'}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Hover Overlay with Likes & Comments Count */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 fill-white" />
                          {post.likes_count || 12}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 fill-white" />
                          {post.comments?.length || 3}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* TAB 2: SAVED VERSES GRID (Instagram Gallery / Saved Tab) */}
            {activeTab === 'saved_verses' && (
              <div className="p-2 sm:p-3 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Bookmark className="w-3.5 h-3.5 text-primary" />
                    <span>Saved scriptures & rhema promises</span>
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    {savedVersesList.length} Saved
                  </span>
                </div>

                {savedVersesList.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-2 bg-secondary/30 rounded-2xl border border-border">
                    <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center mx-auto text-primary bg-secondary">
                      <Bookmark className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-foreground">No Saved Verses Yet</p>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                      Tap the bookmark icon on any scripture in the Bible reader to save covenant promises to your personal profile.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {savedVersesList.map((verseRef, idx) => {
                      const detail = RHEMA_SCRIPTURE_DETAILS[verseRef] || {
                        text: 'For the word of God is living and active, sharper than any two-edged sword.',
                        category: 'Covenant Rhema',
                        theme: 'Supernatural Power'
                      };
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-secondary/40 border border-border hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs group"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-black text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                {verseRef}
                              </span>
                              <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                {detail.theme}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/90 leading-relaxed italic line-clamp-3">
                              "{detail.text}"
                            </p>
                          </div>

                          <div className="pt-2.5 mt-2 border-t border-border/60 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {detail.category}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(`${verseRef} - "${detail.text}"`);
                                  }
                                  triggerToast(`Copied ${verseRef} to clipboard!`);
                                }}
                                className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
                                title="Copy Verse"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const shareText = `Rhema Scripture from Gateway International Church:\n\n${verseRef}\n"${detail.text}"\n\nShared via Gateway Connect`;
                                  window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                                }}
                                className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
                                title="Share to WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              {isMe && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    StorageService.toggleSavedVerse(verseRef);
                                    setSavedVersesList(StorageService.getSavedVerses());
                                    triggerToast(`Removed ${verseRef} from saved`);
                                  }}
                                  className="p-1.5 rounded-lg bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                  title="Remove from saved"
                                >
                                  <Bookmark className="w-3.5 h-3.5 fill-current text-primary" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TAGGED */}
            {activeTab === 'tagged' && (
              <div className="py-12 px-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center mx-auto text-muted-foreground bg-secondary">
                  <Tag className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-foreground">Photos and Videos of {isMe ? 'You' : profileUser.full_name}</p>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  When members tag {isMe ? 'you' : profileUser.full_name} in community testimonies or service decrees, they will appear here.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ========================================================= */}
        {/* SUB-MODAL 1: EDIT PROFILE DRAWER (REAL-TIME ENGINE)       */}
        {/* ========================================================= */}
        {showEditProfile && (
          <div className="absolute inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-right-4 duration-200">
            <div className="px-4 py-3 bg-card border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="p-1 text-white/70 hover:text-white rounded-full cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="font-bold text-sm text-white">Edit Profile</h3>
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-4 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg shadow cursor-pointer active:scale-95 transition-transform flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Done</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Avatar Section with Change Photo Button */}
              <div className="flex flex-col items-center gap-2 pb-2">
                <div className="relative group cursor-pointer" onClick={() => {
                  setImagePickerPurpose('avatar');
                  setShowImagePickerModal(true);
                }}>
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary p-[1.5px]">
                    <img
                      src={editAvatarUrl || profileUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                      alt={profileUser.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImagePickerPurpose('avatar');
                    setShowImagePickerModal(true);
                  }}
                  className="text-xs text-blue-500 hover:underline font-bold cursor-pointer"
                >
                  Change profile photo
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Username / Handle</label>
                <input
                  type="text"
                  required
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary resize-none"
                  placeholder="Share a short bio or prophetic decree..."
                />
                <p className="text-[10px] text-right text-white/40 mt-0.5">{editBio.length} / 150</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Website / Partner Link</label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="e.g. gatewayconnect.church/partner"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Location / City</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. Harare, Zimbabwe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
                />
                {/* Quick location presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'UK Diaspora', 'SA Diaspora'].map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setEditLocation(`${city}, Zimbabwe`)}
                      className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-[10px] text-white/70 border border-white/10 cursor-pointer"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="pt-2 pb-6">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes in Real Time</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-MODAL 2: INSTAGRAM POST DETAIL VIEWER                 */}
        {/* ========================================================= */}
        {activeDetailPost && (
          <div className="absolute inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-right-4 duration-200">
            {/* Header */}
            <div className="px-4 py-3 bg-card border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setActiveDetailPost(null)}
                  className="p-1 text-white/70 hover:text-white rounded-full cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20">
                  <img
                    src={profileUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                    alt={profileUser.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white flex items-center gap-1">
                    <span>{profileUser.handle || profileUser.full_name}</span>
                    {profileUser.is_verified && <VerifiedBadge type="gold" size="xs" />}
                  </h4>
                  <p className="text-[10px] text-white/50">{profileUser.location || 'Gateway International Church'}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveDetailPost(null)}
                className="p-1 text-white/50 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Post Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Post Image */}
              <div className="relative aspect-square w-full bg-black/60">
                <img
                  src={activeDetailPost.image_url || '/assets/apostle_joe_daniels_main.jpg'}
                  alt={activeDetailPost.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Action Buttons Row */}
              <div className="p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleToggleLikeDetailPost}
                      className="transition-transform active:scale-125 cursor-pointer"
                    >
                      <Heart
                        className={`w-6 h-6 transition-colors ${
                          detailPostLiked ? 'fill-rose-500 text-rose-500' : 'text-white hover:text-white/80'
                        }`}
                      />
                    </button>
                    <button 
                      onClick={() => document.getElementById('instagram-detail-comment-input')?.focus()}
                      className="text-white hover:text-white/80 cursor-pointer"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}?post=${activeDetailPost.id}`;
                        if (navigator.clipboard) navigator.clipboard.writeText(url);
                        triggerToast('Post link copied!');
                      }}
                      className="text-white hover:text-white/80 cursor-pointer"
                    >
                      <Send className="w-5 h-5 -rotate-12" />
                    </button>
                  </div>
                  <button
                    onClick={handleToggleSaveDetailPost}
                    className="text-white hover:text-white/80 cursor-pointer"
                  >
                    <Bookmark
                      className={`w-6 h-6 ${
                        isPostSavedState ? 'fill-primary text-primary' : 'text-white'
                      }`}
                    />
                  </button>
                </div>

                {/* Likes Counter */}
                <p className="text-xs font-bold text-white">
                  {detailPostLikesCount.toLocaleString()} {detailPostLikesCount === 1 ? 'like' : 'likes'}
                </p>

                {/* Caption */}
                <div className="text-xs text-white/90 space-y-1">
                  <p>
                    <span className="font-bold text-white mr-1.5">{profileUser.handle || profileUser.full_name}</span>
                    {activeDetailPost.content || activeDetailPost.title}
                  </p>
                  {activeDetailPost.scripture_tag && (
                    <p className="text-[11px] text-primary font-semibold italic">
                      📖 {activeDetailPost.scripture_tag}
                    </p>
                  )}
                  <p className="text-[10px] text-white/40 uppercase tracking-wider pt-1">
                    {new Date(activeDetailPost.date).toLocaleDateString()}
                  </p>
                </div>

                {/* Comments List */}
                <div className="pt-2 border-t border-white/10 space-y-2.5">
                  <h5 className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
                    Comments ({detailPostComments.length})
                  </h5>
                  {detailPostComments.length === 0 ? (
                    <p className="text-[11px] text-white/40 italic">No comments yet. Be the first to share a blessing!</p>
                  ) : (
                    detailPostComments.map((c, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10 shrink-0">
                          {c.user_avatar ? (
                            <img src={c.user_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-[9px] text-primary">
                              {c.user_name?.[0] || 'B'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p>
                            <span className="font-bold text-white mr-1.5">{c.user_name}</span>
                            <span className="text-white/80">{c.text}</span>
                          </p>
                          <span className="text-[9px] text-white/40">
                            {c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Comment Input Bar */}
            <form onSubmit={handleAddDetailComment} className="p-3 bg-card border-t border-white/10 flex items-center gap-2 shrink-0">
              <input
                id="instagram-detail-comment-input"
                type="text"
                value={detailCommentText}
                onChange={(e) => setDetailCommentText(e.target.value)}
                placeholder="Add a comment as a believer..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!detailCommentText.trim()}
                className="px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-600 disabled:opacity-40 text-white font-bold text-xs transition-all shrink-0 cursor-pointer"
              >
                Post
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-MODAL 3: INSTAGRAM STORY VIEWER                       */}
        {/* ========================================================= */}
        {activeStoryHighlight && (
          <div 
            className="absolute inset-0 z-50 bg-black flex flex-col justify-between p-3 sm:p-4 animate-in fade-in duration-200"
            onClick={() => setActiveStoryHighlight(null)}
          >
            {/* Top Progress Bar */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mb-2" onClick={(e) => e.stopPropagation()}>
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                style={{ width: `${storyProgress}%` }}
              />
            </div>

            {/* Top Bar with Avatar, Type, and Close */}
            <div className="flex items-center justify-between text-white shrink-0 z-10" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30">
                  <img src={profileUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-xs">{profileUser.full_name}</h4>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary/30 text-primary border border-primary/40">
                      {activeStoryHighlight.type === 'event' ? 'Church Event' : 'Sermon Snippet'}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60">{activeStoryHighlight.eventName || activeStoryHighlight.title} • {activeStoryHighlight.date || '2026'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const text = `${activeStoryHighlight.title}: ${activeStoryHighlight.snippetText || ''} (${activeStoryHighlight.scriptureRef || 'Gateway International Church'})`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(text);
                      triggerToast('Highlight quote copied!');
                    }
                  }}
                  className="p-1 rounded-full bg-black/40 text-white hover:bg-black/60 cursor-pointer"
                  title="Copy snippet"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setActiveStoryHighlight(null)}
                  className="p-1 rounded-full bg-black/40 text-white hover:bg-black/60 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Story Image & Snippet Text */}
            <div className="flex-1 flex flex-col items-center justify-center my-auto overflow-hidden rounded-2xl relative">
              <img
                src={activeStoryHighlight.img}
                alt={activeStoryHighlight.title}
                className="max-h-[62vh] sm:max-h-[66vh] w-auto object-contain rounded-xl shadow-2xl"
              />

              {activeStoryHighlight.snippetText && (
                <div className="absolute bottom-4 left-3 right-3 sm:left-6 sm:right-6 p-3 sm:p-4 bg-black/75 backdrop-blur-md rounded-xl border border-white/20 text-center space-y-1 shadow-xl">
                  <p className="font-serif-church text-xs sm:text-sm text-white italic leading-relaxed">
                    "{activeStoryHighlight.snippetText}"
                  </p>
                  {activeStoryHighlight.scriptureRef && (
                    <p className="text-[10px] sm:text-xs font-bold text-primary">
                      — {activeStoryHighlight.scriptureRef}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Caption Bar */}
            <div className="text-center py-2 shrink-0 text-white/90 font-serif-church text-sm bg-black/40 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="text-left">
                <p className="font-bold text-xs sm:text-sm">{activeStoryHighlight.title}</p>
                <p className="text-[10px] text-primary">Gateway International Church Harare</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const shareText = `Watch "${activeStoryHighlight.title}" from Gateway International Church Harare:\n\n${activeStoryHighlight.snippetText ? `"${activeStoryHighlight.snippetText}"\n` : ''}${activeStoryHighlight.scriptureRef || ''}\n\nShared via Gateway Connect`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] sm:text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-600 transition-colors shadow"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-MODAL 4: ADD STORY HIGHLIGHT MODAL                    */}
        {/* ========================================================= */}
        {showAddHighlightModal && (
          <div 
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setShowAddHighlightModal(false)}
          >
            <div 
              className="bg-card text-foreground border border-border rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <h4 className="font-bold text-sm text-foreground">Curate Story Highlight</h4>
                  <p className="text-[11px] text-muted-foreground">Save church events or sermon snippets</p>
                </div>
                <button onClick={() => setShowAddHighlightModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Selection */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Quick Select Past Events & Snippets
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEFAULT_HIGHLIGHTS.map((h) => (
                    <button
                      type="button"
                      key={h.id}
                      onClick={() => {
                        setNewHighlightTitle(h.title);
                        setNewHighlightImg(h.img);
                      }}
                      className="p-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-left flex items-center gap-1.5 transition-colors cursor-pointer group"
                    >
                      <img src={h.img} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-foreground truncate group-hover:text-primary">{h.title}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{h.eventName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreateHighlight} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Highlight Title</label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={newHighlightTitle}
                    onChange={(e) => setNewHighlightTitle(e.target.value)}
                    placeholder="e.g. Miracles '26, Night of Decree"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Cover Image</label>
                  <div className="flex items-center gap-2">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
                      <img
                        src={newHighlightImg || profileUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerPurpose('highlight');
                        setShowImagePickerModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground border border-border cursor-pointer"
                    >
                      Choose Cover
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddHighlightModal(false)}
                    className="flex-1 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow cursor-pointer"
                  >
                    Save Highlight
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-MODAL 5: 3-DOTS MORE OPTIONS SHEET                    */}
        {/* ========================================================= */}
        {showProfileOptions && (
          <div 
            className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center p-3 animate-in fade-in duration-150"
            onClick={() => setShowProfileOptions(false)}
          >
            <div 
              className="w-full bg-card border border-white/15 rounded-2xl overflow-hidden divide-y divide-white/10 text-xs text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  handleCopyLink();
                  setShowProfileOptions(false);
                }}
                className="w-full py-3.5 text-white font-semibold hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                <span>Copy Profile Link</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleShareProfile();
                  setShowProfileOptions(false);
                }}
                className="w-full py-3.5 text-emerald-400 font-semibold hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMemberIdCard(true);
                  setShowProfileOptions(false);
                }}
                className="w-full py-3.5 text-primary font-semibold hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Digital Member ID Card</span>
              </button>
              {isMe && onLogout && (
                <button
                  type="button"
                  id="btn-instagram-logout-trigger"
                  onClick={() => {
                    setShowProfileOptions(false);
                    setShowLogoutConfirmModal(true);
                  }}
                  className="w-full py-3.5 text-rose-400 font-bold hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Account</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowProfileOptions(false)}
                className="w-full py-3.5 text-white/50 font-bold hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* IN-APP LOGOUT CONFIRMATION DIALOG (Reliable, no window.confirm dependency) */}
        {showLogoutConfirmModal && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setShowLogoutConfirmModal(false)}
          >
            <div 
              className="w-full max-w-xs sm:max-w-sm bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-500 mx-auto flex items-center justify-center">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Log Out of Account?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to log out of your Gateway Connect account? You will return to the sign in screen.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-account-logout"
                  onClick={() => {
                    setShowLogoutConfirmModal(false);
                    if (onLogout) onLogout();
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-MODAL 6: DIGITAL MEMBER ID CARD                       */}
        {/* ========================================================= */}
        {showMemberIdCard && (
          <div 
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setShowMemberIdCard(false)}
          >
            <div 
              className="w-full max-w-sm bg-gradient-to-br from-card via-background to-slate-900 border-2 border-primary rounded-3xl p-6 shadow-2xl space-y-4 text-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowMemberIdCard(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Gateway International Church</span>
                <h4 className="font-serif-church font-bold text-lg text-white">Digital Fellowship Pass</h4>
              </div>

              <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-primary to-amber-200 mx-auto shadow-xl">
                <img
                  src={profileUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                  alt={profileUser.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              <div>
                <h3 className="font-bold text-base text-white flex items-center justify-center gap-1.5">
                  <span>{profileUser.full_name}</span>
                  {profileUser.is_verified && <VerifiedBadge type="gold" size="sm" />}
                </h3>
                <p className="text-xs text-primary font-mono mt-0.5">{profileUser.handle || '@member'}</p>
                <p className="text-[11px] text-white/60 mt-1">{profileUser.location || 'Harare, Zimbabwe'}</p>
              </div>

              {/* Barcode / ID Block */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-3 space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-xs text-white/80">
                  <span>Member ID:</span>
                  <div className="flex items-center gap-1 text-primary font-bold">
                    <span>{profileUser.member_id}</span>
                    <button onClick={handleCopyMemberId} className="p-1 hover:text-white" title="Copy ID">
                      {copiedMemberId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                {/* Simulated barcode */}
                <div className="h-8 flex items-center justify-center gap-1 bg-white p-1 rounded">
                  {[4, 2, 6, 2, 5, 2, 7, 3, 4, 2, 6, 3, 5, 2, 4, 3, 6, 2].map((w, i) => (
                    <div key={i} className="h-full bg-black" style={{ width: `${w}px` }} />
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-white/40">Authorized Believer • Harare Apostolic Altar</p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-MODAL 7: DIRECT MESSAGES DRAWER                       */}
        {/* ========================================================= */}
        {showDmDrawer && (
          <div className="absolute inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-right-4 duration-200">
            <div className="px-4 py-3 bg-card border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowDmDrawer(false)}
                  className="p-1 text-white/70 hover:text-white rounded-full cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/50">
                  <img
                    src={profileUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                    alt={profileUser.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white flex items-center gap-1">
                    <span>{profileUser.full_name}</span>
                    {profileUser.is_verified && <VerifiedBadge type="gold" size="xs" />}
                  </h3>
                  <p className="text-[10px] text-emerald-400">Direct Chat</p>
                </div>
              </div>

              <button
                onClick={() => setShowDmDrawer(false)}
                className="p-1 text-white/50 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DM Messages Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
              {dmList.length === 0 ? (
                <div className="text-center py-16 text-white/40 text-xs">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold text-white/70">Send a greeting in Christ</p>
                  <p className="text-[10px] text-white/40">Messages sent here are private between you and {profileUser.full_name}.</p>
                </div>
              ) : (
                dmList.map((m) => {
                  const isFromMe = m.sender_id === currentUser.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[80%] ${
                        isFromMe ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isFromMe
                            ? 'bg-blue-600 text-white rounded-br-sm shadow-md'
                            : 'bg-white/10 text-white rounded-bl-sm border border-white/10'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-white/40 mt-1 px-1">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* DM Input Bar */}
            <form onSubmit={handleSendDm} className="p-3 bg-card border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={dmInputText}
                onChange={(e) => setDmInputText(e.target.value)}
                placeholder={`Message ${profileUser.full_name}...`}
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!dmInputText.trim()}
                className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-600 disabled:opacity-40 text-white font-bold transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-MODAL 8: FOLLOWERS / FOLLOWING MODAL                  */}
        {/* ========================================================= */}
        {showFollowsListModal && (
          <div className="absolute inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-right-4 duration-200">
            {/* Header */}
            <div className="px-4 py-3 bg-card border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowFollowsListModal(null)}
                  className="p-1 text-white/70 hover:text-white rounded-full cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="font-bold text-sm text-white capitalize">
                    {showFollowsListModal}
                  </h3>
                  <p className="text-[11px] text-white/50">
                    {showFollowsListModal === 'followers' 
                      ? `${followersCount} ${followersCount === 1 ? 'follower' : 'followers'}`
                      : `${followingCount} following`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowFollowsListModal(null)}
                className="p-1.5 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search bar */}
            <div className="p-3 bg-card/50 border-b border-white/10">
              <input
                type="text"
                value={followsSearchQuery}
                onChange={(e) => setFollowsSearchQuery(e.target.value)}
                placeholder="Search believers..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Users List */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2">
              {filteredFollowsList.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-xs">
                  <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30 text-primary" />
                  <p>No believers found.</p>
                </div>
              ) : (
                filteredFollowsList.map((u) => {
                  const isFollowingThisUser = StorageService.isFollowingUser(currentUser.id, u.id);
                  const isSelf = currentUser.id === u.id;

                  return (
                    <div
                      key={u.id}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          navigateToProfile(u);
                        }}
                        className="flex items-center gap-3 min-w-0 text-left cursor-pointer flex-1"
                      >
                        <img
                          src={u.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                          alt={u.full_name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-white truncate flex items-center gap-1">
                            <span>{u.full_name}</span>
                            {u.is_verified && <VerifiedBadge type={u.badge_type || 'blue'} size="xs" />}
                          </h4>
                          <p className="text-[11px] text-white/50 truncate">
                            {u.handle || `@${u.full_name.toLowerCase().replace(/\s+/g, '_')}`}
                          </p>
                        </div>
                      </button>

                      {!isSelf && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              StorageService.toggleFollowUser(u.id);
                              setFollowersCount(StorageService.getUserFollowersCount(profileUser.id));
                              setFollowingCount(StorageService.getUserFollowingCount(profileUser.id));
                              if (showFollowsListModal === 'followers') {
                                setFollowsUsersList(StorageService.getFollowersUsers(profileUser.id));
                              } else {
                                setFollowsUsersList(StorageService.getFollowingUsers(profileUser.id));
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isFollowingThisUser
                                ? 'bg-white/10 text-white/80 hover:bg-white/20'
                                : 'bg-blue-600 text-white hover:bg-blue-600'
                            }`}
                          >
                            {isFollowingThisUser ? 'Following' : 'Follow'}
                          </button>

                          {onOpenDirectChat && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowFollowsListModal(null);
                                onOpenDirectChat(u.id);
                              }}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors cursor-pointer"
                              title="Send Message"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* IMAGE PICKER MODAL */}
        <ImagePickerModal
          isOpen={showImagePickerModal}
          onClose={() => setShowImagePickerModal(false)}
          onSelectImage={handleImagePickerSelect}
          currentImage={imagePickerPurpose === 'avatar' ? (editAvatarUrl || profileUser.avatar_url) : newHighlightImg}
          title={imagePickerPurpose === 'avatar' ? 'Change Profile Photo' : 'Select Highlight Cover'}
          subtitle={imagePickerPurpose === 'avatar' ? 'Select a photo from your local device storage, camera, or choose an official ministry portrait.' : 'Pick a cover image for your story highlight.'}
        />

      </div>
    </div>
  );
};
