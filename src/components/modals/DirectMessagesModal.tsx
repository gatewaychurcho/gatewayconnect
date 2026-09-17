import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Search, 
  Check, 
  CheckCheck, 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft, 
  Plus, 
  Users, 
  MessageSquare, 
  Share2, 
  Copy, 
  GraduationCap, 
  AlertTriangle, 
  Crown, 
  CreditCard, 
  Clock, 
  Info, 
  Flame, 
  UserCheck, 
  Lock, 
  ExternalLink,
  Phone,
  Pin,
  Edit3,
  Shield,
  Reply,
  AtSign,
  LogOut,
  MessageCircle,
  MoreVertical,
  Trash2,
  CheckSquare,
  Square,
  UserPlus,
  UserMinus,
  MessageSquarePlus,
  Download,
  Image as ImageIcon,
  FileText,
  ChevronRight,
  Paperclip,
  Video,
  Music,
  Volume2,
  Play,
  Film,
  Mic,
  Upload,
  XCircle,
  Camera,
  Key,
  Smile
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, DirectMessage, DmThread, ChatGroup, ChatGroupMessage, GroupMembership, GroupInvite } from '../../types';
import { StorageService, arePhoneNumbersEqual } from '../../services/storageService';
import { SupabaseSyncService } from '../../services/supabaseSyncService';
import { PaynowService } from '../../services/paynowService';
import { LocalImagePicker } from '../common/LocalImagePicker';
import { InstagramProfileModal } from './InstagramProfileModal';
import { GroupInfoModal } from '../chat/GroupInfoModal';

interface DirectMessagesModalProps {
  currentUser: User;
  initialRecipientId?: string;
  initialGroupId?: string;
  onClose: () => void;
}

const EMOJI_REACTIONS = ['🙏', '❤️', '🔥', '✝️', '🕊️', '🙌', '👑', '🌟'];

const formatMessageDateDivider = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    if (isNaN(d.getTime())) return '';
    
    if (d.toDateString() === now.toDateString()) return 'Today';
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    const isSameYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      ...(isSameYear ? {} : { year: 'numeric' })
    });
  } catch {
    return '';
  }
};

const getBubbleRounding = (isMine: boolean, isFirstInGroup: boolean, isLastInGroup: boolean): string => {
  if (isMine) {
    if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-tr-xs';
    if (isFirstInGroup) return 'rounded-2xl rounded-tr-xs rounded-br-md';
    if (isLastInGroup) return 'rounded-2xl rounded-br-xs rounded-tr-md';
    return 'rounded-2xl rounded-r-md';
  } else {
    if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-tl-xs';
    if (isFirstInGroup) return 'rounded-2xl rounded-tl-xs rounded-bl-md';
    if (isLastInGroup) return 'rounded-2xl rounded-bl-xs rounded-tl-md';
    return 'rounded-2xl rounded-l-md';
  }
};

const getSenderNameColor = (name: string, role?: string): string => {
  if (role === 'super_admin') return 'text-amber-600 dark:text-amber-400 font-bold';
  if (role === 'developer') return 'text-purple-600 dark:text-purple-400 font-bold';
  if (role === 'pastor') return 'text-blue-600 dark:text-blue-400 font-bold';
  const colors = [
    'text-emerald-600 dark:text-emerald-400 font-semibold',
    'text-teal-600 dark:text-teal-400 font-semibold',
    'text-sky-600 dark:text-sky-400 font-semibold',
    'text-rose-600 dark:text-rose-400 font-semibold',
    'text-indigo-600 dark:text-indigo-400 font-semibold',
    'text-orange-600 dark:text-orange-400 font-semibold',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const DirectMessagesModal: React.FC<DirectMessagesModalProps> = ({
  currentUser,
  initialRecipientId,
  initialGroupId,
  onClose
}) => {
  // Screen size detection for WhatsApp mobile vs desktop layout
  const [isMobile, setIsMobile] = useState<boolean>(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation tabs: 'direct' or 'groups'
  const [activeTab, setActiveTab] = useState<'direct' | 'groups'>(initialGroupId ? 'groups' : 'direct');

  // Direct messages state - On mobile, leave unselected if no initial recipient so user sees chats list with FAB
  const [threads, setThreads] = useState<DmThread[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    if (initialRecipientId) return initialRecipientId;
    if (typeof window !== 'undefined' && window.innerWidth < 640) return '';
    return 'usr_apostle_joe';
  });
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatPicker, setShowNewChatPicker] = useState<boolean>(false);

  // Group chat state - On mobile, leave unselected if no initial group so user sees groups list with FAB
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    if (initialGroupId) return initialGroupId;
    if (typeof window !== 'undefined' && window.innerWidth < 640) return '';
    return 'group_ignite_worship';
  });
  const [groupMessages, setGroupMessages] = useState<ChatGroupMessage[]>([]);
  const [groupInputText, setGroupInputText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showGroupEmojiPicker, setShowGroupEmojiPicker] = useState<boolean>(false);
  const [threadFilter, setThreadFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const [groupFilter, setGroupFilter] = useState<'all' | 'joined' | 'paid' | 'open'>('all');

  // Reactively respond to initialRecipientId and initialGroupId props
  useEffect(() => {
    if (initialRecipientId) {
      setActiveTab('direct');
      setActiveUserId(initialRecipientId);
    } else if (initialGroupId) {
      setActiveTab('groups');
      setActiveGroupId(initialGroupId);
      StorageService.markGroupMessagesAsRead(initialGroupId, currentUser.id);
      setGroupMessages(StorageService.getChatGroupMessagesForUser(initialGroupId, currentUser.id));
    }
  }, [initialRecipientId, initialGroupId, currentUser.id]);

  // Modals for groups
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTargetGroup, setPaymentTargetGroup] = useState<ChatGroup | null>(null);
  const [paymentNoticeMessage, setPaymentNoticeMessage] = useState<string | null>(null);

  // Join by invite code state
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [declinedInviteCodes, setDeclinedInviteCodes] = useState<string[]>([]);
  const [joiningGroup, setJoiningGroup] = useState<ChatGroup | null>(null);
  const [inviteLinkError, setInviteLinkError] = useState<string | null>(null);

  // Pending Group Invites state
  const [pendingInvites, setPendingInvites] = useState<GroupInvite[]>(() => 
    currentUser ? StorageService.getGroupInvites(currentUser.id) : []
  );

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<'ecocash' | 'innbucks' | 'card'>('ecocash');
  const [paymentPhone, setPaymentPhone] = useState(currentUser.phone || '');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // New group creation form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState<'Worship' | 'Men' | 'Women' | 'Youth' | 'School' | 'General'>('General');
  const [newGroupAvatar, setNewGroupAvatar] = useState('');
  const [newGroupIsPaid, setNewGroupIsPaid] = useState(false);
  const [newGroupPrice, setNewGroupPrice] = useState(150);
  const [newGroupDuration, setNewGroupDuration] = useState(3);
  const [newGroupPinnedNotice, setNewGroupPinnedNotice] = useState('');
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);

  const handleGroupAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewGroupAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const groupMessagesEndRef = useRef<HTMLDivElement>(null);
  const groupInputRef = useRef<HTMLInputElement>(null);

  const [pinnedDms, setPinnedDms] = useState<string[]>(() => StorageService.getPinnedDms(currentUser.id));
  const [isEditingGroupDetails, setIsEditingGroupDetails] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');

  // WhatsApp-style Reply, Tagging, and Exit states
  const [replyingToMessage, setReplyingToMessage] = useState<{ id: string; sender_name: string; text: string } | null>(null);
  const [showExitGroupConfirm, setShowExitGroupConfirm] = useState(false);
  const [mentionSuggestionsOpen, setMentionSuggestionsOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  // WhatsApp-style Message Selection & Deletion states
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    isMultiple: boolean;
    targetMessageId?: string;
    canDeleteForEveryone: boolean;
    isGroup: boolean;
  }>({
    isOpen: false,
    isMultiple: false,
    canDeleteForEveryone: false,
    isGroup: false
  });
  const [clearChatConfirmModal, setClearChatConfirmModal] = useState<{
    isOpen: boolean;
    isGroup: boolean;
    title: string;
  }>({
    isOpen: false,
    isGroup: false,
    title: ''
  });

  // 3-dots top dropdown menus
  const [showDirectTopMenu, setShowDirectTopMenu] = useState(false);
  const [showGroupTopMenu, setShowGroupTopMenu] = useState(false);

  // User Profile preview modal on clicking @tags or member avatars
  const [viewUserProfile, setViewUserProfile] = useState<User | null>(null);

  // WhatsApp-style Real-time Typing Indicators
  const [isRecipientTyping, setIsRecipientTyping] = useState<boolean>(false);
  const [groupTypingUserName, setGroupTypingUserName] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    const handleTypingEvent = (e: any) => {
      const detail = e.detail;
      if (!detail || detail.userId === currentUser.id) return;

      if (activeUserId && (detail.userId === activeUserId || detail.targetId === currentUser.id)) {
        setIsRecipientTyping(Boolean(detail.isTyping));
        clearTimeout(timer);
        if (detail.isTyping) {
          timer = setTimeout(() => setIsRecipientTyping(false), 3000);
        }
      }

      if (activeGroupId && detail.groupId === activeGroupId) {
        setGroupTypingUserName(detail.isTyping ? (detail.userName || 'Member') : null);
        clearTimeout(timer);
        if (detail.isTyping) {
          timer = setTimeout(() => setGroupTypingUserName(null), 3000);
        }
      }
    };

    window.addEventListener('gcz_user_typing', handleTypingEvent);
    return () => {
      window.removeEventListener('gcz_user_typing', handleTypingEvent);
      clearTimeout(timer);
    };
  }, [activeUserId, activeGroupId, currentUser.id]);

  // WhatsApp-style Media, Links, and Docs Browser states
  const [showMediaBrowserModal, setShowMediaBrowserModal] = useState(false);
  const [selectedMediaPreview, setSelectedMediaPreview] = useState<{
    url: string;
    caption?: string;
    sender?: string;
    sender_name?: string;
    date?: string;
    created_at?: string;
    type?: 'image' | 'video' | 'audio' | 'document';
  } | null>(null);
  const [showShareMediaPrompt, setShowShareMediaPrompt] = useState(false);
  const [shareMediaUrl, setShareMediaUrl] = useState('');
  const [shareMediaCaption, setShareMediaCaption] = useState('');
  const [groupInfoTab, setGroupInfoTab] = useState<'members' | 'media'>('members');
  const [groupMediaFilter, setGroupMediaFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [stagedLocalMedia, setStagedLocalMedia] = useState<{
    url: string;
    type: 'image' | 'video' | 'audio' | 'document';
    name: string;
    size: string;
  } | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLocalMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let mType: 'image' | 'video' | 'audio' | 'document' = 'document';
    if (file.type.startsWith('image/')) mType = 'image';
    else if (file.type.startsWith('video/')) mType = 'video';
    else if (file.type.startsWith('audio/')) mType = 'audio';

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        setStagedLocalMedia({
          url: result,
          type: mType,
          name: file.name,
          size: sizeStr
        });
        setShowShareMediaPrompt(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirmSendMedia = () => {
    if (!stagedLocalMedia) return;

    if (activeGroup) {
      if (StorageService.hasUserExitedGroup(activeGroup.id, currentUser.id)) {
        alert('You cannot send media because you exited this group fellowship. Please rejoin to participate.');
        return;
      }

      StorageService.sendChatGroupMessage(activeGroup.id, {
        sender_id: currentUser.id,
        sender_name: currentUser.full_name,
        sender_avatar: currentUser.avatar_url,
        sender_role: currentUser.role,
        text: shareMediaCaption.trim() || (stagedLocalMedia.type === 'video' ? `Shared a video: ${stagedLocalMedia.name}` : stagedLocalMedia.type === 'audio' ? `Shared an audio: ${stagedLocalMedia.name}` : stagedLocalMedia.type === 'document' ? `Shared a document: ${stagedLocalMedia.name}` : 'Shared a photo'),
        media_url: stagedLocalMedia.url,
        media_type: stagedLocalMedia.type
      });

      setStagedLocalMedia(null);
      setShareMediaCaption('');
      setShowShareMediaPrompt(false);
      refreshGroupsData();
      setCopyFeedback('Media shared to fellowship group!');
      setTimeout(() => setCopyFeedback(null), 3000);
    } else if (activeUserId && activeUser) {
      const msgText = shareMediaCaption.trim() || (stagedLocalMedia.type === 'video' ? `Shared a video: ${stagedLocalMedia.name}` : stagedLocalMedia.type === 'audio' ? `Shared an audio: ${stagedLocalMedia.name}` : stagedLocalMedia.type === 'document' ? `Shared a document: ${stagedLocalMedia.name}` : 'Shared a photo');
      StorageService.sendDirectMessage(
        currentUser.id,
        activeUserId,
        msgText,
        undefined,
        stagedLocalMedia.url,
        stagedLocalMedia.type
      );

      setStagedLocalMedia(null);
      setShareMediaCaption('');
      setShowShareMediaPrompt(false);
      refreshMessages();
      refreshThreads();
      setCopyFeedback('Media sent!');
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const isPrivilegedAdminOrDev = 
    currentUser.role === 'developer' ||
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin' ||
    (Boolean(currentUser.phone) && arePhoneNumbersEqual(currentUser.phone, '0780699988')) ||
    currentUser.id === 'usr_developer' ||
    currentUser.id === 'usr_apostle_joe';
  const isAdminOrDev = ['super_admin', 'developer', 'pastor', 'moderator'].includes(currentUser.role) || isPrivilegedAdminOrDev;
  const isSuperAdminOrDev = ['super_admin', 'developer'].includes(currentUser.role) || isPrivilegedAdminOrDev;

  // Closes whatever active chat or sub-view is on top, remaining inside the chat box/inbox list
  const handleCloseActiveChat = () => {
    if (selectedMediaPreview) {
      setSelectedMediaPreview(null);
      return;
    }
    if (showMediaBrowserModal) {
      setShowMediaBrowserModal(false);
      return;
    }
    if (showShareMediaPrompt) {
      setShowShareMediaPrompt(false);
      return;
    }
    if (deleteConfirmModal.isOpen) {
      setDeleteConfirmModal({ isOpen: false, isMultiple: false, canDeleteForEveryone: false, isGroup: false });
      return;
    }
    if (clearChatConfirmModal.isOpen) {
      setClearChatConfirmModal({ isOpen: false, isGroup: false, title: '' });
      return;
    }
    if (showExitGroupConfirm) {
      setShowExitGroupConfirm(false);
      return;
    }
    if (showPaymentModal) {
      setShowPaymentModal(false);
      return;
    }
    if (showJoinByCodeModal) {
      setShowJoinByCodeModal(false);
      return;
    }
    if (showAddMemberModal) {
      setShowAddMemberModal(false);
      return;
    }
    if (showCreateGroupModal) {
      setShowCreateGroupModal(false);
      return;
    }
    if (showGroupInfoModal) {
      setShowGroupInfoModal(false);
      return;
    }
    if (viewUserProfile) {
      setViewUserProfile(null);
      return;
    }
    if (isSelectMode) {
      handleCancelSelectMode();
      return;
    }
    if (showNewChatPicker) {
      setShowNewChatPicker(false);
      return;
    }
    // Close active chat and remain inside the chat box
    setActiveUserId('');
    setActiveGroupId('');
  };

  // Closes all open chats and layered views, leaving user on the chat list
  const handleCloseAllChats = () => {
    setSelectedMediaPreview(null);
    setShowMediaBrowserModal(false);
    setShowShareMediaPrompt(false);
    setDeleteConfirmModal({ isOpen: false, isMultiple: false, canDeleteForEveryone: false, isGroup: false });
    setClearChatConfirmModal({ isOpen: false, isGroup: false, title: '' });
    setShowExitGroupConfirm(false);
    setShowPaymentModal(false);
    setShowJoinByCodeModal(false);
    setShowAddMemberModal(false);
    setShowCreateGroupModal(false);
    setShowGroupInfoModal(false);
    setViewUserProfile(null);
    if (isSelectMode) handleCancelSelectMode();
    setShowNewChatPicker(false);
    setActiveUserId(null);
    setActiveGroupId('');
  };

  const handleBackOrClose = () => {
    if (
      selectedMediaPreview ||
      showMediaBrowserModal ||
      showShareMediaPrompt ||
      deleteConfirmModal.isOpen ||
      clearChatConfirmModal.isOpen ||
      showExitGroupConfirm ||
      showPaymentModal ||
      showJoinByCodeModal ||
      showAddMemberModal ||
      showCreateGroupModal ||
      showGroupInfoModal ||
      viewUserProfile ||
      isSelectMode ||
      showNewChatPicker ||
      activeUserId ||
      activeGroupId
    ) {
      handleCloseActiveChat();
      return;
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBackOrClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isSelectMode,
    viewUserProfile,
    showGroupInfoModal,
    showAddMemberModal,
    showCreateGroupModal,
    showNewChatPicker,
    selectedMediaPreview,
    showMediaBrowserModal,
    showShareMediaPrompt,
    showJoinByCodeModal,
    showPaymentModal,
    showExitGroupConfirm,
    deleteConfirmModal.isOpen,
    clearChatConfirmModal.isOpen,
    activeUserId,
    activeGroupId
  ]);

  // Refresh direct messages threads
  const refreshThreads = () => {
    const threadList = StorageService.getAllDirectMessageThreads(currentUser.id);
    setThreads(threadList);
    if (!isMobile && !activeUserId && threadList.length > 0) {
      setActiveUserId(threadList[0].other_user.id);
    }
  };

  // Refresh direct messages
  const refreshMessages = () => {
    if (!activeUserId) return;
    const msgs = StorageService.getDirectMessages(currentUser.id, activeUserId, currentUser.id);
    setMessages(msgs);
    StorageService.markMessagesAsRead(activeUserId, currentUser.id);
  };

  // Refresh groups and group messages
  const refreshGroupsData = () => {
    const grps = StorageService.getChatGroups();
    setGroups(grps);
    if (currentUser) {
      const invites = StorageService.getGroupInvites(currentUser.id);
      setPendingInvites(invites);
    }
    if (activeGroupId) {
      const msgs = StorageService.getChatGroupMessagesForUser(activeGroupId, currentUser.id);
      setGroupMessages(msgs);
    }
  };

  // Swift, instant group selection
  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setIsSelectMode(false);
    setSelectedMessageIds([]);
    StorageService.markGroupMessagesAsRead(groupId, currentUser.id);
    const msgs = StorageService.getChatGroupMessagesForUser(groupId, currentUser.id);
    setGroupMessages(msgs);
  };

  // Modern interactive reaction toggle handler
  const handleToggleReaction = (messageId: string, emoji: string, isGroup: boolean) => {
    if (isGroup && activeGroupId) {
      StorageService.toggleReactionGroupMessage(activeGroupId, messageId, currentUser.id, emoji, currentUser.full_name);
      const msgs = StorageService.getChatGroupMessagesForUser(activeGroupId, currentUser.id);
      setGroupMessages(msgs);
    } else if (activeUserId) {
      StorageService.toggleReactionDirectMessage(messageId, currentUser.id, emoji, currentUser.full_name);
      refreshMessages();
    }
  };

  useEffect(() => {
    refreshThreads();
    refreshGroupsData();

    // Event listeners for local and window-level custom events
    const handleGroupMsgUpdated = (e: any) => {
      const detail = e.detail;
      if (detail?.deletedForEveryone && detail?.groupId && detail?.messageId) {
        StorageService.applyRemoteGroupMessageDelete(detail.groupId, detail.messageId, true);
      }
      if (!detail || !detail.groupId || detail.groupId === activeGroupId) {
        if (activeGroupId) {
          const msgs = StorageService.getChatGroupMessagesForUser(activeGroupId, currentUser.id);
          setGroupMessages(msgs);
        }
      }
      refreshGroupsData();
    };

    const handleDirectMsgUpdated = (e: any) => {
      const detail = e.detail;
      if (detail?.deletedForEveryone && (detail?.id || detail?.messageId)) {
        StorageService.applyRemoteDirectMessageDelete(detail.id || detail.messageId, true);
      }
      if (activeUserId) {
        const msgs = StorageService.getDirectMessages(currentUser.id, activeUserId, currentUser.id);
        setMessages(msgs);
      }
      refreshThreads();
    };

    const handleProfileUpdated = () => {
      refreshThreads();
      refreshGroupsData();
    };

    window.addEventListener('gcz_group_messages_updated', handleGroupMsgUpdated);
    window.addEventListener('gcz_direct_messages_updated', handleDirectMsgUpdated);
    window.addEventListener('gcz_user_profile_updated', handleProfileUpdated);
    window.addEventListener('gcz_user_registered', handleProfileUpdated);
    window.addEventListener('gcz_users_synced', handleProfileUpdated);
    window.addEventListener('gcz_groups_updated', refreshGroupsData);

    // Cross-device Supabase Realtime Subscription (postgres_changes INSERT + broadcast)
    const unsubscribe = SupabaseSyncService.subscribeToSocialMessaging({
      onNewGroupMessage: (incomingGroupMsg) => {
        StorageService.receiveIncomingGroupMessage(incomingGroupMsg);
        if (incomingGroupMsg.group_id === activeGroupId) {
          setGroupMessages(prev => {
            if (prev.some(m => m.id === incomingGroupMsg.id)) return prev;
            return [...prev, incomingGroupMsg];
          });
        }
        refreshGroupsData();
      },
      onNewDirectMessage: (incomingDm) => {
        StorageService.receiveIncomingDirectMessage(incomingDm);
        if ((incomingDm.sender_id === activeUserId && incomingDm.receiver_id === currentUser.id) ||
            (incomingDm.sender_id === currentUser.id && incomingDm.receiver_id === activeUserId)) {
          setMessages(prev => {
            if (prev.some(m => m.id === incomingDm.id)) return prev;
            return [...prev, incomingDm];
          });
        }
        refreshThreads();
      },
      onDeleteGroupMessage: (payload) => {
        StorageService.applyRemoteGroupMessageDelete(payload.groupId, payload.messageId, payload.forEveryone);
        if (payload.groupId === activeGroupId) {
          const msgs = StorageService.getChatGroupMessagesForUser(activeGroupId, currentUser.id);
          setGroupMessages(msgs);
        }
        refreshGroupsData();
      },
      onDeleteDirectMessage: (payload) => {
        StorageService.applyRemoteDirectMessageDelete(payload.messageId, payload.forEveryone);
        if (activeUserId) {
          const msgs = StorageService.getDirectMessages(currentUser.id, activeUserId, currentUser.id);
          setMessages(msgs);
        }
        refreshThreads();
      },
      onUserProfileUpdated: () => {
        // Pull the new/updated account from Supabase and merge it into local
        // storage first — otherwise a sender who just registered (or just
        // changed their photo) on another device won't resolve to a real
        // user here, and their messages/threads won't render.
        StorageService.syncUsersWithRemote().finally(() => {
          refreshThreads();
          refreshGroupsData();
        });
      },
      onGroupMemberChanged: () => {
        refreshGroupsData();
      }
    });

    return () => {
      window.removeEventListener('gcz_group_messages_updated', handleGroupMsgUpdated);
      window.removeEventListener('gcz_direct_messages_updated', handleDirectMsgUpdated);
      window.removeEventListener('gcz_user_profile_updated', handleProfileUpdated);
      window.removeEventListener('gcz_user_registered', handleProfileUpdated);
      window.removeEventListener('gcz_users_synced', handleProfileUpdated);
      window.removeEventListener('gcz_groups_updated', refreshGroupsData);
      unsubscribe();
    };
  }, [currentUser.id, activeGroupId, activeUserId]);

  useEffect(() => {
    if (activeTab === 'direct') {
      refreshMessages();
      refreshThreads();
    } else if (activeTab === 'groups' && activeGroupId) {
      StorageService.markGroupMessagesAsRead(activeGroupId, currentUser.id);
      const msgs = StorageService.getChatGroupMessagesForUser(activeGroupId, currentUser.id);
      setGroupMessages(msgs);
    }
  }, [activeUserId, activeGroupId, activeTab]);

  useEffect(() => {
    if (activeTab === 'direct') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      groupMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, groupMessages, activeTab]);

  const activeThread = threads.find(t => t.other_user.id === activeUserId);
  const activeUser = activeThread?.other_user || (activeUserId ? StorageService.getAllUsers().find(u => u.id === activeUserId) : null);

  const isDeveloper = currentUser.role === 'developer' || arePhoneNumbersEqual(currentUser.phone, '0780699988');

  // Strict Group Visibility: only show groups user is added to, unless Developer
  const visibleGroups = isDeveloper
    ? groups
    : groups.filter(g => g.member_ids && g.member_ids.includes(currentUser.id));

  const totalUnreadDms = threads.reduce((acc, t) => acc + (t.unread_count || 0), 0);
  const totalUnreadGroups = StorageService.getTotalUnreadGroupMessagesCount(currentUser.id);

  const activeGroup = groups.find(g => g.id === activeGroupId) || (typeof window !== 'undefined' && !isMobile ? (visibleGroups[0] || null) : null);

  const groupOnlineCount = React.useMemo(() => {
    if (!activeGroup || !activeGroup.member_ids) return 0;
    const allUsers = StorageService.getAllUsers();
    return activeGroup.member_ids.reduce((acc, mid) => {
      if (mid === currentUser.id) return acc + 1;
      const u = allUsers.find(user => user.id === mid);
      if (u) {
        const lastSeen = StorageService.getUserLastSeen(u);
        if (lastSeen.toLowerCase() === 'online') return acc + 1;
      }
      return acc;
    }, 0);
  }, [activeGroup, currentUser.id]);

  const activeGroupMembership = activeGroup 
    ? StorageService.getGroupMembership(activeGroup.id, currentUser.id) 
    : undefined;
  
  // WhatsApp-style membership check: strictly whether user has exited or is in member_ids
  const hasUserExitedActiveGroup = activeGroup 
    ? StorageService.hasUserExitedGroup(activeGroup.id, currentUser.id)
    : false;

  const isJoinedGroupMember = activeGroup 
    ? Boolean(
        (activeGroup.member_ids?.includes(currentUser.id) || 
         activeGroup.created_by === currentUser.id ||
         (activeGroup.admin_ids && activeGroup.admin_ids.includes(currentUser.id))) &&
        !hasUserExitedActiveGroup &&
        !activeGroup.removed_user_ids?.includes(currentUser.id)
      )
    : false;

  const canViewActiveGroupChats = isDeveloper || isJoinedGroupMember;
  const isUserGroupMember = canViewActiveGroupChats;

  const triggerJoiningAnimation = (group: ChatGroup) => {
    setJoiningGroup(group);
    confetti({ particleCount: 35, spread: 70 });
    setTimeout(() => {
      StorageService.joinChatGroup(group.id, currentUser.id);
      refreshGroupsData();
      setActiveTab('groups');
      setActiveGroupId(group.id);
      setJoiningGroup(null);
    }, 1300);
  };

  // Foundation School membership check
  const fsMembership = StorageService.getGroupMembership('group_foundation_school', currentUser.id);
  const isFsExpiringSoon = fsMembership?.status === 'expiring_soon';

  // Export Chat History (.txt file)
  const handleExportChatHistory = (type: 'direct' | 'group') => {
    let fileName = '';
    let content = '';
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    if (type === 'direct' && activeUser) {
      fileName = `GatewayConnect_DM_${activeUser.full_name.replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.txt`;
      content = `=================================================================\n` +
        `GATEWAY CONNECT GLOBAL - DIRECT MESSAGE CHAT HISTORY\n` +
        `Participants: ${currentUser.full_name} & ${activeUser.full_name}\n` +
        `Exported: ${dateStr} at ${timeStr}\n` +
        `Total Messages: ${messages.length}\n` +
        `=================================================================\n\n` +
        messages.map(m => {
          const t = new Date(m.created_at).toLocaleString();
          const sender = m.sender_id === currentUser.id ? currentUser.full_name : activeUser.full_name;
          const replyInfo = m.reply_to ? ` [In reply to ${m.reply_to.sender_name}: "${m.reply_to.text}"]` : '';
          return `[${t}] ${sender}${replyInfo}:\n${m.text}\n`;
        }).join('\n');
    } else if (type === 'group' && activeGroup) {
      fileName = `GatewayConnect_Group_${activeGroup.name.replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.txt`;
      content = `=================================================================\n` +
        `GATEWAY CONNECT GLOBAL - CHURCH GROUP CHAT HISTORY\n` +
        `Group Name: ${activeGroup.name}\n` +
        `Category: ${activeGroup.category || 'General'}\n` +
        `Description: ${activeGroup.description}\n` +
        `Total Members: ${activeGroup.member_ids.length}\n` +
        `Exported By: ${currentUser.full_name} on ${dateStr} at ${timeStr}\n` +
        `Total Messages: ${groupMessages.length}\n` +
        `=================================================================\n\n` +
        groupMessages.map(m => {
          const t = new Date(m.created_at).toLocaleString();
          const replyInfo = m.reply_to ? ` [In reply to ${m.reply_to.sender_name}: "${m.reply_to.text}"]` : '';
          return `[${t}] ${m.sender_name} (${m.sender_role || 'member'})${replyInfo}:\n${m.text}\n`;
        }).join('\n');
    }

    if (!content) return;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCopyFeedback('Chat exported as .txt file!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // WhatsApp-style Media getter for Active Group
  const getGroupMediaItems = () => {
    if (!activeGroup) return [];
    const fromMsgs = groupMessages
      .filter(m => m.media_url && m.text !== 'This message was deleted')
      .map(m => ({
        id: m.id,
        url: m.media_url!,
        type: (m.media_type || 'image') as 'image' | 'video' | 'audio',
        caption: m.text,
        sender: m.sender_name,
        date: m.created_at
      }));

    const defaultMedia: Record<string, Array<{ id: string; url: string; type: 'image' | 'video' | 'audio'; caption: string; sender: string; date: string }>> = {
      group_ignite_worship: [
        {
          id: 'med_w1',
          url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
          type: 'image',
          caption: 'Altar Worship & Praise Night in Harare Sanctuary',
          sender: 'Apostle Joe Daniels',
          date: '2026-03-01'
        },
        {
          id: 'med_w2',
          url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
          type: 'image',
          caption: 'Sanctuary Choir & Strings Rehearsal Session',
          sender: 'Pastor Easter',
          date: '2026-03-03'
        },
        {
          id: 'med_w3',
          url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
          type: 'image',
          caption: 'Miracle Praise and Healing Service Atmosphere',
          sender: 'Chipo Moyo',
          date: '2026-03-05'
        }
      ],
      group_pride_lions: [
        {
          id: 'med_m1',
          url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80',
          type: 'image',
          caption: "Kingdom Men's Annual Leadership Breakfast Fellowship",
          sender: 'Apostle Joe Daniels',
          date: '2026-02-28'
        },
        {
          id: 'med_m2',
          url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80',
          type: 'image',
          caption: 'Brothers in Midnight Prayer Mountain Summit',
          sender: 'Tinashe Chikore',
          date: '2026-03-02'
        }
      ],
      group_passion_ladies: [
        {
          id: 'med_l1',
          url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
          type: 'image',
          caption: 'Virtuous Women Prayer & Kingdom Entrepreneurship Gala',
          sender: 'Prophetess Melinda Daniels',
          date: '2026-03-02'
        },
        {
          id: 'med_l2',
          url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&auto=format&fit=crop&q=80',
          type: 'image',
          caption: 'Daughters of Grace Worship & Prophetic Fellowship',
          sender: 'Pastor Grace',
          date: '2026-03-04'
        }
      ],
      group_foundation_school: [
        {
          id: 'med_f1',
          url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
          type: 'image',
          caption: 'Class of 2026 Discipleship Graduation Ceremony',
          sender: 'Pastor Tendai Ndlovu',
          date: '2026-02-15'
        },
        {
          id: 'med_f2',
          url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
          type: 'image',
          caption: 'Believers Foundation Manual Class Interactive Study',
          sender: 'Apostle Joe Daniels',
          date: '2026-02-22'
        }
      ]
    };

    const curated: Array<{ id: string; url: string; type: 'image' | 'video' | 'audio'; caption: string; sender: string; date: string }> = defaultMedia[activeGroup.id] || [
      {
        id: 'med_gen1',
        url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=80',
        type: 'image',
        caption: 'Gateway Church Fellowship Gathering in Harare',
        sender: 'Gateway Media',
        date: '2026-02-20'
      },
      {
        id: 'med_gen2',
        url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        type: 'image',
        caption: 'Sunday Holy Communion & Anointing Service',
        sender: 'Gateway Media',
        date: '2026-02-27'
      }
    ];

    return [...fromMsgs, ...curated];
  };

  // WhatsApp-style Share Photo to Group
  const handleShareMediaToGroup = (url: string, caption?: string) => {
    if (!activeGroup || !url.trim()) return;
    if (StorageService.hasUserExitedGroup(activeGroup.id, currentUser.id)) {
      alert('You cannot send media because you exited this group fellowship. Please rejoin to participate.');
      return;
    }
    StorageService.sendChatGroupMessage(activeGroup.id, {
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      sender_avatar: currentUser.avatar_url,
      sender_role: currentUser.role,
      text: caption?.trim() || 'Shared a photo',
      media_url: url.trim(),
      media_type: 'image'
    });
    setShareMediaUrl('');
    setShareMediaCaption('');
    setShowShareMediaPrompt(false);
    refreshGroupsData();
    setCopyFeedback('Media shared to group!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleSendMessage = (textToSend?: string) => {
    const content = textToSend || inputText;
    if (!content.trim() || !activeUserId || !activeUser) return;

    const replyPayload = replyingToMessage 
      ? { id: replyingToMessage.id, sender_name: replyingToMessage.sender_name, text: replyingToMessage.text } 
      : undefined;

    StorageService.sendDirectMessage(currentUser.id, activeUserId, content.trim(), replyPayload);
    setInputText('');
    setReplyingToMessage(null);
    refreshMessages();
    refreshThreads();
  };

  const handleSendGroupMessage = (textToSend?: string) => {
    const content = textToSend || groupInputText;
    if (!content.trim() || !activeGroup) return;

    // Strictly block only members who exited that exact group
    if (StorageService.hasUserExitedGroup(activeGroup.id, currentUser.id)) {
      alert('You cannot send messages anymore because you exited this group fellowship. Please rejoin the group to participate in discussions.');
      return;
    }

    // Check paid membership
    if (activeGroup.is_paid && !isUserGroupMember && !isSuperAdminOrDev) {
      openPaymentModal(activeGroup, `To post in ${activeGroup.name}, please complete your $${activeGroup.price_usd || 150} membership enrollment.`);
      return;
    }

    const messagePayload: any = {
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      sender_avatar: currentUser.avatar_url,
      sender_role: currentUser.role,
      text: content.trim()
    };

    if (replyingToMessage) {
      messagePayload.reply_to = {
        id: replyingToMessage.id,
        sender_name: replyingToMessage.sender_name,
        text: replyingToMessage.text
      };
    }

    StorageService.sendChatGroupMessage(activeGroup.id, messagePayload);

    setGroupInputText('');
    setReplyingToMessage(null);
    setMentionSuggestionsOpen(false);
    refreshGroupsData();
  };

  // WhatsApp-style @ Tag User Handler
  const handleQuickTagUser = (userName: string) => {
    setGroupInputText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} @${userName} ` : `@${userName} `;
    });
    setMentionSuggestionsOpen(false);
    setTimeout(() => {
      groupInputRef.current?.focus();
    }, 50);
  };

  // WhatsApp-style Exit Group Handler - Keep user in the active group view so they see the non-member restriction
  const handleExitActiveGroup = () => {
    if (!activeGroup) return;
    const res = StorageService.leaveChatGroup(activeGroup.id, currentUser.id);
    if (res.success) {
      setShowExitGroupConfirm(false);
      setShowGroupInfoModal(false);
      refreshGroupsData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gcz_groups_updated'));
      }
      setCopyFeedback(`You left ${activeGroup.name}`);
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  // WhatsApp-style Group Input change with autocomplete detection & typing indicator
  const handleGroupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGroupInputText(val);

    if (activeGroupId) {
      window.dispatchEvent(new CustomEvent('gcz_user_typing', {
        detail: {
          userId: currentUser.id,
          userName: currentUser.full_name,
          groupId: activeGroupId,
          isTyping: val.length > 0
        }
      }));
    }

    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1) {
      const textAfterAt = val.slice(lastAt + 1);
      if (!textAfterAt.includes('  ') && textAfterAt.length <= 15) {
        setMentionFilter(textAfterAt.toLowerCase());
        setMentionSuggestionsOpen(true);
        return;
      }
    }
    setMentionSuggestionsOpen(false);
  };

  const handleSelectMentionUser = (userName: string) => {
    const lastAt = groupInputText.lastIndexOf('@');
    if (lastAt !== -1) {
      const beforeAt = groupInputText.slice(0, lastAt);
      const newText = `${beforeAt}@${userName} `;
      setGroupInputText(newText);
    } else {
      setGroupInputText(prev => `${prev} @${userName} `);
    }
    setMentionSuggestionsOpen(false);
    setTimeout(() => {
      groupInputRef.current?.focus();
    }, 50);
  };

  // Open user profile preview on clicking @mention or avatar
  const handleOpenUserProfile = (userNameOrHandle: string) => {
    const clean = userNameOrHandle.replace('@', '').trim().toLowerCase();
    const allUsers = StorageService.getAllUsers();
    const match = allUsers.find(u => 
      u.full_name.toLowerCase() === clean || 
      u.full_name.toLowerCase().includes(clean) ||
      (u.handle && u.handle.toLowerCase().replace('@', '') === clean)
    );
    if (match) {
      setViewUserProfile(match);
    } else {
      alert(`@${userNameOrHandle} is a fellowship member.`);
    }
  };

  // Helper to render message text highlighting @mentions with blue clickable links (WhatsApp style)
  const renderFormattedMessageText = (text: string) => {
    if (text === 'This message was deleted') {
      return (
        <span className="italic opacity-60 flex items-center gap-1.5 py-0.5">
          <span className="w-2 h-2 rounded-full bg-current opacity-40 inline-block" />
          <span>This message was deleted</span>
        </span>
      );
    }

    // Split by @mentions or URLs (http/https)
    const parts = text.split(/(@[A-Za-z0-9_'\s]+?(?=\s@|\s[.,!?]|$|[.,!?])|https?:\/\/[^\s]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const rawName = part.slice(1).trim();
        return (
          <button
            key={index}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenUserProfile(rawName);
            }}
            className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-2 cursor-pointer inline-flex items-center gap-0.5 mx-0.5"
            title={`View profile of ${rawName}`}
          >
            @{rawName}
          </button>
        );
      }
      if (/^https?:\/\//i.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-medium break-all inline-flex items-center gap-0.5 mx-0.5"
            title={`Open link: ${part}`}
          >
            <span>{part}</span>
            <ExternalLink className="w-3 h-3 inline-block shrink-0" />
          </a>
        );
      }
      return part;
    });
  };

  // Helper to render message content and interactive official invite cards with 1st "Join" and 2nd "Decline" buttons
  const renderMessageContent = (msg: { id: string; text: string; sender_id: string; deleted_for_everyone?: boolean }) => {
    const isDeleted = Boolean((msg as any).deleted_for_everyone || msg.text === 'This message was deleted');
    if (isDeleted) {
      return renderFormattedMessageText('This message was deleted');
    }

    const hasInviteLink = msg.text.includes('gatewayconnect.church/join/group?code=') || msg.text.includes('Official Group Invitation:');
    if (!hasInviteLink) {
      return renderFormattedMessageText(msg.text);
    }

    // Extract group code or matching group
    const codeMatch = msg.text.match(/code=([a-zA-Z0-9_-]+)/);
    const code = codeMatch ? codeMatch[1].toLowerCase() : null;
    const inviteValidation = code ? StorageService.validateGroupInviteCode(code) : null;
    const isLinkReset = inviteValidation?.status === 'reset';
    const matchedGroup = (inviteValidation?.group) || groups.find(g => 
      (code && g.invite_code.toLowerCase() === code) || 
      msg.text.toLowerCase().includes(g.name.toLowerCase())
    );

    const isMember = matchedGroup ? matchedGroup.member_ids.includes(currentUser.id) : false;
    const isDeclined = matchedGroup ? declinedInviteCodes.includes(matchedGroup.id) : false;
    const matchingPendingInvite = matchedGroup ? pendingInvites.find(inv => inv.group_id === matchedGroup.id) : null;

    return (
      <div className="space-y-2.5">
        <div>{renderFormattedMessageText(msg.text)}</div>

        {matchedGroup && (
          <div className="bg-card border border-border rounded-xl p-3 space-y-2.5 text-xs shadow-md text-foreground max-w-sm mt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {matchedGroup.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-primary" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary">Official Group Invitation</span>
                </div>
                <h4 className="font-bold text-foreground text-xs truncate">{matchedGroup.name}</h4>
                <p className="text-[10px] text-muted-foreground">{matchedGroup.member_ids.length} members • Official Admin & Mod Link</p>
              </div>
            </div>

            {isLinkReset ? (
              <div className="bg-red-950/70 border border-red-500/40 rounded-xl p-2.5 text-center text-xs text-red-300 font-semibold space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-red-400 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Invite Link Reset</span>
                </div>
                <p className="text-[11px]">Can't join because this invite link was reset.</p>
              </div>
            ) : isMember ? (
              <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-xl p-2 text-center text-[11px] text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>You are an active member of this group</span>
              </div>
            ) : isDeclined ? (
              <div className="bg-red-950/60 border border-red-500/30 rounded-xl p-2 text-center text-[11px] text-red-300 space-y-1">
                <p className="font-semibold">You declined this invitation</p>
                <button
                  type="button"
                  onClick={() => {
                    setDeclinedInviteCodes(prev => prev.filter(id => id !== matchedGroup.id));
                    if (matchingPendingInvite) {
                      handleRespondToInvite(matchingPendingInvite.id, true);
                    } else {
                      const validation = StorageService.validateGroupInviteCode(code || matchedGroup.invite_code);
                      if (validation.status === 'reset') {
                        alert("Can't join because this invite link was reset.");
                        return;
                      }
                      triggerJoiningAnimation(matchedGroup);
                    }
                  }}
                  className="text-[10px] text-primary underline font-bold hover:text-primary/80"
                >
                  Change Mind & Join
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                {/* 1st button: Join */}
                <button
                  type="button"
                  onClick={() => {
                    if (matchingPendingInvite) {
                      handleRespondToInvite(matchingPendingInvite.id, true);
                    } else {
                      const validation = StorageService.validateGroupInviteCode(code || matchedGroup.invite_code);
                      if (validation.status === 'reset') {
                        alert("Can't join because this invite link was reset.");
                        return;
                      }
                      triggerJoiningAnimation(matchedGroup);
                    }
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Join</span>
                </button>

                {/* 2nd button: Decline */}
                <button
                  type="button"
                  onClick={() => {
                    setDeclinedInviteCodes(prev => [...prev, matchedGroup.id]);
                    if (matchingPendingInvite) {
                      handleRespondToInvite(matchingPendingInvite.id, false);
                    } else {
                      alert(`You declined the invitation to join ${matchedGroup.name}. You will not join this group.`);
                    }
                  }}
                  className="flex-1 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Decline</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // WhatsApp-Style Multi-Select & Deletion Handlers
  const handleToggleSelectMessage = (msgId: string) => {
    setSelectedMessageIds(prev => 
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  };

  const handleStartSelectMode = (initialId?: string) => {
    setIsSelectMode(true);
    if (initialId) {
      setSelectedMessageIds([initialId]);
    } else {
      setSelectedMessageIds([]);
    }
    setShowDirectTopMenu(false);
    setShowGroupTopMenu(false);
  };

  const handleCancelSelectMode = () => {
    setIsSelectMode(false);
    setSelectedMessageIds([]);
  };

  const handleDeleteSelected = (isGroup: boolean) => {
    if (selectedMessageIds.length === 0) return;

    if (isGroup) {
      const isGroupAdmin = (activeGroup?.admin_ids || [activeGroup?.created_by]).includes(currentUser.id) || isPrivilegedAdminOrDev;
      const allMine = selectedMessageIds.every(id => {
        const m = groupMessages.find(msg => msg.id === id);
        return m?.sender_id === currentUser.id;
      });

      setDeleteConfirmModal({
        isOpen: true,
        isMultiple: true,
        canDeleteForEveryone: allMine || isGroupAdmin || isPrivilegedAdminOrDev,
        isGroup: true
      });
    } else {
      const allMine = selectedMessageIds.every(id => {
        const m = messages.find(msg => msg.id === id);
        return m?.sender_id === currentUser.id;
      });

      setDeleteConfirmModal({
        isOpen: true,
        isMultiple: true,
        canDeleteForEveryone: allMine || isPrivilegedAdminOrDev,
        isGroup: false
      });
    }
  };

  const handleDeleteSingleMessage = (msgId: string, isGroup: boolean) => {
    if (isGroup) {
      const msg = groupMessages.find(m => m.id === msgId);
      if (!msg) return;
      const isMine = msg.sender_id === currentUser.id;
      const isGroupAdmin = (activeGroup?.admin_ids || [activeGroup?.created_by]).includes(currentUser.id) || isPrivilegedAdminOrDev;

      setDeleteConfirmModal({
        isOpen: true,
        isMultiple: false,
        targetMessageId: msgId,
        canDeleteForEveryone: isMine || isGroupAdmin || isPrivilegedAdminOrDev,
        isGroup: true
      });
    } else {
      const msg = messages.find(m => m.id === msgId);
      if (!msg) return;
      const isMine = msg.sender_id === currentUser.id;

      setDeleteConfirmModal({
        isOpen: true,
        isMultiple: false,
        targetMessageId: msgId,
        canDeleteForEveryone: isMine || isPrivilegedAdminOrDev,
        isGroup: false
      });
    }
  };

  const handleConfirmDelete = (forEveryone: boolean) => {
    if (deleteConfirmModal.isGroup) {
      if (deleteConfirmModal.isMultiple) {
        StorageService.deleteMultipleChatGroupMessages(activeGroupId, selectedMessageIds, currentUser.id, forEveryone);
      } else if (deleteConfirmModal.targetMessageId) {
        StorageService.deleteChatGroupMessage(activeGroupId, deleteConfirmModal.targetMessageId, currentUser.id, forEveryone);
      }
      if (activeGroupId) {
        const msgs = StorageService.getChatGroupMessagesForUser(activeGroupId, currentUser.id);
        setGroupMessages(msgs);
      }
      refreshGroupsData();
    } else {
      if (deleteConfirmModal.isMultiple) {
        StorageService.deleteMultipleDirectMessages(selectedMessageIds, currentUser.id, forEveryone);
      } else if (deleteConfirmModal.targetMessageId) {
        StorageService.deleteDirectMessage(deleteConfirmModal.targetMessageId, currentUser.id, forEveryone);
      }
      if (activeUserId) {
        const msgs = StorageService.getDirectMessages(currentUser.id, activeUserId, currentUser.id);
        setMessages(msgs);
      }
      refreshMessages();
      refreshThreads();
    }

    setDeleteConfirmModal({ isOpen: false, isMultiple: false, canDeleteForEveryone: false, isGroup: false });
    setSelectedMessageIds([]);
    setIsSelectMode(false);
  };

  const handleExecuteClearChat = () => {
    if (clearChatConfirmModal.isGroup) {
      StorageService.clearChatGroupMessagesForUser(activeGroupId, currentUser.id);
      setGroupMessages([]);
      refreshGroupsData();
    } else {
      StorageService.clearDirectMessagesForUser(currentUser.id, activeUserId, currentUser.id);
      setMessages([]);
      refreshMessages();
      refreshThreads();
    }
    setClearChatConfirmModal({ isOpen: false, isGroup: false, title: '' });
  };

  const handleJoinGroup = (group: ChatGroup) => {
    if (group.is_paid && !isSuperAdminOrDev) {
      openPaymentModal(group);
      return;
    }

    const res = StorageService.joinChatGroup(group.id, currentUser.id);
    if (res.success) {
      confetti({ particleCount: 35, spread: 60 });
      refreshGroupsData();
    }
  };

  const openPaymentModal = (group: ChatGroup, noticeMsg?: string) => {
    setPaymentTargetGroup(group);
    setPaymentNoticeMessage(noticeMsg || null);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    if (!paymentTargetGroup) return;
    setIsProcessingPayment(true);
    const price = paymentTargetGroup.price_usd || 150;
    const payment = await PaynowService.initiateTransaction({
      reference: `GCZ-GROUP-${Date.now().toString().slice(-8)}`,
      amount: price,
      additionalInfo: `Fellowship enrollment - ${paymentTargetGroup.name}`,
      phone: paymentPhone,
      paymentMethod: paymentMethod === 'ecocash' ? 'EcoCash' : paymentMethod === 'innbucks' ? 'InnBucks' : 'Card'
    });
    if (!payment.success || !payment.pollUrl) {
      setPaymentNoticeMessage(payment.error || 'Payment could not be started. Membership was not activated.');
      setIsProcessingPayment(false);
      return;
    }
    if (payment.browserUrl) window.open(payment.browserUrl, '_blank', 'noopener,noreferrer');
    const result = await PaynowService.waitForPayment(payment.pollUrl);
    const res = result.isPaid
      ? StorageService.joinChatGroup(paymentTargetGroup.id, currentUser.id, price)
      : { success: false, message: `Payment status: ${result.status}. Membership was not activated.` };
    setIsProcessingPayment(false);
    if (!res.success) {
      setPaymentNoticeMessage(res.message);
      return;
    }
    setShowPaymentModal(false);
    confetti({ particleCount: 60, spread: 80 });
    refreshGroupsData();
    refreshThreads();
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const created = StorageService.createChatGroup({
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || 'Apostolic fellowship & study cell.',
      category: newGroupCategory,
      avatar_url: newGroupAvatar.trim() || undefined,
      created_by: currentUser.id,
      creator_name: currentUser.full_name,
      is_paid: newGroupIsPaid,
      price_usd: newGroupIsPaid ? newGroupPrice : undefined,
      duration_months: newGroupIsPaid ? newGroupDuration : undefined,
      pinned_notice: newGroupPinnedNotice.trim() || undefined,
      initial_member_ids: [currentUser.id]
    });

    confetti({ particleCount: 40, spread: 70 });
    setShowCreateGroupModal(false);
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupAvatar('');
    setNewGroupIsPaid(false);
    setNewGroupPinnedNotice('');
    refreshGroupsData();
    setActiveGroupId(created.id);
  };

  const handleAddMemberToGroup = (targetUser: User) => {
    if (!activeGroup) return;
    const res = StorageService.sendGroupInvite(activeGroup.id, targetUser.id, currentUser.id);
    setShowAddMemberModal(false);
    refreshGroupsData();
    alert(res.message);
  };

  const handleRespondToInvite = (inviteId: string, accept: boolean) => {
    const res = StorageService.respondToGroupInvite(inviteId, accept);
    if (res.success && accept) {
      confetti({ particleCount: 30, spread: 60 });
    }
    refreshGroupsData();
  };

  const handleCopyLink = (code: string) => {
    const link = `https://gatewayconnect.church/join/group?code=${code}`;
    navigator.clipboard?.writeText(link);
    setCopyFeedback('Invite link copied!');
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleJoinByCode = () => {
    if (!inviteCodeInput.trim()) return;
    setInviteLinkError(null);
    const result = StorageService.validateGroupInviteCode(inviteCodeInput.trim());

    if (result.status === 'reset') {
      setInviteLinkError("Can't join because this invite link was reset.");
      return;
    }

    if (result.status === 'invalid' || !result.group) {
      setInviteLinkError("Invalid group invite link or code. Please check with group admin.");
      return;
    }

    const grp = result.group;

    // If user was removed from this group by an admin
    if (grp.removed_user_ids?.includes(currentUser.id)) {
      setInviteLinkError(`You were removed from ${grp.name} by an admin. You cannot rejoin via invite.`);
      return;
    }

    // If user is already in this group
    if (grp.member_ids.includes(currentUser.id)) {
      setShowJoinByCodeModal(false);
      setInviteCodeInput('');
      setActiveGroupId(grp.id);
      setActiveTab('groups');
      return;
    }

    setShowJoinByCodeModal(false);
    setInviteCodeInput('');
    triggerJoiningAnimation(grp);
  };

  // Contacts filtering and sorting
  const roleWeight: Record<string, number> = {
    super_admin: 1,
    developer: 2,
    pastor: 3,
    moderator: 4,
    member: 5
  };

  const prioritizedContacts = StorageService.getAllUsers()
    .filter(u => u.id !== currentUser.id)
    .sort((a, b) => {
      const wA = roleWeight[a.role] || 99;
      const wB = roleWeight[b.role] || 99;
      if (wA !== wB) return wA - wB;
      return a.full_name.localeCompare(b.full_name);
    });

  const filteredContacts = prioritizedContacts.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.handle && u.handle.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredThreads = threads
    .filter(t => {
      const matchesSearch = t.other_user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.other_user.role && t.other_user.role.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
      if (threadFilter === 'unread') return t.unread_count > 0;
      if (threadFilter === 'pinned') return pinnedDms.includes(t.other_user.id);
      return true;
    })
    .sort((a, b) => {
      const aP = pinnedDms.includes(a.other_user.id) ? 1 : 0;
      const bP = pinnedDms.includes(b.other_user.id) ? 1 : 0;
      return bP - aP;
    });

  const filteredGroups = visibleGroups
    .filter(g => {
      const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.category && g.category.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
      const isMember = g.member_ids.includes(currentUser.id);
      if (groupFilter === 'joined') return isMember;
      if (groupFilter === 'paid') return Boolean(g.is_paid);
      if (groupFilter === 'open') return !g.is_paid;
      return true;
    })
    .sort((a, b) => {
      const aP = a.pinned_by_users?.includes(currentUser.id) ? 1 : 0;
      const bP = b.pinned_by_users?.includes(currentUser.id) ? 1 : 0;
      return bP - aP;
    });

  const isMobileChatActive = isMobile && ((activeTab === 'direct' && Boolean(activeUserId) && !showNewChatPicker) || (activeTab === 'groups' && Boolean(activeGroupId)));

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-card border-0 sm:border border-border/80 rounded-none sm:rounded-2xl w-full max-w-4xl h-[100dvh] sm:h-[88vh] sm:max-h-[820px] flex flex-col shadow-2xl overflow-hidden text-card-foreground animate-in slide-in-from-bottom-3 sm:zoom-in-95 duration-200 pb-[env(safe-area-inset-bottom,0px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull/Drag handle indicator */}
        {!isMobileChatActive && (
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto my-1.5 sm:hidden shrink-0" />
        )}

        {/* Global Local Storage Media Picker: image, video, audio, document */}
        <input
          ref={mediaFileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
          onChange={handleLocalMediaSelect}
          className="hidden"
        />

        {/* Top Header Bar & Mode Selector (Seamlessly hides on mobile when chatting to give full native chat screen) */}
        <div className={`h-14 bg-card border-b border-border/80 px-3 sm:px-4 ${isMobileChatActive ? 'hidden sm:flex' : 'flex'} items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="bg-secondary/70 p-1 rounded-xl border border-border/60 flex items-center gap-1">
              <button
                id="tab-direct-messages"
                onClick={() => {
                  setActiveTab('direct');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                  activeTab === 'direct'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Direct Chats</span>
                {totalUnreadDms > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'direct' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-emerald-500 text-white'
                  }`}>
                    {totalUnreadDms}
                  </span>
                )}
              </button>

              <button
                id="tab-church-groups"
                onClick={() => {
                  setActiveTab('groups');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                  activeTab === 'groups'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Groups</span>
                {totalUnreadGroups > 0 ? (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'groups' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-emerald-500 text-white'
                  }`}>
                    {totalUnreadGroups}
                  </span>
                ) : (
                  visibleGroups.length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'groups' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-foreground'
                    }`}>
                      {visibleGroups.length}
                    </span>
                  )
                )}
                {pendingInvites.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-destructive animate-ping" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {copyFeedback && (
              <span className="hidden sm:inline text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 animate-fade-in font-medium">
                {copyFeedback}
              </span>
            )}

            {/* Quick close active chat button if a conversation is open on desktop */}
            {(activeUserId || activeGroupId) && (
              <button
                onClick={handleCloseActiveChat}
                className="hidden sm:flex text-xs px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border items-center gap-1 font-medium transition-colors cursor-pointer"
                title="Close active chat (stay in chat box)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Close Chat</span>
              </button>
            )}

            {/* Top Outer X Button: ALWAYS closes the chatting app back to home or previous page */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              title="Close chatting app (back to previous page)"
              aria-label="Close chatting app"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-Column Split: Threads/Groups List & Active Canvas */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN (Sidebar for Direct Messages OR Church Groups) */}
          {/* ========================================================================= */}
          <div className={`w-full md:w-84 lg:w-92 bg-card border-r border-border/80 flex flex-col relative min-w-0 ${
            isMobileChatActive ? 'hidden md:flex' : 'flex'
          }`}>
            
            {/* Search & Actions Bar */}
            <div className="p-3 border-b border-border/60 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'direct'
                      ? (showNewChatPicker ? "Search all believers..." : "Search messages...")
                      : "Search church groups..."
                  }
                  className="w-full bg-secondary/70 border border-border/70 rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {activeTab === 'direct' ? (
                <button
                  id="btn-new-chat-plus"
                  onClick={() => setShowNewChatPicker(!showNewChatPicker)}
                  title={showNewChatPicker ? "View Conversations" : "New Chat (+)"}
                  className={`p-2 rounded-xl transition-all font-semibold flex items-center justify-center shrink-0 shadow-sm ${
                    showNewChatPicker 
                      ? 'bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25' 
                      : 'bg-primary text-primary-foreground hover:brightness-105'
                  }`}
                >
                  {showNewChatPicker ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowJoinByCodeModal(true)}
                    title="Join via link or code"
                    className="p-2 rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-semibold cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  {isAdminOrDev && (
                    <button
                      id="btn-create-church-group"
                      onClick={() => setShowCreateGroupModal(true)}
                      title="Create Church Group"
                      className="p-2 rounded-xl bg-primary text-primary-foreground hover:brightness-105 transition-all font-semibold shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Filter Chips row */}
            {!showNewChatPicker && (
              <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-border/50 text-[11px] bg-secondary/20">
                {activeTab === 'direct' ? (
                  <>
                    <button
                      onClick={() => setThreadFilter('all')}
                      className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        threadFilter === 'all'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setThreadFilter('unread')}
                      className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                        threadFilter === 'unread'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span>Unread</span>
                      {totalUnreadDms > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                    <button
                      onClick={() => setThreadFilter('pinned')}
                      className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                        threadFilter === 'pinned'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Pin className="w-2.5 h-2.5" />
                      <span>Pinned</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setGroupFilter('all')}
                      className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        groupFilter === 'all'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setGroupFilter('joined')}
                      className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        groupFilter === 'joined'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      My Fellowships
                    </button>
                    <button
                      onClick={() => setGroupFilter('paid')}
                      className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                        groupFilter === 'paid'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Crown className="w-2.5 h-2.5 text-amber-400" />
                      <span>Discipleship</span>
                    </button>
                    <button
                      onClick={() => setGroupFilter('open')}
                      className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        groupFilter === 'open'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Free / Open
                    </button>
                  </>
                )}
              </div>
            )}

            {/* DIRECT CHATS VIEW */}
            {activeTab === 'direct' && (
              <>
                {showNewChatPicker ? (
                  <div className="flex-1 overflow-y-auto divide-y divide-border">
                    <div className="px-3 py-2 bg-secondary/80 text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border">
                      <Users className="w-3.5 h-3.5" />
                      <span>Start New Chat (Prioritized)</span>
                    </div>
                    {filteredContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => {
                          setActiveUserId(contact.id);
                          setShowNewChatPicker(false);
                          setSearchQuery('');
                        }}
                        className="w-full p-3 flex items-center gap-3 transition-colors text-left hover:bg-secondary/60"
                      >
                        <div className="w-10 h-10 rounded-full border border-border overflow-hidden bg-secondary flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {contact.avatar_url ? (
                            <img src={contact.avatar_url} alt={contact.full_name} className="w-full h-full object-cover" />
                          ) : (
                            contact.full_name.slice(0, 2).toUpperCase()
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-foreground truncate flex items-center gap-1">
                              {contact.full_name}
                            </span>
                            {contact.role === 'super_admin' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold border border-primary/20">
                                Apostle
                              </span>
                            )}
                            {contact.role === 'developer' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                                Dev
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate font-mono">
                            {contact.handle || `@${contact.full_name.toLowerCase().replace(/\s+/g, '_')}`} • {contact.location || 'Harare'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto py-1">
                    {filteredThreads.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-xs space-y-2">
                        <p>No active conversations yet.</p>
                        <button
                          onClick={() => setShowNewChatPicker(true)}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:brightness-105 transition-colors inline-flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Start a chat</span>
                        </button>
                      </div>
                    ) : (
                      filteredThreads.map((thread) => {
                        const isSelected = thread.other_user.id === activeUserId;
                        return (
                          <button
                            key={thread.other_user.id}
                            onClick={() => setActiveUserId(thread.other_user.id)}
                            className={`w-[calc(100%-16px)] mx-2 my-1 px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer ${
                              isSelected ? 'bg-primary/15 text-foreground font-medium shadow-xs ring-1 ring-primary/20' : 'hover:bg-secondary/60 text-foreground'
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div className="w-11 h-11 rounded-full border border-border overflow-hidden bg-secondary flex items-center justify-center text-primary font-bold text-sm">
                                {thread.other_user.avatar_url ? (
                                  <img src={thread.other_user.avatar_url} alt={thread.other_user.full_name} className="w-full h-full object-cover" />
                                ) : (
                                  thread.other_user.full_name.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-semibold text-xs text-foreground truncate flex items-center gap-1">
                                  {pinnedDms.includes(thread.other_user.id) && (
                                    <Pin className="w-3 h-3 text-primary fill-primary shrink-0" />
                                  )}
                                  <span>{thread.other_user.full_name}</span>
                                  {thread.other_user.role === 'super_admin' && (
                                    <span className="text-[10px] text-primary">✦</span>
                                  )}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(thread.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {thread.last_message.sender_id === currentUser.id ? 'You: ' : ''}
                                {thread.last_message.text}
                              </p>
                            </div>

                            {thread.unread_count > 0 && (
                              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                                {thread.unread_count}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}

            {/* CHURCH GROUPS VIEW */}
            {activeTab === 'groups' && (
              <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-border min-w-0 w-full">
                {/* Pending WhatsApp Invites */}
                {pendingInvites.length > 0 && (
                  <div className="p-3 bg-secondary/80 border-b border-border space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Official Group Invitations ({pendingInvites.length})</span>
                    </div>
                    {pendingInvites.map(inv => (
                      <div key={inv.id} className="bg-card border border-border rounded-xl p-3 space-y-2 text-xs shadow-sm">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {inv.group_name.slice(0, 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-xs truncate">{inv.group_name}</p>
                            <p className="text-muted-foreground text-[11px] leading-tight">
                              Invited by <span className="font-semibold text-primary">{inv.invited_by_name}</span>
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic bg-secondary px-2 py-1 rounded-md border border-border">
                          Official Admin & Moderator Invitation Link
                        </p>
                        <div className="flex items-center gap-2 pt-1 border-t border-border">
                          <button
                            onClick={() => handleRespondToInvite(inv.id, true)}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" /> Join
                          </button>
                          <button
                            onClick={() => handleRespondToInvite(inv.id, false)}
                            className="flex-1 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Groups List */}
                {filteredGroups.map(grp => {
                  const isSelected = grp.id === activeGroupId;
                  const isMember = grp.member_ids.includes(currentUser.id);
                  const isFs = grp.id === 'group_foundation_school' || grp.id === 'group_international_school_of_mentorship' || grp.id === 'group_isn_mentorship';
                  const grpUnread = StorageService.getUnreadGroupMessagesCount(grp.id, currentUser.id);
                  const grpMsgs = StorageService.getChatGroupMessagesForUser(grp.id, currentUser.id);
                  const lastMsg = grpMsgs[grpMsgs.length - 1];
                  const lastMsgTime = lastMsg?.created_at ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                  return (
                    <button
                      key={grp.id}
                      onClick={() => handleSelectGroup(grp.id)}
                      className={`w-[calc(100%-16px)] max-w-[calc(100%-16px)] mx-2 my-1 px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer min-w-0 overflow-hidden box-border ${
                        isSelected ? 'bg-primary/15 text-foreground font-medium shadow-xs ring-1 ring-primary/20' : 'hover:bg-secondary/60 text-foreground'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-xl border border-border overflow-hidden bg-secondary flex items-center justify-center text-primary font-bold text-sm shadow-sm">
                          {grp.avatar_url ? (
                            <img src={grp.avatar_url} alt={grp.name} className="w-full h-full object-cover" />
                          ) : isFs ? (
                            <GraduationCap className="w-6 h-6 text-primary" />
                          ) : (
                            grp.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        {grp.is_paid && (
                          <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow-sm" title="Paid Group">
                            <Crown className="w-3 h-3 fill-current" />
                          </span>
                        )}
                        {grpUnread > 0 && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center justify-between gap-1.5 mb-0.5 min-w-0">
                          <h4 className={`text-xs sm:text-sm flex items-center gap-1 min-w-0 flex-1 overflow-hidden ${
                            grpUnread > 0 ? 'font-bold text-foreground' : 'font-semibold text-foreground/90'
                          }`}>
                            {grp.pinned_by_users?.includes(currentUser.id) && (
                              <Pin className="w-3 h-3 text-primary fill-primary shrink-0" />
                            )}
                            <span className="truncate min-w-0 block">{grp.name}</span>
                          </h4>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {lastMsgTime && (
                              <span className={`text-[10px] whitespace-nowrap ${grpUnread > 0 ? 'text-emerald-500 font-bold' : 'text-muted-foreground'}`}>
                                {lastMsgTime}
                              </span>
                            )}
                            {grp.is_paid ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 shrink-0 whitespace-nowrap">
                                ${grp.price_usd}/3m
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <p className={`text-[11px] truncate flex-1 min-w-0 ${
                            grpUnread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}>
                            {lastMsg 
                              ? `${lastMsg.sender_name ? `${lastMsg.sender_name.split(' ')[0]}: ` : ''}${lastMsg.text || (lastMsg.media_type ? `📷 ${lastMsg.media_type}` : 'New message')}`
                              : grp.description
                            }
                          </p>

                          {grpUnread > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-black shrink-0 min-w-4 text-center shadow-sm">
                              {grpUnread}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 min-w-0">
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-secondary text-muted-foreground font-semibold uppercase tracking-wider border border-border shrink-0">
                            {grp.category || 'Group'}
                          </span>

                          <span className="text-[10px] text-muted-foreground truncate">
                            {grp.member_ids.length} members
                          </span>

                          {isMember ? (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 ml-auto">
                              <Check className="w-2.5 h-2.5" /> Enrolled
                            </span>
                          ) : (
                            <span className="text-[9px] text-primary font-semibold ml-auto">
                              {grp.is_paid ? 'Tap to Enroll' : 'Tap to Join'}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

              </div>
            )}

            {/* Mobile Floating Action Buttons (FABs) - Sleek & Compact */}
            <div className="sm:hidden absolute bottom-3 right-3 z-20 flex items-center gap-1.5 pointer-events-auto">
              {activeTab === 'direct' ? (
                <button
                  id="fab-mobile-new-chat"
                  type="button"
                  onClick={() => setShowNewChatPicker(prev => !prev)}
                  className="h-9 px-3 rounded-full bg-primary hover:brightness-105 text-primary-foreground font-semibold shadow-md active:scale-95 transition-all border border-primary/30 cursor-pointer flex items-center gap-1.5"
                  title="Start New Direct Chat"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">New Chat</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowJoinByCodeModal(true)}
                    className="h-8 px-2.5 rounded-full bg-card/95 backdrop-blur-sm text-foreground border border-border font-medium shadow-sm text-[10px] active:scale-95 transition-all flex items-center gap-1"
                    title="Join with Invite Code"
                  >
                    <ExternalLink className="w-3 h-3 text-primary" />
                    <span>Join Code</span>
                  </button>
                  <button
                    id="fab-mobile-new-group"
                    type="button"
                    onClick={() => setShowCreateGroupModal(true)}
                    className="h-9 px-3 rounded-full bg-primary hover:brightness-105 text-primary-foreground font-semibold shadow-md active:scale-95 transition-all border border-primary/30 cursor-pointer flex items-center gap-1.5"
                    title="Create Church Group"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">New Group</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN (Active Conversation Canvas for Direct OR Group) */}
          {/* ========================================================================= */}
          <div className={`flex-1 flex flex-col bg-background min-w-0 overflow-hidden ${
            (activeTab === 'direct' ? !activeUserId : !activeGroupId) ? 'hidden md:flex' : 'flex'
          }`}>
            
            {/* DIRECT CHAT ACTIVE CANVAS */}
            {activeTab === 'direct' && (
              activeUser ? (
                <>
                  {/* Direct Chat Header */}
                  {isSelectMode ? (
                    <div className="h-14 bg-card border-b border-border px-4 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleCancelSelectMode}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                          title="Cancel selection"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <span className="font-semibold text-sm text-foreground">
                          {selectedMessageIds.length} selected
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteSelected(false)}
                          disabled={selectedMessageIds.length === 0}
                          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 disabled:opacity-40 transition-colors cursor-pointer"
                          title="Delete selected messages"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelSelectMode}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors font-medium border border-border"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-16 bg-card border-b border-border px-3 sm:px-4 flex items-center justify-between shrink-0 shadow-xs">
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <button
                          onClick={handleBackOrClose}
                          className="md:hidden p-2 -ml-1 rounded-full hover:bg-secondary text-muted-foreground active:scale-95 transition-transform cursor-pointer"
                          title="Back to conversations"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewUserProfile(activeUser)}
                          className="flex items-center gap-2.5 text-left p-1 rounded-xl hover:bg-secondary/60 transition-colors cursor-pointer min-w-0"
                          title="View profile"
                        >
                          <div className="relative w-10 h-10 rounded-full border border-border overflow-hidden bg-secondary flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {activeUser.avatar_url ? (
                              <img src={activeUser.avatar_url} alt={activeUser.full_name} className="w-full h-full object-cover" />
                            ) : (
                              activeUser.full_name.slice(0, 2).toUpperCase()
                            )}
                            {(StorageService.getUserLastSeen(activeUser) === 'online' || activeUser.role === 'developer' || activeUser.phone === '0780699988') && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" title="Online" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5 truncate">
                              <span className="truncate">{activeUser.full_name}</span>
                              {activeUser.role === 'super_admin' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold shrink-0">
                                  Apostolic Lead
                                </span>
                              )}
                              {activeUser.role === 'developer' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold shrink-0">
                                  Lead Dev
                                </span>
                              )}
                            </h3>
                            {isRecipientTyping ? (
                              <p className="text-[10px] text-emerald-500 flex items-center gap-1.5 truncate font-semibold animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                <span className="truncate font-mono">{activeUser.full_name} typing...</span>
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 truncate">
                                {activeUser.role === 'developer' || activeUser.phone === '0780699988' ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                    <span className="truncate text-emerald-600 dark:text-emerald-400 font-semibold">Online</span>
                                  </>
                                ) : (
                                  <>
                                    {StorageService.getUserLastSeen(activeUser) === 'online' ? (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                        <span className="truncate text-emerald-600 dark:text-emerald-400 font-semibold">Online</span>
                                      </>
                                    ) : (
                                      <span className="truncate font-medium">
                                        {StorageService.getUserLastSeen(activeUser) || `Active • ${activeUser.location || 'Harare'}`}
                                      </span>
                                    )}
                                  </>
                                )}
                              </p>
                            )}
                          </div>
                        </button>
                      </div>

                      {/* Right Action Menu: 3-dots dropdown & Close Button */}
                      <div className="relative flex items-center gap-1 sm:gap-1.5">
                        <button
                          onClick={() => setShowDirectTopMenu(prev => !prev)}
                          className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (isMobile) {
                              onClose();
                            } else {
                              setActiveUserId('');
                            }
                          }}
                          className="p-2 rounded-xl hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          title={isMobile ? "Close Messages" : "Close Chat"}
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {showDirectTopMenu && (
                          <div 
                            className="absolute right-0 top-11 z-50 w-52 rounded-xl bg-card border border-border shadow-2xl py-1.5 text-xs text-foreground divide-y divide-border animate-in fade-in zoom-in-95 duration-100"
                            onClick={() => setShowDirectTopMenu(false)}
                          >
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setViewUserProfile(activeUser);
                                  setShowDirectTopMenu(false);
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-secondary flex items-center gap-2.5 transition-colors"
                              >
                                <Users className="w-3.5 h-3.5 text-primary" />
                                <span>View Profile</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleStartSelectMode();
                                  setShowDirectTopMenu(false);
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-secondary flex items-center gap-2.5 transition-colors"
                              >
                                <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                                <span>Select Messages</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleExportChatHistory('direct');
                                  setShowDirectTopMenu(false);
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-secondary text-primary flex items-center gap-2.5 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5 text-primary" />
                                <span>Export Chat (.txt)</span>
                              </button>
                            </div>

                            <div className="py-1">
                              <button
                                onClick={() => {
                                  StorageService.togglePinDm(activeUserId, currentUser.id);
                                  setPinnedDms(StorageService.getPinnedDms(currentUser.id));
                                  refreshThreads();
                                  setShowDirectTopMenu(false);
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-secondary flex items-center gap-2.5 transition-colors"
                              >
                                <Pin className={`w-3.5 h-3.5 ${pinnedDms.includes(activeUserId) ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                                <span>{pinnedDms.includes(activeUserId) ? 'Unpin Chat' : 'Pin Chat to Top'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setClearChatConfirmModal({
                                    isOpen: true,
                                    isGroup: false,
                                    title: activeUser.full_name
                                  });
                                  setShowDirectTopMenu(false);
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-destructive/10 text-destructive flex items-center gap-2.5 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                <span>Clear Chat History</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SPECIAL INTERACTIVE EXPIRY CARD IN INBOX */}
                  {isFsExpiringSoon && activeUserId === 'usr_apostle_joe' && (
                    <div className="m-3 p-3.5 rounded-xl bg-primary/10 border border-primary/30 shadow-sm animate-fade-in space-y-2">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-primary text-primary-foreground shrink-0 font-bold">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-primary" />
                            Foundation School Membership Expiring
                          </h4>
                          <p className="text-xs text-foreground mt-1 leading-relaxed">
                            Special Notice from Apostle Joe Daniels: Your 3-month membership for <span className="font-bold text-primary">Foundation School</span> is about to expire! You can pay $150 to continue your discipleship curriculum or accept that your current session will conclude.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 sm:pl-10">
                        <button
                          onClick={() => {
                            const fsGrp = groups.find(g => g.id === 'group_foundation_school');
                            if (fsGrp) openPaymentModal(fsGrp, 'Renew your 3-month Foundation School membership for $150 USD.');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:brightness-105 transition-transform flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay $150 to Renew (3 Months)</span>
                        </button>

                        <button
                          onClick={() => {
                            StorageService.acceptFoundationSchoolExpiry(currentUser.id);
                            refreshGroupsData();
                            alert('You have accepted that your Foundation School term will conclude at the end of the term.');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-colors border border-border"
                        >
                          Accept Term Concluding
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Messages Bubbles Area - Modern Thread-based Layout */}
                  <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 bg-[#efeae2]/30 dark:bg-[#0b141a] bg-[radial-gradient(#00000008_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[size:16px_16px] overscroll-contain">
                    {messages.map((msg, index) => {
                      const isMine = msg.sender_id === currentUser.id;
                      const isSelected = selectedMessageIds.includes(msg.id);
                      const isDeleted = Boolean(msg.deleted_for_everyone || msg.text === 'This message was deleted');

                      const prevMsg = index > 0 ? messages[index - 1] : null;
                      const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

                      // Date grouping
                      const msgDate = new Date(msg.created_at).toDateString();
                      const prevMsgDate = prevMsg ? new Date(prevMsg.created_at).toDateString() : null;
                      const showDateDivider = !prevMsgDate || msgDate !== prevMsgDate;

                      // Thread clustering within 5 minutes
                      const isSameSenderAsPrev = prevMsg && prevMsg.sender_id === msg.sender_id && !prevMsg.deleted_for_everyone && (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 300000);
                      const isSameSenderAsNext = nextMsg && nextMsg.sender_id === msg.sender_id && !nextMsg.deleted_for_everyone && (new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() < 300000);

                      const isFirstInCluster = !isSameSenderAsPrev || showDateDivider;
                      const isLastInCluster = !isSameSenderAsNext || (nextMsg && new Date(nextMsg.created_at).toDateString() !== msgDate);

                      const bubbleRoundingClass = getBubbleRounding(isMine, isFirstInCluster, isLastInCluster);

                      return (
                        <React.Fragment key={msg.id}>
                          {/* Floating Date Divider */}
                          {showDateDivider && (
                            <div className="flex justify-center my-3 sm:my-4 sticky top-1 z-10 pointer-events-none">
                              <span className="px-3 py-1 rounded-full bg-card/90 dark:bg-card/90 backdrop-blur-md text-[10px] sm:text-[11px] font-semibold text-muted-foreground border border-border/80 shadow-2xs tracking-wide">
                                {formatMessageDateDivider(msg.created_at)}
                              </span>
                            </div>
                          )}

                          <div
                            onClick={() => {
                              if (isSelectMode) handleToggleSelectMessage(msg.id);
                            }}
                            className={`group/msg relative flex items-end gap-2 transition-all duration-150 px-1 ${
                              isFirstInCluster ? 'mt-3 sm:mt-3.5' : 'mt-1 sm:mt-1.5'
                            } ${isSelectMode ? 'cursor-pointer hover:bg-secondary/40 rounded-xl' : ''} ${
                              isSelected ? 'bg-primary/15 rounded-xl' : ''
                            } ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            {isSelectMode && (
                              <div className="shrink-0 mb-2">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-primary" />
                                ) : (
                                  <Square className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            )}

                            <div className={`relative max-w-[85%] xs:max-w-[80%] sm:max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                              {/* Hover / Tap Quick Reaction Bar */}
                              {!isSelectMode && !isDeleted && (
                                <div className={`opacity-0 group-hover/msg:opacity-100 transition-opacity absolute -top-8.5 z-20 flex items-center gap-0.5 bg-card/95 backdrop-blur-md border border-border/80 shadow-md rounded-full px-2 py-0.5 ${
                                  isMine ? 'right-0' : 'left-0'
                                }`}>
                                  {['🙏', '❤️', '🔥', '👍', '😂', '🕊️'].map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleReaction(msg.id, emoji, false);
                                      }}
                                      className="hover:scale-130 transition-transform text-xs p-1 cursor-pointer active:scale-90"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                  <div className="w-[1px] h-3 bg-border mx-1" />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReplyingToMessage({
                                        id: msg.id,
                                        sender_name: isMine ? 'You' : activeUser.full_name,
                                        text: msg.text
                                      });
                                    }}
                                    className="p-1 hover:text-primary text-muted-foreground transition-colors cursor-pointer"
                                    title="Reply"
                                  >
                                    <Reply className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartSelectMode(msg.id);
                                    }}
                                    className="p-1 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                                    title="Select message"
                                  >
                                    <CheckSquare className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSingleMessage(msg.id, false);
                                    }}
                                    className="p-1 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
                                    title="Delete message"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              {/* Shared Media / Photo / Video / Audio / Document in 1-on-1 DM */}
                              {msg.media_url && !isDeleted && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMediaPreview({
                                      url: msg.media_url!,
                                      type: msg.media_type || 'image',
                                      caption: msg.text !== 'Shared a photo' ? msg.text : undefined,
                                      sender_name: isMine ? currentUser.full_name : activeUser.full_name,
                                      created_at: msg.created_at
                                    });
                                  }}
                                  className="mb-1.5 rounded-2xl overflow-hidden max-w-xs cursor-pointer group/media relative border border-border/80 shadow-2xs"
                                >
                                  {msg.media_type === 'video' ? (
                                    <video src={msg.media_url} controls className="w-full max-h-60 object-contain bg-black" />
                                  ) : msg.media_type === 'audio' ? (
                                    <div className="p-3 min-w-[240px] bg-secondary/80">
                                      <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-foreground">
                                        <Music className="w-4 h-4 text-primary" />
                                        <span>Voice / Audio Note</span>
                                      </div>
                                      <audio src={msg.media_url} controls className="w-full h-8" />
                                    </div>
                                  ) : msg.media_type === 'document' ? (
                                    <div className="p-3 min-w-[220px] bg-secondary/80 flex items-center gap-3">
                                      <FileText className="w-7 h-7 text-primary shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold truncate text-foreground">
                                          {msg.text.replace(/^Shared a document:\s*/, '') || 'Document'}
                                        </p>
                                        <a
                                          href={msg.media_url}
                                          download
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-[10px] text-primary hover:underline font-bold inline-flex items-center gap-1"
                                        >
                                          <Download className="w-3 h-3" />
                                          <span>Download document</span>
                                        </a>
                                      </div>
                                    </div>
                                  ) : (
                                    <img
                                      src={msg.media_url}
                                      alt="Shared Media"
                                      className="w-full max-h-60 object-cover group-hover/media:scale-105 transition-transform duration-200"
                                    />
                                  )}
                                </div>
                              )}

                              {/* Message Bubble */}
                              <div
                                className={`px-3.5 py-2 sm:px-4 sm:py-2.5 ${bubbleRoundingClass} text-xs sm:text-[13px] break-words shadow-xs leading-relaxed transition-shadow duration-150 ${
                                  isDeleted 
                                    ? 'bg-secondary/70 border border-border/80 text-muted-foreground italic'
                                    : isMine
                                      ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white dark:bg-[#005c4b] dark:from-[#005c4b] dark:to-[#005c4b] dark:text-[#e9edef] border border-amber-500/30 dark:border-[#005c4b]/50 shadow-sm'
                                      : 'bg-card dark:bg-[#202c33] border border-border/85 dark:border-white/5 text-foreground dark:text-[#e9edef] shadow-2xs'
                                }`}
                              >
                                {/* Quoted Reply preview inside message */}
                                {msg.reply_to && !isDeleted && (
                                  <div className={`mb-2 p-2 rounded-xl text-left text-[11px] leading-snug border-l-3 ${
                                    isMine 
                                      ? 'bg-black/20 border-white/80 text-white' 
                                      : 'bg-secondary/80 border-primary text-foreground'
                                  }`}>
                                    <div className={`font-semibold text-[10px] flex items-center gap-1 ${isMine ? 'text-white' : 'text-primary'}`}>
                                      <Reply className="w-3 h-3" />
                                      <span>{msg.reply_to.sender_name}</span>
                                    </div>
                                    <p className="line-clamp-2 text-[11px] mt-0.5 opacity-90">
                                      {msg.reply_to.text}
                                    </p>
                                  </div>
                                )}

                                <div className="leading-relaxed">
                                  {renderMessageContent(msg)}
                                </div>

                                {/* Micro Timestamp & Delivery Receipt */}
                                <div className={`flex items-center justify-end gap-1 text-[9.5px] sm:text-[10px] mt-1 select-none font-medium tracking-tight ${
                                  isMine ? 'text-white/80 dark:text-[#8696a0]' : 'text-muted-foreground/80 dark:text-[#8696a0]'
                                }`}>
                                  <span>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {isMine && !isDeleted && (
                                    <span title={msg.is_read ? "Read" : "Delivered"} className="inline-flex items-center ml-0.5">
                                      <CheckCheck className={`w-3.5 h-3.5 inline ${msg.is_read ? 'text-sky-300 dark:text-[#53bdeb]' : 'text-white/70 dark:text-[#8696a0]'}`} />
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Interactive Message Reactions Chips */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className={`flex flex-wrap items-center gap-1 -mt-2 z-10 ${
                                  isMine ? 'justify-end pr-1' : 'justify-start pl-1'
                                }`}>
                                  {Array.from(new Set(msg.reactions.map((r) => r.emoji))).map((emoji) => {
                                    const count = msg.reactions!.filter((r) => r.emoji === emoji).length;
                                    const reactedByMe = msg.reactions!.some((r) => r.emoji === emoji && r.user_id === currentUser.id);
                                    return (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleReaction(msg.id, emoji, false);
                                        }}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shadow-2xs border transition-transform active:scale-90 cursor-pointer ${
                                          reactedByMe
                                            ? 'bg-primary/15 border-primary/40 text-primary'
                                            : 'bg-card/95 backdrop-blur-xs border-border text-foreground hover:bg-secondary'
                                        }`}
                                        title={msg.reactions!.filter((r) => r.emoji === emoji).map((r) => r.user_name || 'Believer').join(', ')}
                                      >
                                        <span>{emoji}</span>
                                        {count > 1 && <span className="text-[10px]">{count}</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Collapsible Quick Emoji Bar */}
                  {showEmojiPicker && (
                    <div className="px-3 py-2 bg-secondary/50 border-t border-border flex items-center gap-2 text-xs overflow-x-auto">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider shrink-0">Reactions:</span>
                      {EMOJI_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setInputText((prev) => prev + emoji)}
                          className="hover:scale-125 transition-transform text-base p-1 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quoted Reply Preview Bar if replying */}
                  {replyingToMessage && (
                    <div className="px-3.5 py-2 bg-secondary/90 border-t border-border flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-2 border-l-3 border-primary pl-2.5 min-w-0">
                        <Reply className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-primary truncate">Replying to {replyingToMessage.sender_name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{replyingToMessage.text}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingToMessage(null)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary cursor-pointer"
                        title="Cancel reply"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Message Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="p-2 sm:p-2.5 bg-card border-t border-border flex items-center gap-1.5 sm:gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] w-full min-w-0 box-border"
                  >
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(prev => !prev)}
                      title="Quick Reactions"
                      className={`p-2 rounded-full border transition-colors shrink-0 cursor-pointer ${
                        showEmojiPicker 
                          ? 'bg-primary/20 text-primary border-primary/30' 
                          : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => mediaFileInputRef.current?.click()}
                      title="Attach photo, video, audio or document"
                      className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-primary border border-border transition-colors shrink-0 cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInputText(val);
                        if (activeUserId) {
                          window.dispatchEvent(new CustomEvent('gcz_user_typing', {
                            detail: {
                              userId: currentUser.id,
                              userName: currentUser.full_name,
                              targetId: activeUserId,
                              isTyping: val.length > 0
                            }
                          }));
                        }
                      }}
                      placeholder={`Message ${activeUser.full_name}...`}
                      className="flex-1 min-w-0 bg-secondary/80 border border-border rounded-full px-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1.5 focus:ring-primary shadow-2xs"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary hover:brightness-105 disabled:opacity-40 text-primary-foreground font-semibold flex items-center justify-center transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
                      title="Send message"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background select-none">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-sm">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-foreground text-base">Direct Apostolic Fellowship</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
                    Select a conversation from the sidebar or start a new direct message with Apostle Joe Daniels, ministry leaders, or church brethren.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setShowNewChatPicker(true)}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-105 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Start New Conversation</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('groups')}
                      className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-primary" />
                      <span>Explore Groups</span>
                    </button>
                  </div>
                  <div className="mt-8 pt-6 border-t border-border flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Private & locally encrypted church messaging</span>
                  </div>
                </div>
              )
            )}

            {/* CHURCH GROUP ACTIVE CANVAS */}
            {activeTab === 'groups' && (
              activeGroup ? (
                <>
                  {/* Group Header */}
                  {isSelectMode ? (
                    <div className="h-16 bg-card border-b border-border px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2 shadow-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleCancelSelectMode}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                          title="Cancel selection"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <span className="font-semibold text-sm text-foreground">
                          {selectedMessageIds.length} selected
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteSelected(true)}
                          disabled={selectedMessageIds.length === 0}
                          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 disabled:opacity-40 transition-colors cursor-pointer"
                          title="Delete selected messages"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelSelectMode}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors font-medium border border-border"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-16 bg-card border-b border-border px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2 shadow-xs">
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <button
                          onClick={handleBackOrClose}
                          className="md:hidden p-2 -ml-1 rounded-full hover:bg-secondary text-muted-foreground active:scale-95 transition-transform cursor-pointer"
                          title="Back to conversations"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>

                        {/* WhatsApp Style Clickable Group Name & Avatar for Group Info */}
                        <button
                          type="button"
                          onClick={() => setShowGroupInfoModal(true)}
                          className="flex items-center gap-2.5 text-left p-1 rounded-xl hover:bg-secondary/60 transition-colors cursor-pointer group/hdr min-w-0"
                          title="Click to see group info and members"
                        >
                          <div className="relative w-10 h-10 rounded-full border border-border overflow-hidden bg-secondary flex items-center justify-center text-xs font-bold text-primary shrink-0 transition-colors">
                            {activeGroup.avatar_url ? (
                              <img src={activeGroup.avatar_url} alt={activeGroup.name} className="w-full h-full object-cover" />
                            ) : (
                              activeGroup.name.slice(0, 2).toUpperCase()
                            )}
                            {groupOnlineCount > 0 && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" title={`${groupOnlineCount} members online`} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-xs sm:text-sm text-foreground group-hover/hdr:text-primary flex items-center gap-1.5 truncate transition-colors">
                              <span className="truncate">{activeGroup.name}</span>
                              {activeGroup.is_paid && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 shrink-0">
                                  Paid $150
                                </span>
                              )}
                            </h3>
                            {groupTypingUserName ? (
                              <p className="text-[10px] text-emerald-500 flex items-center gap-1.5 truncate font-semibold animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                <span className="truncate font-mono">{groupTypingUserName} is typing...</span>
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 truncate">
                                <span>{activeGroup.member_ids.length} members</span>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                  <span>{groupOnlineCount} online</span>
                                </span>
                              </p>
                            )}
                          </div>
                        </button>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {/* Share Group Invite Link */}
                        <button
                          onClick={() => handleCopyLink(activeGroup.invite_code)}
                          title="Copy Group Invite Link"
                          className="p-1.5 px-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5 text-primary" />
                          <span className="hidden md:inline">Invite</span>
                        </button>

                        {/* 3-dots Dropdown Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setShowGroupTopMenu(prev => !prev)}
                            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="More group options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {showGroupTopMenu && (
                            <div 
                              className="absolute right-0 top-11 z-50 w-52 rounded-xl bg-card border border-border shadow-2xl py-1.5 text-xs text-foreground divide-y divide-border animate-in fade-in zoom-in-95 duration-100"
                              onClick={() => setShowGroupTopMenu(false)}
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setShowGroupInfoModal(true);
                                    setShowGroupTopMenu(false);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-secondary flex items-center gap-2.5 transition-colors"
                                >
                                  <Info className="w-3.5 h-3.5 text-primary" />
                                  <span>Group Info</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setShowMediaBrowserModal(true);
                                    setShowGroupTopMenu(false);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-secondary flex items-center gap-2.5 transition-colors"
                                >
                                  <ImageIcon className="w-3.5 h-3.5 text-pink-500" />
                                  <span>Media, Links & Docs</span>
                                </button>

                                <button
                                  onClick={() => {
                                    handleStartSelectMode();
                                    setShowGroupTopMenu(false);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-secondary flex items-center gap-2.5 transition-colors"
                                >
                                  <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Select Messages</span>
                                </button>

                                <button
                                  onClick={() => {
                                    handleExportChatHistory('group');
                                    setShowGroupTopMenu(false);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-secondary text-primary flex items-center gap-2.5 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5 text-primary" />
                                  <span>Export Chat (.txt)</span>
                                </button>

                                {(isUserGroupMember || isDeveloper) && (
                                  <button
                                    onClick={() => {
                                      setShowAddMemberModal(true);
                                      setShowGroupTopMenu(false);
                                    }}
                                    className="w-full px-3.5 py-2 text-left hover:bg-secondary flex items-center gap-2.5 transition-colors"
                                  >
                                    <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Add Member</span>
                                  </button>
                                )}
                              </div>

                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    StorageService.togglePinChatGroup(activeGroup.id, currentUser.id);
                                    refreshGroupsData();
                                    setShowGroupTopMenu(false);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-secondary flex items-center gap-2.5 transition-colors"
                                >
                                  <Pin className={`w-3.5 h-3.5 ${activeGroup.pinned_by_users?.includes(currentUser.id) ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                                  <span>{activeGroup.pinned_by_users?.includes(currentUser.id) ? 'Unpin Group' : 'Pin Group'}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    handleCopyLink(activeGroup.invite_code);
                                    setShowGroupTopMenu(false);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-secondary flex items-center gap-2.5 transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5 text-primary" />
                                  <span>Copy Invite Link</span>
                                </button>

                                {isUserGroupMember && (
                                  <button
                                    onClick={() => {
                                      setClearChatConfirmModal({
                                        isOpen: true,
                                        isGroup: true,
                                        title: activeGroup.name
                                      });
                                      setShowGroupTopMenu(false);
                                    }}
                                    className="w-full px-3.5 py-2 text-left hover:bg-secondary text-foreground flex items-center gap-2.5 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Clear Chat</span>
                                  </button>
                                )}
                              </div>

                              {isUserGroupMember && (
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      setShowExitGroupConfirm(true);
                                      setShowGroupTopMenu(false);
                                    }}
                                    className="w-full px-3.5 py-2 text-left hover:bg-destructive/10 text-destructive flex items-center gap-2.5 transition-colors"
                                  >
                                    <LogOut className="w-3.5 h-3.5 text-destructive" />
                                    <span>Exit Group</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (isMobile) {
                              onClose();
                            } else {
                              setActiveGroupId('');
                            }
                          }}
                          className="p-2 rounded-xl hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          title={isMobile ? "Close Messages" : "Close Group"}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SPECIAL BANNER FOR FOUNDATION SCHOOL EXPIRY (Inside Group) */}
                  {activeGroup.id === 'group_foundation_school' && (
                    <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground">
                          Foundation School 3-Month Curriculum
                        </span>
                        {activeGroupMembership?.expires_at && (
                          <span className="text-[10px] text-primary">
                            (Term active until {new Date(activeGroupMembership.expires_at).toLocaleDateString()})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            StorageService.triggerFoundationSchoolExpiryNotice(currentUser.id);
                            refreshGroupsData();
                            refreshThreads();
                            alert('Foundation School Expiry Notice has been triggered! Check your inbox and the top banner.');
                          }}
                          className="text-[10px] px-2 py-1 rounded-md bg-secondary border border-border text-foreground hover:bg-secondary/80 font-semibold"
                          title="Simulate membership expiry notice"
                        >
                          ⚡ Test Expiry Notice
                        </button>

                        {isFsExpiringSoon && (
                          <button
                            onClick={() => openPaymentModal(activeGroup, 'Renew your 3-month Foundation School membership for $150 USD.')}
                            className="text-[10px] px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-bold hover:brightness-105"
                          >
                            Pay $150 to Renew
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pinned Notice if exists */}
                  {activeGroup.pinned_notice && (
                    <div className="px-4 py-2 bg-secondary/80 border-b border-border flex items-center gap-2 text-xs text-foreground">
                      <Flame className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate font-medium">{activeGroup.pinned_notice}</span>
                    </div>
                  )}

                  {/* Non-Member Locked Overlay if removed by admin or unpaid Foundation School */}
                  {activeGroup.removed_user_ids?.includes(currentUser.id) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-background">
                      <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shadow-sm">
                        <Lock className="w-8 h-8" />
                      </div>
                      <div className="max-w-md space-y-2">
                        <h3 className="text-lg font-bold text-foreground">
                          Removed from {activeGroup.name}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          You were removed from this group by an administrator. You cannot view chat history or rejoin this group.
                        </p>
                      </div>
                    </div>
                  ) : (activeGroup.is_paid && !activeGroupMembership && currentUser.role !== 'developer') ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-background">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                        <GraduationCap className="w-8 h-8" />
                      </div>
                      <div className="max-w-md space-y-1.5">
                        <h3 className="text-lg font-bold text-foreground">
                          Enroll in {activeGroup.name}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {activeGroup.description}
                        </p>
                        <div className="py-2 px-4 rounded-lg bg-secondary border border-border text-xs font-semibold text-primary inline-block">
                          Term Fee: ${activeGroup.price_usd || 150} USD for {activeGroup.duration_months || 3} Months
                        </div>
                      </div>

                      <button
                        id="btn-enroll-foundation-school"
                        onClick={() => openPaymentModal(activeGroup)}
                        className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider shadow-sm hover:brightness-105 transition-transform flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Enroll & Join Group (${activeGroup.price_usd || 150})</span>
                      </button>
                    </div>
                  ) : (!canViewActiveGroupChats) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-background animate-in fade-in">
                      <div className="w-16 h-16 rounded-2xl bg-secondary/80 border border-border flex items-center justify-center text-primary shadow-sm">
                        <Lock className="w-8 h-8" />
                      </div>
                      <div className="max-w-md space-y-2">
                        <h3 className="text-lg font-bold text-foreground">
                          Private Fellowship Group
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Group conversations are private to fellowship members. Join {activeGroup.name} to view fellowship history and interact live with brethren.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleJoinGroup(activeGroup)}
                        className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider shadow-sm hover:brightness-105 transition-transform flex items-center gap-2 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Join Group Fellowship</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Messages History */}
                      {/* Group Messages Bubbles Area - Modern Thread-based Layout */}
                      <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 bg-[#efeae2]/30 dark:bg-[#0b141a] bg-[radial-gradient(#00000008_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[size:16px_16px] overscroll-contain">
                        {groupMessages.map((msg, index) => {
                          const isMine = msg.sender_id === currentUser.id;
                          const isSelected = selectedMessageIds.includes(msg.id);
                          const isDeleted = Boolean(msg.deleted_for_everyone || msg.text === 'This message was deleted');

                          if (msg.is_system) {
                            return (
                              <div key={msg.id} className="flex justify-center my-3">
                                <span className="text-[10px] sm:text-[11px] px-3.5 py-1 rounded-full bg-secondary/80 border border-border text-muted-foreground text-center font-medium shadow-2xs">
                                  {msg.text}
                                </span>
                              </div>
                            );
                          }

                          const prevMsg = index > 0 ? groupMessages[index - 1] : null;
                          const nextMsg = index < groupMessages.length - 1 ? groupMessages[index + 1] : null;

                          // Date grouping
                          const msgDate = new Date(msg.created_at).toDateString();
                          const prevMsgDate = prevMsg && !prevMsg.is_system ? new Date(prevMsg.created_at).toDateString() : null;
                          const showDateDivider = !prevMsgDate || msgDate !== prevMsgDate;

                          // Thread clustering within 5 minutes
                          const isSameSenderAsPrev = prevMsg && !prevMsg.is_system && prevMsg.sender_id === msg.sender_id && !prevMsg.deleted_for_everyone && (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 300000);
                          const isSameSenderAsNext = nextMsg && !nextMsg.is_system && nextMsg.sender_id === msg.sender_id && !nextMsg.deleted_for_everyone && (new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() < 300000);

                          const isFirstInCluster = !isSameSenderAsPrev || showDateDivider;
                          const isLastInCluster = !isSameSenderAsNext || (nextMsg && new Date(nextMsg.created_at).toDateString() !== msgDate);

                          const bubbleRoundingClass = getBubbleRounding(isMine, isFirstInCluster, isLastInCluster);

                          return (
                            <React.Fragment key={msg.id}>
                              {/* Floating Date Divider */}
                              {showDateDivider && (
                                <div className="flex justify-center my-3 sm:my-4 sticky top-1 z-10 pointer-events-none">
                                  <span className="px-3 py-1 rounded-full bg-card/90 dark:bg-card/90 backdrop-blur-md text-[10px] sm:text-[11px] font-semibold text-muted-foreground border border-border/80 shadow-2xs tracking-wide">
                                    {formatMessageDateDivider(msg.created_at)}
                                  </span>
                                </div>
                              )}

                              <div
                                onClick={() => {
                                  if (isSelectMode) handleToggleSelectMessage(msg.id);
                                }}
                                className={`group/msg relative flex items-end gap-2 transition-all duration-150 px-1 ${
                                  isFirstInCluster ? 'mt-3 sm:mt-3.5' : 'mt-1 sm:mt-1.5'
                                } ${isSelectMode ? 'cursor-pointer hover:bg-secondary/40 rounded-xl' : ''} ${
                                  isSelected ? 'bg-primary/15 rounded-xl' : ''
                                } ${isMine ? 'justify-end' : 'justify-start'}`}
                              >
                                {isSelectMode && (
                                  <div className="shrink-0 mb-2">
                                    {isSelected ? (
                                      <CheckSquare className="w-4 h-4 text-primary" />
                                    ) : (
                                      <Square className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                )}

                                {/* Sender Avatar in Group Chat (shown next to last message in cluster for clean alignment) */}
                                {!isMine && (
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border overflow-hidden bg-secondary flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mb-1 select-none">
                                    {isLastInCluster ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenUserProfile(msg.sender_name);
                                        }}
                                        className="w-full h-full cursor-pointer"
                                        title={`View ${msg.sender_name}'s profile`}
                                      >
                                        {msg.sender_avatar ? (
                                          <img src={msg.sender_avatar} alt={msg.sender_name} className="w-full h-full object-cover" />
                                        ) : (
                                          msg.sender_name.slice(0, 2).toUpperCase()
                                        )}
                                      </button>
                                    ) : (
                                      <span className="opacity-0">.</span>
                                    )}
                                  </div>
                                )}

                                <div className={`relative max-w-[85%] xs:max-w-[80%] sm:max-w-[72%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                  {/* Quick Action Reaction Bar on Hover / Focus */}
                                  {!isSelectMode && !isDeleted && (
                                    <div className={`opacity-0 group-hover/msg:opacity-100 transition-opacity absolute -top-8.5 z-20 flex items-center gap-0.5 bg-card/95 backdrop-blur-md border border-border/80 shadow-md rounded-full px-2 py-0.5 ${
                                      isMine ? 'right-0' : 'left-0'
                                    }`}>
                                      {['🙏', '❤️', '🔥', '👍', '😂', '🕊️'].map((emoji) => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleReaction(msg.id, emoji, true);
                                          }}
                                          className="hover:scale-130 transition-transform text-xs p-1 cursor-pointer active:scale-90"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                      <div className="w-[1px] h-3 bg-border mx-1" />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setReplyingToMessage(msg);
                                          setTimeout(() => groupInputRef.current?.focus(), 50);
                                        }}
                                        className="p-1 hover:text-primary text-muted-foreground transition-colors cursor-pointer"
                                        title="Reply"
                                      >
                                        <Reply className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuickTagUser(msg.sender_name);
                                        }}
                                        className="p-1 hover:text-primary text-muted-foreground transition-colors cursor-pointer"
                                        title={`Tag @${msg.sender_name}`}
                                      >
                                        <AtSign className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSingleMessage(msg.id, true);
                                        }}
                                        className="p-1 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
                                        title="Delete message"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}

                                  {/* Sender name on first message of cluster for received group messages */}
                                  {!isMine && isFirstInCluster && (
                                    <div className="flex items-center gap-1.5 mb-1 px-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenUserProfile(msg.sender_name);
                                        }}
                                        className={`text-[11px] font-bold ${getSenderNameColor(msg.sender_name, msg.sender_role)} hover:underline transition-colors cursor-pointer`}
                                      >
                                        {msg.sender_name}
                                      </button>
                                      {msg.sender_role === 'super_admin' && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                                          Apostle ✦
                                        </span>
                                      )}
                                      {msg.sender_role === 'developer' && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/30">
                                          Dev 🛡️
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Message Bubble */}
                                  <div
                                    className={`px-3.5 py-2 sm:px-4 sm:py-2.5 ${bubbleRoundingClass} text-xs sm:text-[13px] break-words shadow-xs leading-relaxed transition-shadow duration-150 ${
                                      isDeleted
                                        ? 'bg-secondary/70 border border-border/80 text-muted-foreground italic'
                                        : isMine
                                          ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white dark:bg-[#005c4b] dark:from-[#005c4b] dark:to-[#005c4b] dark:text-[#e9edef] border border-amber-500/30 dark:border-[#005c4b]/50 shadow-sm'
                                          : 'bg-card dark:bg-[#202c33] border border-border/85 dark:border-white/5 text-foreground dark:text-[#e9edef] shadow-2xs'
                                    }`}
                                  >
                                    {/* WhatsApp-style Quoted Reply Banner inside Message */}
                                    {msg.reply_to && !isDeleted && (
                                      <div className={`mb-2 p-2 rounded-xl text-left text-[11px] leading-snug border-l-3 ${
                                        isMine 
                                          ? 'bg-black/20 border-white/80 text-white' 
                                          : 'bg-secondary/80 border-primary text-foreground'
                                      }`}>
                                        <div className={`font-semibold text-[10px] flex items-center gap-1 ${isMine ? 'text-white' : 'text-primary'}`}>
                                          <Reply className="w-3 h-3" />
                                          <span>{msg.reply_to.sender_name}</span>
                                        </div>
                                        <p className="line-clamp-2 text-[11px] mt-0.5 opacity-90">
                                          {msg.reply_to.text}
                                        </p>
                                      </div>
                                    )}

                                    {/* Shared Media / Photo */}
                                    {msg.media_url && !isDeleted && (
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedMediaPreview({
                                            url: msg.media_url!,
                                            type: msg.media_type || 'image',
                                            caption: msg.text !== 'Shared a photo' ? msg.text : undefined,
                                            sender_name: msg.sender_name,
                                            created_at: msg.created_at
                                          });
                                        }}
                                        className="mb-2 rounded-xl overflow-hidden max-w-xs cursor-pointer group/media relative border border-border shadow-sm"
                                      >
                                        {msg.media_type === 'video' ? (
                                          <video src={msg.media_url} controls className="w-full max-h-60 object-contain bg-black" />
                                        ) : msg.media_type === 'audio' ? (
                                          <div className="p-3 min-w-[240px] bg-secondary/80">
                                            <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-foreground">
                                              <Music className="w-4 h-4 text-primary" />
                                              <span>Voice / Audio Note</span>
                                            </div>
                                            <audio src={msg.media_url} controls className="w-full h-8" />
                                          </div>
                                        ) : msg.media_type === 'document' ? (
                                          <div className="p-3 min-w-[220px] bg-secondary/80 flex items-center gap-3">
                                            <FileText className="w-7 h-7 text-primary shrink-0" />
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-semibold truncate text-foreground">
                                                {msg.text.replace(/^Shared a document:\s*/, '') || 'Document'}
                                              </p>
                                              <a
                                                href={msg.media_url}
                                                download
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-[10px] text-primary hover:underline font-bold inline-flex items-center gap-1"
                                              >
                                                <Download className="w-3 h-3" />
                                                <span>Download document</span>
                                              </a>
                                            </div>
                                          </div>
                                        ) : (
                                          <img
                                            src={msg.media_url}
                                            alt="Group Media"
                                            className="w-full max-h-60 object-cover group-hover/media:scale-105 transition-transform duration-200"
                                          />
                                        )}
                                      </div>
                                    )}

                                    {/* Formatted message text with @ mentions highlighted */}
                                    <div className="leading-relaxed">{renderMessageContent(msg)}</div>

                                    {/* Micro Timestamp & Delivery / Read Receipt */}
                                    <div className={`flex items-center justify-end gap-1 text-[9.5px] sm:text-[10px] mt-1 select-none font-medium tracking-tight ${
                                      isMine ? 'text-white/80 dark:text-[#8696a0]' : 'text-muted-foreground/80 dark:text-[#8696a0]'
                                    }`}>
                                      <span>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {isMine && !isDeleted && (
                                        <span
                                          title={(msg.read_by_user_ids && msg.read_by_user_ids.length > 1) ? "Read by group members" : "Delivered"}
                                          className="inline-flex items-center ml-0.5"
                                        >
                                          <CheckCheck
                                            className={`w-3.5 h-3.5 inline ${
                                              (msg.read_by_user_ids && msg.read_by_user_ids.length > 1)
                                                ? 'text-sky-300 dark:text-[#53bdeb]'
                                                : 'text-white/70 dark:text-[#8696a0]'
                                            }`}
                                          />
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Interactive Message Reactions Chips */}
                                  {msg.reactions && msg.reactions.length > 0 && (
                                    <div className={`flex flex-wrap items-center gap-1 -mt-2 z-10 ${
                                      isMine ? 'justify-end pr-1' : 'justify-start pl-1'
                                    }`}>
                                      {Array.from(new Set(msg.reactions.map((r) => r.emoji))).map((emoji) => {
                                        const count = msg.reactions!.filter((r) => r.emoji === emoji).length;
                                        const reactedByMe = msg.reactions!.some((r) => r.emoji === emoji && r.user_id === currentUser.id);
                                        return (
                                          <button
                                            key={emoji}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleReaction(msg.id, emoji, true);
                                            }}
                                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shadow-2xs border transition-transform active:scale-90 cursor-pointer ${
                                              reactedByMe
                                                ? 'bg-primary/15 border-primary/40 text-primary'
                                                : 'bg-card/95 backdrop-blur-xs border-border text-foreground hover:bg-secondary'
                                            }`}
                                            title={msg.reactions!.filter((r) => r.emoji === emoji).map((r) => r.user_name || 'Believer').join(', ')}
                                          >
                                            <span>{emoji}</span>
                                            {count > 1 && <span className="text-[10px]">{count}</span>}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                        <div ref={groupMessagesEndRef} />
                      </div>

                      {/* Quick Emoji Bar & Input Form or Admin-only Lock Notice / Non-Member Notice */}
                      {hasUserExitedActiveGroup ? (
                        <div className="p-3.5 bg-card border-t border-border text-center flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 py-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>You cannot send messages anymore because you exited this group fellowship.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleJoinGroup(activeGroup)}
                            className="px-4 py-1.5 rounded-lg bg-primary hover:brightness-105 text-primary-foreground text-xs font-semibold transition-transform shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Rejoin Group</span>
                          </button>
                        </div>
                      ) : !canViewActiveGroupChats ? (
                        <div className="p-3.5 bg-card border-t border-border text-center flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 py-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>Join {activeGroup.name} to send messages and participate.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => activeGroup.is_paid ? openPaymentModal(activeGroup) : handleJoinGroup(activeGroup)}
                            className="px-4 py-1.5 rounded-lg bg-primary hover:brightness-105 text-primary-foreground text-xs font-semibold transition-transform shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{activeGroup.is_paid ? 'Enroll Now' : 'Join Group Fellowship'}</span>
                          </button>
                        </div>
                      ) : (!activeGroup.only_admins_can_send_messages || 
                        (activeGroup.admin_ids || [activeGroup.created_by]).includes(currentUser.id) || 
                        ['super_admin', 'developer'].includes(currentUser.role)) ? (
                        <>
                          {/* Replying Quote Preview Banner */}
                          {replyingToMessage && (
                            <div className="px-4 py-2 bg-secondary/80 border-t border-border flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 duration-150">
                              <div className="flex items-center gap-2.5 border-l-4 border-primary pl-2.5 py-0.5 min-w-0">
                                <Reply className="w-4 h-4 text-primary shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-[10px] font-semibold text-primary block">
                                    Replying to {replyingToMessage.sender_name}
                                  </span>
                                  <span className="text-muted-foreground text-xs truncate block max-w-xs sm:max-w-md">
                                    {replyingToMessage.text}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setReplyingToMessage(null)}
                                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0"
                                title="Cancel reply"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {/* @ Tag User Suggestions Autocomplete Dropdown */}
                          {mentionSuggestionsOpen && (
                            <div className="p-2 bg-card border-t border-b border-border max-h-44 overflow-y-auto space-y-1 shadow-2xl">
                              <div className="text-[10px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 flex items-center gap-1">
                                <AtSign className="w-3 h-3" />
                                <span>Tag a group member</span>
                              </div>
                              {StorageService.getAllUsers()
                                .filter(u => activeGroup.member_ids.includes(u.id))
                                .filter(m => !mentionFilter || m.full_name.toLowerCase().includes(mentionFilter))
                                .map(member => (
                                  <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => handleSelectMentionUser(member.full_name)}
                                    className="w-full p-1.5 px-2.5 rounded-lg hover:bg-secondary flex items-center justify-between gap-2 text-left text-xs transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                        {member.full_name.slice(0, 2).toUpperCase()}
                                      </div>
                                      <span className="font-semibold text-foreground truncate">{member.full_name}</span>
                                      {member.role === 'super_admin' && (
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-primary/10 text-primary font-bold">Apostle</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-primary font-semibold shrink-0">@tag</span>
                                  </button>
                                ))}
                            </div>
                          )}

                          {/* Collapsible Quick Emoji Bar */}
                          {showGroupEmojiPicker && (
                            <div className="px-3 py-2 bg-secondary/50 border-t border-border flex items-center gap-2 text-xs overflow-x-auto">
                              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider shrink-0">Reactions:</span>
                              {EMOJI_REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => setGroupInputText((prev) => prev + emoji)}
                                  className="hover:scale-125 transition-transform text-base p-1 cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Group Message Input Form */}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSendGroupMessage();
                            }}
                            className="p-2 sm:p-2.5 bg-card border-t border-border flex items-center gap-1.5 sm:gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] w-full min-w-0 box-border"
                          >
                            <button
                              type="button"
                              onClick={() => setShowGroupEmojiPicker(prev => !prev)}
                              title="Quick Reactions"
                              className={`p-2 rounded-full border transition-colors shrink-0 cursor-pointer ${
                                showGroupEmojiPicker 
                                  ? 'bg-primary/20 text-primary border-primary/30' 
                                  : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border-border'
                              }`}
                            >
                              <Smile className="w-4 h-4" />
                            </button>

                            {/* Quick @ Tag button */}
                            <button
                              type="button"
                              onClick={() => {
                                setMentionSuggestionsOpen(prev => !prev);
                                setMentionFilter('');
                              }}
                              title="Tag a group member"
                              className={`p-2 rounded-full border text-xs transition-colors shrink-0 cursor-pointer ${
                                mentionSuggestionsOpen
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border-border'
                              }`}
                            >
                              <AtSign className="w-4 h-4" />
                            </button>

                            {/* Group attachment button */}
                            <button
                              type="button"
                              onClick={() => mediaFileInputRef.current?.click()}
                              title="Attach image, video, audio or document"
                              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-primary border border-border transition-colors shrink-0 cursor-pointer"
                            >
                              <Paperclip className="w-4 h-4" />
                            </button>

                            <input
                              ref={groupInputRef}
                              type="text"
                              value={groupInputText}
                              onChange={handleGroupInputChange}
                              placeholder={`Message ${activeGroup.name} (type @ to tag)...`}
                              className="flex-1 min-w-0 bg-secondary/80 border border-border rounded-full px-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1.5 focus:ring-primary shadow-2xs"
                            />
                            <button
                              type="submit"
                              disabled={!groupInputText.trim()}
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary hover:brightness-105 disabled:opacity-40 text-primary-foreground font-semibold flex items-center justify-center transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
                              title="Send message"
                            >
                              <Send className="w-4 h-4 ml-0.5" />
                            </button>
                          </form>
                        </>
                      ) : (
                        <div className="p-3.5 bg-card border-t border-border text-center text-xs text-muted-foreground flex items-center justify-center gap-2 py-4">
                          <Lock className="w-4 h-4 text-primary" />
                          <span>Only administrators can send messages to <strong>{activeGroup.name}</strong>.</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background select-none">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-sm">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-foreground text-base">Gateway Fellowship Groups</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
                    Select a fellowship group from the sidebar to engage with brethren, share prayer decrees, and view ministry announcements.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setShowCreateGroupModal(true)}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-105 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Fellowship</span>
                    </button>
                    <button
                      onClick={() => setShowJoinByCodeModal(true)}
                      className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5 text-primary" />
                      <span>Join via Invite Code</span>
                    </button>
                  </div>
                  <div className="mt-8 pt-6 border-t border-border flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Official ministry groups are supervised by church elders</span>
                  </div>
                </div>
              )
            )}

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: FOUNDATION SCHOOL PAYMENT & ENROLLMENT ($150 / 3 MONTHS) */}
      {/* ========================================================================= */}
      {showPaymentModal && paymentTargetGroup && (
        <div 
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={() => setShowPaymentModal(false)}
        >
          <div 
            className="bg-card border border-primary/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-card-foreground animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif-church font-bold text-base text-foreground">
                    {paymentTargetGroup.name} Enrollment
                  </h3>
                  <p className="text-xs text-muted-foreground">Apostolic 3-Month Discipleship Term</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentNoticeMessage && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                {paymentNoticeMessage}
              </div>
            )}

            <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Tuition / Membership Term</span>
                <span className="font-bold text-foreground">3 Months (90 Days)</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Curriculum Modules</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">All Included</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-center text-sm">
                <span className="font-bold text-foreground">Total Membership Fee</span>
                <span className="font-black text-primary text-lg">${paymentTargetGroup.price_usd || 150} USD</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-foreground">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ecocash', label: 'EcoCash' },
                  { id: 'innbucks', label: 'InnBucks' },
                  { id: 'card', label: 'Visa / MC' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-foreground border-border hover:bg-secondary/80'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-foreground">
                {paymentMethod === 'card' ? 'Cardholder Phone' : `${paymentMethod === 'ecocash' ? 'EcoCash' : 'InnBucks'} Number`}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  placeholder="0772123456"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Pay Button */}
            <button
              id="btn-confirm-foundation-school-payment"
              onClick={handleProcessPayment}
              disabled={isProcessingPayment || !paymentPhone.trim()}
              className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-black text-xs sm:text-sm uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessingPayment ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing ${paymentTargetGroup.price_usd || 150}...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ${paymentTargetGroup.price_usd || 150} & Activate Membership</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE CHURCH GROUP (Admins / Super Admin / Developer) */}
      {/* ========================================================================= */}
      {showCreateGroupModal && (
        <div 
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={() => setShowCreateGroupModal(false)}
        >
          <div 
            className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-card-foreground animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-church font-bold text-base text-foreground">
                    Create Church Group
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Fellowship Group</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Ignite Worship Team"
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">About / Description</label>
                <textarea
                  rows={2}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="State the purpose and mission of the group..."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">Category</label>
                  <select
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {['Worship', 'Men', 'Women', 'Youth', 'School', 'General'].map(c => (
                      <option key={c} value={c} className="bg-card text-foreground">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Group Avatar</label>
                  <input
                    ref={groupAvatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleGroupAvatarSelect}
                    className="hidden"
                  />
                  {newGroupAvatar ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-secondary/40">
                      <img src={newGroupAvatar} alt="Group avatar" className="w-10 h-10 rounded-lg object-cover border border-border shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-foreground font-semibold block truncate">Photo selected</span>
                        <span className="text-[10px] text-muted-foreground block">Ready to upload</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewGroupAvatar('')}
                        className="p-1 rounded-lg hover:bg-destructive/10 text-destructive transition-colors shrink-0"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => groupAvatarInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-2.5 text-center cursor-pointer bg-secondary/20 hover:bg-secondary/40 transition-all flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">Upload from device</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Paid Group Toggle (e.g. Foundation School) */}
              <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGroupIsPaid}
                    onChange={(e) => setNewGroupIsPaid(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-bold text-foreground text-xs">
                    Paid Membership Group (e.g. Foundation School)
                  </span>
                </label>

                {newGroupIsPaid && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">Price (USD)</label>
                      <input
                        type="number"
                        min="1"
                        value={newGroupPrice}
                        onChange={(e) => setNewGroupPrice(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">Duration (Months)</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={newGroupDuration}
                        onChange={(e) => setNewGroupDuration(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Pinned Welcome Notice</label>
                <input
                  type="text"
                  value={newGroupPinnedNotice}
                  onChange={(e) => setNewGroupPinnedNotice(e.target.value)}
                  placeholder="e.g. Welcome in Jesus' name! Iron sharpens iron."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider text-xs shadow-md transition-all mt-2 cursor-pointer"
              >
                Create Church Group
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD MEMBER WITH WHATSAPP PROTOCOL FOR SUPER ADMIN / DEV */}
      {/* ========================================================================= */}
      {showAddMemberModal && activeGroup && (
        <div 
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={() => setShowAddMemberModal(false)}
        >
          <div 
            className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl text-card-foreground animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="font-serif-church font-bold text-base text-foreground">
                  Add Member to {activeGroup.name}
                </h3>
                <p className="text-[11px] text-muted-foreground">Select from congregation members</p>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-secondary text-[11px] text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">Admins receive an invitation to join.</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border space-y-1">
              {prioritizedContacts
                .filter(u => !activeGroup.member_ids.includes(u.id))
                .map(contact => {
                  const isPrivileged = ['super_admin', 'developer'].includes(contact.role);
                  return (
                    <div key={contact.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-secondary/60 rounded-lg transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full border border-border overflow-hidden bg-secondary flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {contact.avatar_url ? (
                            <img src={contact.avatar_url} alt={contact.full_name} className="w-full h-full object-cover" />
                          ) : (
                            contact.full_name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground truncate flex items-center gap-1">
                            <span>{contact.full_name}</span>
                            {isPrivileged && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                                {contact.role === 'super_admin' ? 'Super Admin' : 'Dev'}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate font-mono">
                            {contact.phone} • {contact.location || 'Harare'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddMemberToGroup(contact)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                          isPrivileged
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                      >
                        {isPrivileged ? 'Send Invite' : 'Add'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: JOIN GROUP BY INVITE CODE OR LINK */}
      {/* ========================================================================= */}
      {showJoinByCodeModal && (
        <div 
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={() => setShowJoinByCodeModal(false)}
        >
          <div 
            className="bg-card border border-border rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-card-foreground animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary/30">
              <h3 className="font-serif-church font-bold text-sm text-foreground">
                Join via Group Link / Code
              </h3>
              <button
                onClick={() => setShowJoinByCodeModal(false)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteLinkError && (
              <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{inviteLinkError}</span>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <label className="block text-muted-foreground font-semibold">Paste Invite Code or Link</label>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => {
                  setInviteCodeInput(e.target.value);
                  setInviteLinkError(null);
                }}
                placeholder="e.g. ignite-worship-2026 or https://gatewayconnect.church/join/group?code=..."
                className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground text-xs focus:outline-none focus:border-primary"
              />
            </div>

            {(() => {
              const validation = inviteCodeInput.trim() ? StorageService.validateGroupInviteCode(inviteCodeInput.trim()) : null;
              const isReset = validation?.status === 'reset';
              const matched = validation?.group;

              return (
                <div className="space-y-3">
                  {isReset && (
                    <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-3 text-red-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <div>
                        <p className="font-bold">Can't join because this invite link was reset.</p>
                        <p className="text-[10px] text-red-400/80">Please request a fresh invitation link from the group leader.</p>
                      </div>
                    </div>
                  )}

                  {matched && !isReset && (
                    <div className="bg-secondary/50 border border-border rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        {matched.name.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground text-xs truncate">{matched.name}</h4>
                        <p className="text-[10px] text-muted-foreground truncate">{matched.description || 'Church Community Group'}</p>
                        <p className="text-[10px] text-primary font-semibold">{matched.member_ids.length} members</p>
                      </div>
                    </div>
                  )}

                  {/* Two Buttons at the bottom: 1st Join, 2nd Decline */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <button
                      onClick={handleJoinByCode}
                      disabled={!inviteCodeInput.trim() || isReset}
                      className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Join</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowJoinByCodeModal(false);
                        setInviteCodeInput('');
                        setInviteLinkError(null);
                      }}
                      className="flex-1 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GROUP INFO & DETAILS */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL: GROUP INFO & DETAILS (PREMIUM INSTAGRAM-INSPIRED REDESIGN) */}
      {/* ========================================================================= */}
      {showGroupInfoModal && activeGroup && (
        <GroupInfoModal
          isOpen={showGroupInfoModal}
          onClose={() => {
            setShowGroupInfoModal(false);
            setIsEditingGroupDetails(false);
          }}
          group={activeGroup}
          currentUser={currentUser}
          groupMessages={groupMessages}
          onUpdateGroup={() => {
            refreshGroupsData();
          }}
          onExitGroup={() => {
            setShowExitGroupConfirm(true);
          }}
          onClearChat={() => {
            setClearChatConfirmModal({
              isOpen: true,
              isGroup: true,
              title: activeGroup.name
            });
          }}
          onOpenAddMember={() => {
            setShowAddMemberModal(true);
          }}
          onCopyInviteLink={(code) => {
            handleCopyLink(code);
          }}
          onDirectMessageUser={(user) => {
            setShowGroupInfoModal(false);
            setActiveTab('direct');
            setActiveUserId(user.id);
          }}
        />
      )}

      {/* WhatsApp-Style Exit Group Confirmation Modal */}
      {showExitGroupConfirm && activeGroup && (
        <div 
          className="fixed inset-0 z-70 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowExitGroupConfirm(false)}
        >
          <div 
            className="bg-card border border-destructive/30 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center text-card-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-foreground">Exit "{activeGroup.name}"?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You will no longer be a participant in this fellowship group and will stop receiving group messages. You can always rejoin later.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitGroupConfirm(false)}
                className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExitActiveGroup}
                className="flex-1 py-2 rounded-lg bg-destructive hover:bg-destructive/90 text-xs font-bold text-destructive-foreground transition-colors shadow-sm cursor-pointer"
              >
                Exit Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp-Style Delete Message Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div 
          className="fixed inset-0 z-70 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setDeleteConfirmModal({ isOpen: false, isMultiple: false, canDeleteForEveryone: false, isGroup: false })}
        >
          <div 
            className="bg-card border border-destructive/30 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-card-foreground text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-foreground">
                {deleteConfirmModal.isMultiple ? `Delete ${selectedMessageIds.length} Messages?` : 'Delete Message?'}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose how you want to delete this message.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              {deleteConfirmModal.canDeleteForEveryone && (
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(true)}
                  className="w-full py-2.5 rounded-lg bg-destructive hover:bg-destructive/90 text-xs font-bold text-destructive-foreground transition-colors shadow-sm cursor-pointer"
                >
                  Delete for Everyone
                </button>
              )}
              <button
                type="button"
                onClick={() => handleConfirmDelete(false)}
                className="w-full py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                Delete for Me
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false, isMultiple: false, canDeleteForEveryone: false, isGroup: false })}
                className="w-full py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Functional Clear Chat Confirmation Modal */}
      {clearChatConfirmModal.isOpen && (
        <div 
          className="fixed inset-0 z-70 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setClearChatConfirmModal({ isOpen: false, isGroup: false, title: '' })}
        >
          <div 
            className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-card-foreground text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-foreground">
                Clear chats from your end?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Messages in <span className="font-semibold text-foreground">{clearChatConfirmModal.title}</span> will be cleared from your view on this device.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClearChatConfirmModal({ isOpen: false, isGroup: false, title: '' })}
                className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteClearChat}
                className="flex-1 py-2 rounded-lg bg-destructive hover:bg-destructive/90 text-xs font-bold text-destructive-foreground transition-colors shadow-sm cursor-pointer"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp-Style Fullscreen Media Preview Lightbox Modal */}
      {showShareMediaPrompt && stagedLocalMedia && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3" onClick={() => { setShowShareMediaPrompt(false); setStagedLocalMedia(null); }}>
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-primary" />
                <div><h3 className="font-bold text-sm text-foreground">Send attachment</h3><p className="text-[10px] text-muted-foreground truncate max-w-[250px]">{stagedLocalMedia.name} • {stagedLocalMedia.size}</p></div>
              </div>
              <button type="button" onClick={() => { setShowShareMediaPrompt(false); setStagedLocalMedia(null); }} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="rounded-xl border border-border bg-background min-h-32 flex items-center justify-center overflow-hidden">
                {stagedLocalMedia.type === 'image' ? <img src={stagedLocalMedia.url} alt="Attachment preview" className="max-h-64 max-w-full object-contain" /> : stagedLocalMedia.type === 'video' ? <video src={stagedLocalMedia.url} controls className="max-h-64 max-w-full" /> : stagedLocalMedia.type === 'audio' ? <div className="w-full p-5"><Music className="w-8 h-8 text-primary mx-auto mb-3" /><audio src={stagedLocalMedia.url} controls className="w-full" /></div> : <div className="p-8 text-center"><FileText className="w-12 h-12 text-primary mx-auto mb-2" /><p className="text-xs font-semibold text-foreground break-all">{stagedLocalMedia.name}</p></div>}
              </div>
              <input value={shareMediaCaption} onChange={(e) => setShareMediaCaption(e.target.value)} placeholder="Add a caption (optional)" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <div className="flex gap-2">
                <button type="button" onClick={() => mediaFileInputRef.current?.click()} className="flex-1 py-2 rounded-lg bg-secondary border border-border text-xs font-semibold">Choose another</button>
                <button type="button" onClick={handleConfirmSendMedia} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5"><Send className="w-3.5 h-3.5" />Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedMediaPreview && (
        <div 
          className="fixed inset-0 z-80 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedMediaPreview(null)}
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between text-white max-w-3xl pt-2 pb-3">
            <div>
              <p className="text-sm font-bold text-white">
                {selectedMediaPreview.sender_name || selectedMediaPreview.sender || 'Group Member'}
              </p>
              <p className="text-xs text-white/60">
                {selectedMediaPreview.created_at ? new Date(selectedMediaPreview.created_at).toLocaleString() : ''}
              </p>
            </div>
            <button
              onClick={() => setSelectedMediaPreview(null)}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Media Body */}
          <div className="flex-1 flex items-center justify-center max-w-4xl max-h-[75vh] w-full" onClick={(e) => e.stopPropagation()}>
            {selectedMediaPreview.type === 'video' ? (
              <video src={selectedMediaPreview.url} controls autoPlay className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl" />
            ) : (
              <img src={selectedMediaPreview.url} alt="Full view" className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl" />
            )}
          </div>

          {/* Footer Caption */}
          {selectedMediaPreview.caption && (
            <div className="w-full max-w-3xl pt-3 pb-2 text-center text-xs sm:text-sm text-white/90" onClick={(e) => e.stopPropagation()}>
              <p className="bg-black/60 px-4 py-2 rounded-xl inline-block border border-white/10">
                {selectedMediaPreview.caption}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Joining Group WhatsApp Animation Overlay */}
      {joiningGroup && (
        <div className="fixed inset-0 z-70 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-xs">
                {joiningGroup.name.slice(0, 1).toUpperCase()}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                Joining Official Fellowship
              </span>
              <h3 className="font-serif-church font-bold text-lg text-foreground">
                {joiningGroup.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Verifying covenant invite & connecting to members...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold pt-1">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Redirecting into group chat...</span>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal when clicking View Profile in chat */}
      {viewUserProfile && (
        <InstagramProfileModal
          userId={viewUserProfile.id}
          isOpen={Boolean(viewUserProfile)}
          onClose={() => setViewUserProfile(null)}
          onOpenDirectChat={(targetId) => {
            setViewUserProfile(null);
            setActiveTab('direct');
            setActiveUserId(targetId);
          }}
        />
      )}

    </div>
  );
};
