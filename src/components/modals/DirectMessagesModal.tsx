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
  Upload
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, DirectMessage, DmThread, ChatGroup, ChatGroupMessage, GroupMembership, GroupInvite } from '../../types';
import { StorageService } from '../../services/storageService';
import { SupabaseSyncService } from '../../services/supabaseSyncService';
import { PaynowService } from '../../services/paynowService';
import { LocalImagePicker } from '../common/LocalImagePicker';

interface DirectMessagesModalProps {
  currentUser: User;
  initialRecipientId?: string;
  initialGroupId?: string;
  onClose: () => void;
}

const EMOJI_REACTIONS = ['🙏', '❤️', '🔥', '✝️', '🕊️', '🙌', '👑', '🌟'];

export const DirectMessagesModal: React.FC<DirectMessagesModalProps> = ({
  currentUser,
  initialRecipientId,
  initialGroupId,
  onClose
}) => {
  // Screen size detection for WhatsApp mobile vs desktop layout
  const [isMobile, setIsMobile] = useState<boolean>(() => 
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
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
  const [pendingInvites, setPendingInvites] = useState<GroupInvite[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const groupMessagesEndRef = useRef<HTMLDivElement>(null);
  const groupInputRef = useRef<HTMLInputElement>(null);

  const [pinnedDms, setPinnedDms] = useState<string[]>(() => StorageService.getPinnedDms(currentUser.id));
  const [isEditingGroupDetails, setIsEditingGroupDetails] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');

  // WhatsApp-style Reply, Tagging, and Exit states
  const [replyingToMessage, setReplyingToMessage] = useState<ChatGroupMessage | null>(null);
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
    type: 'image' | 'video' | 'audio';
    name: string;
    size: string;
  } | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLocalMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let mType: 'image' | 'video' | 'audio' = 'image';
    if (file.type.startsWith('video/')) mType = 'video';
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
    if (!activeGroup || !stagedLocalMedia) return;
    if (StorageService.hasUserExitedGroup(activeGroup.id, currentUser.id)) {
      alert('You cannot send media because you exited this group fellowship. Please rejoin to participate.');
      return;
    }

    StorageService.sendChatGroupMessage(activeGroup.id, {
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      sender_avatar: currentUser.avatar_url,
      sender_role: currentUser.role,
      text: shareMediaCaption.trim() || (stagedLocalMedia.type === 'video' ? 'Shared a video' : stagedLocalMedia.type === 'audio' ? 'Shared an audio note' : 'Shared a photo'),
      media_url: stagedLocalMedia.url,
      media_type: stagedLocalMedia.type
    });

    setStagedLocalMedia(null);
    setShareMediaCaption('');
    setShowShareMediaPrompt(false);
    refreshGroupsData();
    setCopyFeedback('Media shared to fellowship group!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const isAdminOrDev = ['super_admin', 'developer', 'pastor', 'moderator'].includes(currentUser.role);
  const isSuperAdminOrDev = ['super_admin', 'developer'].includes(currentUser.role);

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
    const msgs = StorageService.getChatGroupMessagesForUser(groupId, currentUser.id);
    setGroupMessages(msgs);
  };

  useEffect(() => {
    refreshThreads();
    refreshGroupsData();

    // Event listeners for local and window-level custom events
    const handleGroupMsgUpdated = (e: any) => {
      const detail = e.detail;
      if (detail && detail.groupId === activeGroupId) {
        const msgs = StorageService.getChatGroupMessagesForUser(activeGroupId, currentUser.id);
        setGroupMessages(msgs);
      }
      refreshGroupsData();
    };

    const handleDirectMsgUpdated = () => {
      refreshMessages();
      refreshThreads();
    };

    const handleProfileUpdated = () => {
      refreshThreads();
      refreshGroupsData();
    };

    window.addEventListener('gcz_group_messages_updated', handleGroupMsgUpdated);
    window.addEventListener('gcz_direct_messages_updated', handleDirectMsgUpdated);
    window.addEventListener('gcz_user_profile_updated', handleProfileUpdated);
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
      onUserProfileUpdated: () => {
        refreshThreads();
        refreshGroupsData();
      },
      onGroupMemberChanged: () => {
        refreshGroupsData();
      }
    });

    return () => {
      window.removeEventListener('gcz_group_messages_updated', handleGroupMsgUpdated);
      window.removeEventListener('gcz_direct_messages_updated', handleDirectMsgUpdated);
      window.removeEventListener('gcz_user_profile_updated', handleProfileUpdated);
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
  const activeGroup = groups.find(g => g.id === activeGroupId) || (typeof window !== 'undefined' && !isMobile ? groups[0] : null);

  const activeGroupMembership = activeGroup 
    ? StorageService.getGroupMembership(activeGroup.id, currentUser.id) 
    : undefined;
  
  // WhatsApp-style membership check: strictly whether user has exited or is in member_ids
  const hasUserExitedActiveGroup = activeGroup 
    ? StorageService.hasUserExitedGroup(activeGroup.id, currentUser.id)
    : false;

  const isUserGroupMember = activeGroup 
    ? (activeGroup.member_ids.includes(currentUser.id) || (!activeGroup.is_paid && !hasUserExitedActiveGroup))
    : false;

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

  // WhatsApp-style Group Input change with autocomplete detection
  const handleGroupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGroupInputText(val);

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
        <span className="italic text-white/50 flex items-center gap-1.5 py-0.5">
          <span className="w-2 h-2 rounded-full bg-white/30 inline-block" />
          <span>This message was deleted</span>
        </span>
      );
    }

    const parts = text.split(/(@[A-Za-z0-9_'\s]+?(?=\s@|\s[.,!?]|$|[.,!?]))/g);
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
      return part;
    });
  };

  // Helper to render message content and interactive official invite cards with 1st "Join" and 2nd "Decline" buttons
  const renderMessageContent = (msg: { id: string; text: string; sender_id: string }) => {
    const isDeleted = msg.text === 'This message was deleted';
    if (isDeleted) {
      return renderFormattedMessageText(msg.text);
    }

    const hasInviteLink = msg.text.includes('gatewayconnect.church/join/group?code=') || msg.text.includes('Official Group Invitation:');
    if (!hasInviteLink) {
      return renderFormattedMessageText(msg.text);
    }

    // Extract group code or matching group
    const codeMatch = msg.text.match(/code=([a-zA-Z0-9_-]+)/);
    const code = codeMatch ? codeMatch[1].toLowerCase() : null;
    const matchedGroup = groups.find(g => 
      (code && g.invite_code.toLowerCase() === code) || 
      msg.text.toLowerCase().includes(g.name.toLowerCase())
    );

    const isMember = matchedGroup ? (matchedGroup.member_ids.includes(currentUser.id) || isSuperAdminOrDev) : false;
    const isDeclined = matchedGroup ? declinedInviteCodes.includes(matchedGroup.id) : false;
    const matchingPendingInvite = matchedGroup ? pendingInvites.find(inv => inv.group_id === matchedGroup.id) : null;

    return (
      <div className="space-y-2.5">
        <div>{renderFormattedMessageText(msg.text)}</div>

        {matchedGroup && (
          <div className="bg-[#001020] border border-[#D4AF37]/50 rounded-2xl p-3 space-y-2.5 text-xs shadow-xl text-white max-w-sm mt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-700 text-[#001F3F] flex items-center justify-center font-black text-sm shadow shrink-0">
                {matchedGroup.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Official Group Invitation</span>
                </div>
                <h4 className="font-bold text-white text-xs truncate">{matchedGroup.name}</h4>
                <p className="text-[10px] text-white/50">{matchedGroup.member_ids.length} members • Official Admin & Mod Link</p>
              </div>
            </div>

            {isMember ? (
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
                      handleJoinGroup(matchedGroup);
                    }
                  }}
                  className="text-[10px] text-[#D4AF37] underline font-bold hover:text-amber-300"
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
                      handleJoinGroup(matchedGroup);
                    }
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
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
      const isGroupAdmin = (activeGroup?.admin_ids || [activeGroup?.created_by]).includes(currentUser.id) || isSuperAdminOrDev;
      const allMine = selectedMessageIds.every(id => {
        const m = groupMessages.find(msg => msg.id === id);
        return m?.sender_id === currentUser.id;
      });

      setDeleteConfirmModal({
        isOpen: true,
        isMultiple: true,
        canDeleteForEveryone: allMine || isGroupAdmin,
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
        canDeleteForEveryone: allMine || isSuperAdminOrDev,
        isGroup: false
      });
    }
  };

  const handleDeleteSingleMessage = (msgId: string, isGroup: boolean) => {
    if (isGroup) {
      const msg = groupMessages.find(m => m.id === msgId);
      if (!msg) return;
      const isMine = msg.sender_id === currentUser.id;
      const isGroupAdmin = (activeGroup?.admin_ids || [activeGroup?.created_by]).includes(currentUser.id) || isSuperAdminOrDev;

      setDeleteConfirmModal({
        isOpen: true,
        isMultiple: false,
        targetMessageId: msgId,
        canDeleteForEveryone: isMine || isGroupAdmin,
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
        canDeleteForEveryone: isMine || isSuperAdminOrDev,
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
      refreshGroupsData();
    } else {
      if (deleteConfirmModal.isMultiple) {
        StorageService.deleteMultipleDirectMessages(selectedMessageIds, currentUser.id, forEveryone);
      } else if (deleteConfirmModal.targetMessageId) {
        StorageService.deleteDirectMessage(deleteConfirmModal.targetMessageId, currentUser.id, forEveryone);
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
    const cleanCode = inviteCodeInput.trim().toLowerCase();
    const grp = groups.find(g => g.invite_code.toLowerCase() === cleanCode || cleanCode.includes(g.invite_code.toLowerCase()));
    
    if (!grp) {
      alert('Invalid group invite link or code. Please check with group admin.');
      return;
    }

    setShowJoinByCodeModal(false);
    setInviteCodeInput('');
    setActiveGroupId(grp.id);

    // If user is already in this group
    if (grp.member_ids.includes(currentUser.id)) {
      alert(`You are already in ${grp.name}!`);
      return;
    }

    // If user was removed from this group by an admin
    if (grp.removed_user_ids?.includes(currentUser.id)) {
      alert(`You were removed from ${grp.name} by an admin. You cannot rejoin via invite.`);
      return;
    }

    handleJoinGroup(grp);
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
    .filter(t => 
      t.other_user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.other_user.role && t.other_user.role.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const aP = pinnedDms.includes(a.other_user.id) ? 1 : 0;
      const bP = pinnedDms.includes(b.other_user.id) ? 1 : 0;
      return bP - aP;
    });

  const filteredGroups = groups
    .filter(g =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.category && g.category.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const aP = a.pinned_by_users?.includes(currentUser.id) ? 1 : 0;
      const bP = b.pinned_by_users?.includes(currentUser.id) ? 1 : 0;
      return bP - aP;
    });

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#001428] border-0 sm:border sm:border-[#D4AF37]/40 rounded-none sm:rounded-2xl w-full max-w-4xl h-full sm:h-[92vh] sm:max-h-[780px] flex flex-col shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Bar & Mode Selector - Hidden on mobile when inside a conversation */}
        <div className={`h-14 bg-[#001F3F] border-b border-white/10 px-3 sm:px-4 flex items-center justify-between shrink-0 ${
          (activeTab === 'direct' ? activeUserId : activeGroupId) ? 'hidden sm:flex' : 'flex'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="tab-direct-messages"
                onClick={() => {
                  setActiveTab('direct');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'direct'
                    ? 'bg-[#D4AF37] text-[#001F3F] shadow'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Direct Chats</span>
              </button>

              <button
                id="tab-church-groups"
                onClick={() => {
                  setActiveTab('groups');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'groups'
                    ? 'bg-[#D4AF37] text-[#001F3F] shadow'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Church Groups</span>
                {groups.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'groups' ? 'bg-[#001F3F] text-[#D4AF37]' : 'bg-white/10 text-white'
                  }`}>
                    {groups.length}
                  </span>
                )}
                {pendingInvites.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {copyFeedback && (
              <span className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/40 animate-fade-in font-medium">
                {copyFeedback}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="Close"
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
          <div className={`w-full sm:w-80 bg-[#001A33] border-r border-white/10 flex flex-col relative ${
            (activeTab === 'direct' ? activeUserId && !showNewChatPicker : activeGroupId) ? 'hidden sm:flex' : 'flex'
          }`}>
            
            {/* Search & Actions Bar */}
            <div className="p-3 border-b border-white/10 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'direct'
                      ? (showNewChatPicker ? "Search all believers..." : "Search messages...")
                      : "Search church groups..."
                  }
                  className="w-full bg-[#001122] border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {activeTab === 'direct' ? (
                <button
                  id="btn-new-chat-plus"
                  onClick={() => setShowNewChatPicker(!showNewChatPicker)}
                  title={showNewChatPicker ? "View Conversations" : "New Chat (+)"}
                  className={`p-2 rounded-xl transition-all font-bold flex items-center justify-center shrink-0 shadow ${
                    showNewChatPicker 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30' 
                      : 'bg-[#D4AF37] text-[#001F3F] hover:bg-amber-400'
                  }`}
                >
                  {showNewChatPicker ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowJoinByCodeModal(true)}
                    title="Join via link or code"
                    className="p-2 rounded-xl bg-[#001122] border border-white/20 text-white/80 hover:text-white text-xs font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  {isAdminOrDev && (
                    <button
                      id="btn-create-church-group"
                      onClick={() => setShowCreateGroupModal(true)}
                      title="Create Church Group"
                      className="p-2 rounded-xl bg-[#D4AF37] text-[#001F3F] hover:bg-amber-400 transition-all font-bold shadow"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* DIRECT CHATS VIEW */}
            {activeTab === 'direct' && (
              <>
                {showNewChatPicker ? (
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    <div className="px-3 py-2 bg-[#001222] text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
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
                        className="w-full p-3 flex items-center gap-3 transition-colors text-left hover:bg-white/5"
                      >
                        <div className="w-10 h-10 rounded-full border border-[#D4AF37]/60 overflow-hidden bg-[#001F3F] flex items-center justify-center text-[#D4AF37] font-bold text-xs shrink-0">
                          {contact.avatar_url ? (
                            <img src={contact.avatar_url} alt={contact.full_name} className="w-full h-full object-cover" />
                          ) : (
                            contact.full_name.slice(0, 2).toUpperCase()
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white truncate flex items-center gap-1">
                              {contact.full_name}
                            </span>
                            {contact.role === 'super_admin' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold border border-[#D4AF37]/40">
                                Apostle
                              </span>
                            )}
                            {contact.role === 'developer' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                                Dev
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/50 truncate font-mono">
                            {contact.handle || `@${contact.full_name.toLowerCase().replace(/\s+/g, '_')}`} • {contact.location || 'Harare'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {filteredThreads.length === 0 ? (
                      <div className="p-6 text-center text-white/50 text-xs space-y-2">
                        <p>No active conversations yet.</p>
                        <button
                          onClick={() => setShowNewChatPicker(true)}
                          className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#001F3F] font-bold text-xs hover:bg-amber-400 transition-colors inline-flex items-center gap-1"
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
                            className={`w-full p-3 flex items-center gap-3 transition-colors text-left ${
                              isSelected ? 'bg-[#002B55] border-l-4 border-[#D4AF37]' : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div className="w-11 h-11 rounded-full border-2 border-[#D4AF37]/60 overflow-hidden bg-[#001F3F] flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                                {thread.other_user.avatar_url ? (
                                  <img src={thread.other_user.avatar_url} alt={thread.other_user.full_name} className="w-full h-full object-cover" />
                                ) : (
                                  thread.other_user.full_name.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#001A33]" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-bold text-xs text-white truncate flex items-center gap-1">
                                  {pinnedDms.includes(thread.other_user.id) && (
                                    <Pin className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37] shrink-0" />
                                  )}
                                  <span>{thread.other_user.full_name}</span>
                                  {thread.other_user.role === 'super_admin' && (
                                    <span className="text-[10px] text-[#D4AF37]">✦</span>
                                  )}
                                </span>
                                <span className="text-[10px] text-white/40">
                                  {new Date(thread.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-white/60 truncate">
                                {thread.last_message.sender_id === currentUser.id ? 'You: ' : ''}
                                {thread.last_message.text}
                              </p>
                            </div>

                            {thread.unread_count > 0 && (
                              <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
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

            {/* CHURCH GROUPS VIEW (WhatsApp Style) */}
            {activeTab === 'groups' && (
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                
                {/* Pending WhatsApp Invites for Admins & Moderators */}
                {pendingInvites.length > 0 && (
                  <div className="p-3 bg-gradient-to-b from-amber-950/60 to-black/40 border-b border-[#D4AF37]/40 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4AF37]">
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>Official Group Invitations ({pendingInvites.length})</span>
                    </div>
                    {pendingInvites.map(inv => (
                      <div key={inv.id} className="bg-[#001428] border border-[#D4AF37]/50 rounded-2xl p-3 space-y-2 text-xs shadow-md">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4AF37] to-amber-700 text-[#001F3F] font-black text-xs flex items-center justify-center shrink-0 shadow">
                            {inv.group_name.slice(0, 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-xs truncate">{inv.group_name}</p>
                            <p className="text-white/70 text-[11px] leading-tight">
                              Invited by <span className="font-semibold text-[#D4AF37]">{inv.invited_by_name}</span>
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-white/60 italic bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                          Official Admin & Moderator Invitation Link
                        </p>
                        {/* 2 Buttons at the bottom: 1st Join, 2nd Decline */}
                        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                          <button
                            onClick={() => handleRespondToInvite(inv.id, true)}
                            className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" /> Join
                          </button>
                          <button
                            onClick={() => handleRespondToInvite(inv.id, false)}
                            className="flex-1 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
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
                  const isMember = grp.member_ids.includes(currentUser.id) || isSuperAdminOrDev;
                  const isFs = grp.id === 'group_foundation_school';

                  return (
                    <button
                      key={grp.id}
                      onClick={() => handleSelectGroup(grp.id)}
                      className={`w-full p-3 flex items-center gap-3 transition-colors text-left ${
                        isSelected ? 'bg-[#002B55] border-l-4 border-[#D4AF37]' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl border-2 border-[#D4AF37]/50 overflow-hidden bg-[#001F3F] flex items-center justify-center text-[#D4AF37] font-bold text-sm shadow">
                          {grp.avatar_url ? (
                            <img src={grp.avatar_url} alt={grp.name} className="w-full h-full object-cover" />
                          ) : isFs ? (
                            <GraduationCap className="w-6 h-6 text-[#D4AF37]" />
                          ) : (
                            grp.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        {grp.is_paid && (
                          <span className="absolute -top-1 -right-1 bg-amber-500 text-[#001F3F] p-0.5 rounded-full shadow" title="Paid Group">
                            <Crown className="w-3 h-3 fill-current" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1">
                            {grp.pinned_by_users?.includes(currentUser.id) && (
                              <Pin className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37] shrink-0" />
                            )}
                            <span>{grp.name}</span>
                          </h4>
                          {grp.is_paid ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shrink-0">
                              ${grp.price_usd}/3m
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/40 shrink-0">
                              {grp.member_ids.length} members
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-white/60 truncate">
                          {grp.description}
                        </p>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white/70 font-semibold uppercase tracking-wider">
                            {grp.category || 'Group'}
                          </span>

                          {isMember ? (
                            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Enrolled
                            </span>
                          ) : (
                            <span className="text-[9px] text-[#D4AF37] font-bold">
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

            {/* Mobile WhatsApp-Style Floating Action Buttons (FABs) with icons & compact labels */}
            <div className="sm:hidden absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-auto">
              {activeTab === 'direct' ? (
                <button
                  id="fab-mobile-new-chat"
                  type="button"
                  onClick={() => setShowNewChatPicker(prev => !prev)}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-amber-400 text-[#001F3F] font-bold shadow-2xl active:scale-95 transition-transform border border-amber-300/40 cursor-pointer"
                  title="Start New Direct Chat"
                >
                  <MessageSquarePlus className="w-4 h-4 text-[#001F3F]" />
                  <span className="text-[11px] font-black uppercase tracking-wider">New Chat</span>
                </button>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinByCodeModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#001F3F] text-[#D4AF37] border border-[#D4AF37]/50 font-bold shadow-lg text-[10px] active:scale-95 transition-transform"
                    title="Join with Invite Code"
                  >
                    <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
                    <span>Join Code</span>
                  </button>
                  <button
                    id="fab-mobile-new-group"
                    type="button"
                    onClick={() => setShowCreateGroupModal(true)}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-amber-400 text-[#001F3F] font-bold shadow-2xl active:scale-95 transition-transform border border-amber-300/40 cursor-pointer"
                    title="Create Church Group"
                  >
                    <Users className="w-4 h-4 text-[#001F3F]" />
                    <span className="text-[11px] font-black uppercase tracking-wider">New Group</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN (Active Conversation Canvas for Direct OR Group) */}
          {/* ========================================================================= */}
          <div className={`flex-1 flex flex-col bg-[#001122] ${
            activeTab === 'direct' 
              ? (!activeUserId && 'hidden sm:flex') 
              : (!activeGroupId && 'hidden sm:flex')
          }`}>
            
            {/* DIRECT CHAT ACTIVE CANVAS */}
            {activeTab === 'direct' && (
              activeUser ? (
                <>
                  {/* Direct Chat Header */}
                  {isSelectMode ? (
                    <div className="h-14 bg-[#001933] border-b border-white/10 px-4 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleCancelSelectMode}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/80"
                          title="Cancel selection"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-sm text-white">
                          {selectedMessageIds.length} selected
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteSelected(false)}
                          disabled={selectedMessageIds.length === 0}
                          className="p-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 disabled:opacity-40 transition-colors cursor-pointer"
                          title="Delete selected messages"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelSelectMode}
                          className="text-xs px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-14 bg-[#001933] border-b border-white/10 px-4 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => setActiveUserId('')}
                          className="sm:hidden p-1 rounded-lg hover:bg-white/10 text-white/60"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewUserProfile(activeUser)}
                          className="flex items-center gap-2.5 text-left p-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer min-w-0"
                          title="View profile"
                        >
                          <div className="w-9 h-9 rounded-full border border-[#D4AF37]/50 overflow-hidden bg-[#001F3F] flex items-center justify-center text-xs font-bold text-[#D4AF37] shrink-0">
                            {activeUser.avatar_url ? (
                              <img src={activeUser.avatar_url} alt={activeUser.full_name} className="w-full h-full object-cover" />
                            ) : (
                              activeUser.full_name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1 truncate">
                              <span className="truncate">{activeUser.full_name}</span>
                              {activeUser.role === 'super_admin' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 font-bold shrink-0">
                                  Apostolic Lead
                                </span>
                              )}
                              {activeUser.role === 'developer' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shrink-0">
                                  Lead Dev
                                </span>
                              )}
                            </h3>
                            {isRecipientTyping ? (
                              <p className="text-[10px] text-emerald-400 flex items-center gap-1.5 truncate font-semibold animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                                <span className="truncate font-mono">typing...</span>
                              </p>
                            ) : (
                              <p className="text-[10px] text-emerald-400 flex items-center gap-1 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                <span className="truncate">Active Now • {activeUser.location || 'Harare'}</span>
                              </p>
                            )}
                          </div>
                        </button>
                      </div>

                      {/* Right Action Menu: Clean 3-dots dropdown & Close Button */}
                      <div className="relative flex items-center gap-1 sm:gap-1.5">
                        <button
                          onClick={() => setShowDirectTopMenu(prev => !prev)}
                          className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        <button
                          onClick={onClose}
                          className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                          title="Close"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {showDirectTopMenu && (
                          <div 
                            className="absolute right-0 top-11 z-50 w-52 rounded-2xl bg-[#001b36] border border-[#D4AF37]/40 shadow-2xl py-1.5 text-xs text-white divide-y divide-white/5 animate-in fade-in zoom-in-95 duration-100"
                            onClick={() => setShowDirectTopMenu(false)}
                          >
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setViewUserProfile(activeUser);
                                  setShowDirectTopMenu(false);
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                              >
                                <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                                <span>View Profile</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleStartSelectMode();
                                  setShowDirectTopMenu(false);
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                              >
                                <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                                <span>Select Messages</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleExportChatHistory('direct');
                                  setShowDirectTopMenu(false);
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-white/10 text-blue-300 flex items-center gap-2.5 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5 text-blue-400" />
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
                                className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                              >
                                <Pin className={`w-3.5 h-3.5 ${pinnedDms.includes(activeUserId) ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-white/60'}`} />
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
                                className="w-full px-3.5 py-2 text-left hover:bg-red-500/10 text-red-300 flex items-center gap-2.5 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>Clear Chat History</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SPECIAL INTERACTIVE EXPIRY CARD IN INBOX (Apostle Joe Daniels Chat) */}
                  {isFsExpiringSoon && activeUserId === 'usr_apostle_joe' && (
                    <div className="m-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/80 via-[#001F3F] to-amber-950/80 border-2 border-[#D4AF37] shadow-xl animate-fade-in space-y-2">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500 text-[#001F3F] shrink-0 font-bold">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-black text-[#D4AF37] uppercase tracking-wide flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            Foundation School Membership Expiring
                          </h4>
                          <p className="text-xs text-white/90 mt-1 leading-relaxed">
                            Special Notice from Apostle Joe Daniels: Your 3-month membership for <span className="font-bold text-[#D4AF37]">Foundation School</span> is about to expire! You can pay $150 to continue your discipleship curriculum or accept that your current session will conclude.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 sm:pl-10">
                        <button
                          onClick={() => {
                            const fsGrp = groups.find(g => g.id === 'group_foundation_school');
                            if (fsGrp) openPaymentModal(fsGrp, 'Renew your 3-month Foundation School membership for $150 USD.');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-[#001F3F] font-black text-xs shadow-md transition-transform hover:scale-[1.02] flex items-center gap-1.5"
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
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-bold text-xs transition-colors"
                        >
                          Accept Term Concluding
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Messages Bubbles Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === currentUser.id;
                      const isSelected = selectedMessageIds.includes(msg.id);
                      const isDeleted = msg.text === 'This message was deleted';

                      return (
                        <div
                          key={msg.id}
                          onClick={() => {
                            if (isSelectMode) handleToggleSelectMessage(msg.id);
                          }}
                          className={`group/msg flex items-end gap-2 transition-colors rounded-xl p-1 ${
                            isSelectMode ? 'cursor-pointer hover:bg-white/5' : ''
                          } ${isSelected ? 'bg-[#D4AF37]/15' : ''} ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          {isSelectMode && (
                            <div className="shrink-0 mb-2">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                              ) : (
                                <Square className="w-4 h-4 text-white/40" />
                              )}
                            </div>
                          )}

                          <div className={`max-w-[80%] sm:max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`px-3.5 py-2.5 rounded-2xl text-xs break-words shadow-sm leading-relaxed ${
                                isDeleted 
                                  ? 'bg-white/5 border border-white/10 text-white/50 italic'
                                  : isMine
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                                    : 'bg-[#002244] border border-white/10 text-white rounded-bl-none'
                              }`}
                            >
                              {renderMessageContent(msg)}
                            </div>

                            <div className="flex items-center gap-2 text-[9px] text-white/40 mt-1 px-1">
                              <span>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMine && !isDeleted && (
                                <span title={msg.is_read ? "Read" : "Delivered"} className="inline-flex items-center">
                                  <CheckCheck className={`w-3.5 h-3.5 inline ${msg.is_read ? 'text-sky-400' : 'text-white/40'}`} />
                                </span>
                              )}

                              {!isSelectMode && !isDeleted && (
                                <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1.5 ml-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartSelectMode(msg.id);
                                    }}
                                    className="hover:text-white text-white/50 p-0.5"
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
                                    className="hover:text-red-400 text-white/50 p-0.5"
                                    title="Delete message"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Emoji Bar */}
                  <div className="px-4 py-1.5 bg-[#00172D] border-t border-white/5 flex items-center gap-2 text-xs">
                    {EMOJI_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setInputText((prev) => prev + emoji)}
                        className="hover:scale-125 transition-transform text-sm"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Message Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="p-3 bg-[#001933] border-t border-white/10 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Message ${activeUser.full_name}...`}
                      className="flex-1 bg-[#001122] border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold transition-all shadow shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white/50">
                  <Send className="w-12 h-12 text-[#D4AF37]/50 mb-2" />
                  <h3 className="font-bold text-white text-sm">Your Direct Messages</h3>
                  <p className="text-xs text-white/60 max-w-xs mt-1">
                    Send private prayers, direct words of faith, or connect with Ministry Leaders.
                  </p>
                </div>
              )
            )}

            {/* CHURCH GROUP ACTIVE CANVAS */}
            {activeTab === 'groups' && (
              activeGroup ? (
                <>
                  {/* Group Header */}
                  {isSelectMode ? (
                    <div className="h-14 bg-[#001933] border-b border-white/10 px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleCancelSelectMode}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/80"
                          title="Cancel selection"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-sm text-white">
                          {selectedMessageIds.length} selected
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteSelected(true)}
                          disabled={selectedMessageIds.length === 0}
                          className="p-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 disabled:opacity-40 transition-colors cursor-pointer"
                          title="Delete selected messages"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelSelectMode}
                          className="text-xs px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-14 bg-[#001933] border-b border-white/10 px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => setActiveGroupId('')}
                          className="sm:hidden p-1 rounded-lg hover:bg-white/10 text-white/60"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>

                        {/* WhatsApp Style Clickable Group Name & Avatar for Group Info */}
                        <button
                          type="button"
                          onClick={() => setShowGroupInfoModal(true)}
                          className="flex items-center gap-2.5 text-left p-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group/hdr min-w-0"
                          title="Click to see group info and members in it"
                        >
                          <div className="w-9 h-9 rounded-xl border border-[#D4AF37]/50 group-hover/hdr:border-[#D4AF37] overflow-hidden bg-[#001F3F] flex items-center justify-center text-xs font-bold text-[#D4AF37] shrink-0 transition-colors">
                            {activeGroup.avatar_url ? (
                              <img src={activeGroup.avatar_url} alt={activeGroup.name} className="w-full h-full object-cover" />
                            ) : (
                              activeGroup.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-xs sm:text-sm text-white group-hover/hdr:text-[#D4AF37] flex items-center gap-1.5 truncate transition-colors">
                              <span className="truncate">{activeGroup.name}</span>
                              {activeGroup.is_paid && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shrink-0">
                                  Paid $150
                                </span>
                              )}
                            </h3>
                            {groupTypingUserName ? (
                              <p className="text-[10px] text-emerald-400 flex items-center gap-1.5 truncate font-semibold animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                                <span className="truncate font-mono">{groupTypingUserName} is typing...</span>
                              </p>
                            ) : (
                              <p className="text-[10px] text-white/60 flex items-center gap-1.5 truncate">
                                <span>{activeGroup.member_ids.length} members</span>
                                <span>•</span>
                                <span className="text-[#D4AF37] font-semibold">Group Info</span>
                              </p>
                            )}
                          </div>
                        </button>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {/* Share WhatsApp Invite Link */}
                        <button
                          onClick={() => handleCopyLink(activeGroup.invite_code)}
                          title="Copy Group Invite Link"
                          className="p-1.5 px-2 rounded-xl bg-[#001122] hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs flex items-center gap-1 font-semibold"
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span className="hidden md:inline">Invite</span>
                        </button>

                        {/* WhatsApp-style 3-dots Dropdown Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setShowGroupTopMenu(prev => !prev)}
                            className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                            title="More group options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {showGroupTopMenu && (
                            <div 
                              className="absolute right-0 top-11 z-50 w-52 rounded-2xl bg-[#001b36] border border-[#D4AF37]/40 shadow-2xl py-1.5 text-xs text-white divide-y divide-white/5 animate-in fade-in zoom-in-95 duration-100"
                              onClick={() => setShowGroupTopMenu(false)}
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setShowGroupInfoModal(true);
                                    setShowGroupTopMenu(false);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                                >
                                  <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  <span>Group Info</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setShowMediaBrowserModal(true);
                                    setShowGroupTopMenu(false);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                                >
                                  <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                                  <span>Media, Links & Docs</span>
                                </button>

                                <button
                                  onClick={() => {
                                    handleStartSelectMode();
                                    setShowGroupTopMenu(false);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                                >
                                  <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Select Messages</span>
                                </button>

                                <button
                                  onClick={() => {
                                    handleExportChatHistory('group');
                                    setShowGroupTopMenu(false);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-white/10 text-blue-300 flex items-center gap-2.5 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Export Chat (.txt)</span>
                                </button>

                                {isUserGroupMember && (
                                  <button
                                    onClick={() => {
                                      setShowAddMemberModal(true);
                                      setShowGroupTopMenu(false);
                                    }}
                                    className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                                  >
                                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
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
                                  className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                                >
                                  <Pin className={`w-3.5 h-3.5 ${activeGroup.pinned_by_users?.includes(currentUser.id) ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-white/60'}`} />
                                  <span>{activeGroup.pinned_by_users?.includes(currentUser.id) ? 'Unpin Group' : 'Pin Group'}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    handleCopyLink(activeGroup.invite_code);
                                    setShowGroupTopMenu(false);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
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
                                    className="w-full px-3.5 py-2 text-left hover:bg-white/10 text-white/80 flex items-center gap-2.5 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-amber-400" />
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
                                    className="w-full px-3.5 py-2 text-left hover:bg-red-500/10 text-red-400 flex items-center gap-2.5 transition-colors"
                                  >
                                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                                    <span>Exit Group</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* WhatsApp-style direct modal Close Button in Header */}
                        <button
                          onClick={onClose}
                          className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                          title="Close"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SPECIAL BANNER FOR FOUNDATION SCHOOL EXPIRY (Inside Group) */}
                  {activeGroup.id === 'group_foundation_school' && (
                    <div className="px-4 py-2 bg-gradient-to-r from-amber-950/70 via-[#001F3F] to-amber-950/70 border-b border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                        <span className="font-bold text-white">
                          Foundation School 3-Month Curriculum
                        </span>
                        {activeGroupMembership?.expires_at && (
                          <span className="text-[10px] text-[#D4AF37]">
                            (Term active until {new Date(activeGroupMembership.expires_at).toLocaleDateString()})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Instant Simulator trigger so user can test the expiry notice workflow */}
                        <button
                          onClick={() => {
                            StorageService.triggerFoundationSchoolExpiryNotice(currentUser.id);
                            refreshGroupsData();
                            refreshThreads();
                            alert('Foundation School Expiry Notice has been triggered! Check your inbox and the top banner.');
                          }}
                          className="text-[10px] px-2 py-1 rounded-md bg-[#001122] border border-amber-400/40 text-amber-300 hover:bg-amber-400/10 font-bold"
                          title="Simulate membership expiry notice"
                        >
                          ⚡ Test Expiry Notice
                        </button>

                        {isFsExpiringSoon && (
                          <button
                            onClick={() => openPaymentModal(activeGroup, 'Renew your 3-month Foundation School membership for $150 USD.')}
                            className="text-[10px] px-2.5 py-1 rounded-md bg-[#D4AF37] text-[#001F3F] font-black hover:bg-amber-400"
                          >
                            Pay $150 to Renew
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pinned Notice if exists */}
                  {activeGroup.pinned_notice && (
                    <div className="px-4 py-2 bg-[#00162B] border-b border-white/5 flex items-center gap-2 text-xs text-white/80">
                      <Flame className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span className="truncate font-medium">{activeGroup.pinned_notice}</span>
                    </div>
                  )}

                  {/* Non-Member Locked Overlay if removed by admin or unpaid Foundation School */}
                  {activeGroup.removed_user_ids?.includes(currentUser.id) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-xl">
                        <Lock className="w-8 h-8" />
                      </div>
                      <div className="max-w-md space-y-2">
                        <h3 className="text-lg font-serif-church font-bold text-white">
                          Removed from {activeGroup.name}
                        </h3>
                        <p className="text-xs text-white/70 leading-relaxed">
                          You were removed from this group by an administrator. You cannot view chat history or rejoin this group.
                        </p>
                      </div>
                    </div>
                  ) : (activeGroup.is_paid && !activeGroupMembership && !isSuperAdminOrDev) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[#D4AF37] shadow-xl">
                        <GraduationCap className="w-8 h-8" />
                      </div>
                      <div className="max-w-md space-y-1.5">
                        <h3 className="text-lg font-serif-church font-bold text-white">
                          Enroll in {activeGroup.name}
                        </h3>
                        <p className="text-xs text-white/70 leading-relaxed">
                          {activeGroup.description}
                        </p>
                        <div className="py-2 px-4 rounded-xl bg-[#001A33] border border-white/10 text-xs font-semibold text-[#D4AF37] inline-block">
                          Term Fee: ${activeGroup.price_usd || 150} USD for {activeGroup.duration_months || 3} Months
                        </div>
                      </div>

                      <button
                        id="btn-enroll-foundation-school"
                        onClick={() => openPaymentModal(activeGroup)}
                        className="px-6 py-2.5 rounded-xl bg-[#D4AF37] text-[#001F3F] font-black text-sm uppercase tracking-wider shadow-lg hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Enroll & Join Group (${activeGroup.price_usd || 150})</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Messages History */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                        {groupMessages.map((msg) => {
                          const isMine = msg.sender_id === currentUser.id;
                          const isSelected = selectedMessageIds.includes(msg.id);
                          const isDeleted = msg.text === 'This message was deleted';

                          if (msg.is_system) {
                            return (
                              <div key={msg.id} className="flex justify-center my-2">
                                <span className="text-[10px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-center font-medium">
                                  {msg.text}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={msg.id}
                              onClick={() => {
                                if (isSelectMode) handleToggleSelectMessage(msg.id);
                              }}
                              className={`group/msg flex items-start gap-2.5 transition-colors rounded-xl p-1 ${
                                isSelectMode ? 'cursor-pointer hover:bg-white/5' : ''
                              } ${isSelected ? 'bg-[#D4AF37]/15' : ''} ${isMine ? 'flex-row-reverse' : ''}`}
                            >
                              {isSelectMode && (
                                <div className="shrink-0 mt-2">
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                                  ) : (
                                    <Square className="w-4 h-4 text-white/40" />
                                  )}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenUserProfile(msg.sender_name);
                                }}
                                className="w-8 h-8 rounded-full border border-[#D4AF37]/40 hover:border-[#D4AF37] overflow-hidden bg-[#001F3F] flex items-center justify-center text-[10px] font-bold text-[#D4AF37] shrink-0 mt-0.5 cursor-pointer"
                                title={`View ${msg.sender_name}'s profile`}
                              >
                                {msg.sender_avatar ? (
                                  <img src={msg.sender_avatar} alt={msg.sender_name} className="w-full h-full object-cover" />
                                ) : (
                                  msg.sender_name.slice(0, 2).toUpperCase()
                                )}
                              </button>

                              <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-1.5 mb-1 px-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenUserProfile(msg.sender_name);
                                    }}
                                    className="text-[11px] font-bold text-white/90 hover:text-[#D4AF37] transition-colors cursor-pointer"
                                  >
                                    {isMine ? 'You' : msg.sender_name}
                                  </button>
                                  {msg.sender_role === 'super_admin' && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold border border-[#D4AF37]/30">
                                      Apostle ✦
                                    </span>
                                  )}
                                  {msg.sender_role === 'developer' && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                                      Dev 🛡️
                                    </span>
                                  )}
                                </div>

                                <div
                                  className={`px-3.5 py-2.5 rounded-2xl text-xs break-words shadow-sm leading-relaxed ${
                                    isDeleted
                                      ? 'bg-white/5 border border-white/10 text-white/50 italic'
                                      : isMine
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
                                        : 'bg-[#002244] border border-white/10 text-white rounded-tl-none'
                                  }`}
                                >
                                  {/* WhatsApp-style Quoted Reply Banner inside Message */}
                                  {msg.reply_to && !isDeleted && (
                                    <div className="mb-2 p-2 rounded-xl bg-black/35 border-l-4 border-[#D4AF37] text-left text-[11px] leading-snug">
                                      <div className="font-bold text-[#D4AF37] text-[10px] flex items-center gap-1">
                                        <Reply className="w-3 h-3" />
                                        <span>{msg.reply_to.sender_name}</span>
                                      </div>
                                      <p className="text-white/80 line-clamp-2 text-[11px] mt-0.5">
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
                                      className="mb-2 rounded-xl overflow-hidden max-w-xs cursor-pointer group/media relative border border-white/15 shadow-md"
                                    >
                                      <img
                                        src={msg.media_url}
                                        alt="Group Media"
                                        className="w-full max-h-60 object-cover group-hover/media:scale-105 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="p-1 px-2.5 rounded-full bg-black/75 text-white text-[10px] flex items-center gap-1 font-semibold">
                                          <ImageIcon className="w-3 h-3" /> View Photo
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Formatted message text with @ mentions highlighted */}
                                  <div>{renderMessageContent(msg)}</div>
                                </div>

                                <div className="flex items-center gap-2 text-[9px] text-white/40 mt-1 px-1">
                                  <span>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>

                                  {isMine && !isDeleted && (
                                    <span title={(msg.read_by_user_ids && msg.read_by_user_ids.length > 1) ? "Read by group members" : "Delivered"} className="inline-flex items-center">
                                      <CheckCheck className={`w-3.5 h-3.5 inline ${(msg.read_by_user_ids && msg.read_by_user_ids.length > 1) ? 'text-sky-400' : 'text-white/40'}`} />
                                    </span>
                                  )}

                                  {!isSelectMode && !isDeleted && (
                                    <div className="flex items-center gap-1.5 opacity-80 group-hover/msg:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setReplyingToMessage(msg);
                                          setTimeout(() => groupInputRef.current?.focus(), 50);
                                        }}
                                        className="hover:text-[#D4AF37] p-0.5 transition-colors flex items-center gap-0.5 font-medium cursor-pointer"
                                        title={`Reply to ${msg.sender_name}`}
                                      >
                                        <Reply className="w-3 h-3" />
                                        <span>Reply</span>
                                      </button>
                                      <span>•</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuickTagUser(msg.sender_name);
                                        }}
                                        className="hover:text-[#D4AF37] p-0.5 transition-colors flex items-center gap-0.5 font-medium cursor-pointer"
                                        title={`Tag @${msg.sender_name}`}
                                      >
                                        <AtSign className="w-3 h-3" />
                                        <span>Tag</span>
                                      </button>
                                      <span>•</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSingleMessage(msg.id, true);
                                        }}
                                        className="hover:text-red-400 p-0.5 transition-colors flex items-center gap-0.5 font-medium cursor-pointer"
                                        title="Delete message"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={groupMessagesEndRef} />
                      </div>

                      {/* Quick Emoji Bar & Input Form or Admin-only Lock Notice / Non-Member Notice */}
                      {hasUserExitedActiveGroup ? (
                        <div className="p-3.5 bg-[#001933] border-t border-white/10 text-center flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 py-4">
                          <div className="flex items-center gap-2 text-xs text-white/80 font-medium">
                            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>You cannot send messages anymore because you exited this group fellowship.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleJoinGroup(activeGroup)}
                            className="px-4 py-1.5 rounded-full bg-[#D4AF37] hover:bg-amber-400 text-[#001F3F] text-xs font-black transition-transform hover:scale-105 shrink-0 cursor-pointer shadow flex items-center gap-1.5"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Rejoin Group</span>
                          </button>
                        </div>
                      ) : (activeGroup.is_paid && !isUserGroupMember && !isSuperAdminOrDev) ? (
                        <div className="p-3.5 bg-[#001933] border-t border-white/10 text-center flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 py-4">
                          <div className="flex items-center gap-2 text-xs text-white/80 font-medium">
                            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Enrollment required to participate in {activeGroup.name}.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openPaymentModal(activeGroup, `To post in ${activeGroup.name}, please complete your $${activeGroup.price_usd || 150} membership enrollment.`)}
                            className="px-4 py-1.5 rounded-full bg-[#D4AF37] hover:bg-amber-400 text-[#001F3F] text-xs font-black transition-transform hover:scale-105 shrink-0 cursor-pointer shadow flex items-center gap-1.5"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Enroll Now (${activeGroup.price_usd || 150})</span>
                          </button>
                        </div>
                      ) : (!activeGroup.only_admins_can_send_messages || 
                        (activeGroup.admin_ids || [activeGroup.created_by]).includes(currentUser.id) || 
                        ['super_admin', 'developer'].includes(currentUser.role)) ? (
                        <>
                          {/* WhatsApp-style Replying Quote Preview Banner */}
                          {replyingToMessage && (
                            <div className="px-4 py-2 bg-[#00172D] border-t border-[#D4AF37]/30 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 duration-150">
                              <div className="flex items-center gap-2.5 border-l-4 border-[#D4AF37] pl-2.5 py-0.5 min-w-0">
                                <Reply className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-[10px] font-bold text-[#D4AF37] block">
                                    Replying to {replyingToMessage.sender_name}
                                  </span>
                                  <span className="text-white/70 text-xs truncate block max-w-xs sm:max-w-md">
                                    {replyingToMessage.text}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setReplyingToMessage(null)}
                                className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white shrink-0"
                                title="Cancel reply"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {/* WhatsApp-style @ Tag User Suggestions Autocomplete Dropdown */}
                          {mentionSuggestionsOpen && (
                            <div className="p-2 bg-[#001224] border-t border-b border-[#D4AF37]/30 max-h-44 overflow-y-auto space-y-1 shadow-2xl">
                              <div className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider px-2 py-0.5 flex items-center gap-1">
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
                                    className="w-full p-1.5 px-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between gap-2 text-left text-xs transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-6 h-6 rounded-full bg-[#001F3F] border border-[#D4AF37]/40 flex items-center justify-center text-[10px] font-bold text-[#D4AF37] shrink-0">
                                        {member.full_name.slice(0, 2).toUpperCase()}
                                      </div>
                                      <span className="font-semibold text-white truncate">{member.full_name}</span>
                                      {member.role === 'super_admin' && (
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold">Apostle</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-[#D4AF37] font-semibold shrink-0">@tag</span>
                                  </button>
                                ))}
                            </div>
                          )}

                          {/* Quick Emoji Bar */}
                          <div className="px-4 py-1.5 bg-[#00172D] border-t border-white/5 flex items-center gap-2 text-xs">
                            {EMOJI_REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => setGroupInputText((prev) => prev + emoji)}
                                className="hover:scale-125 transition-transform text-sm"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>

                          {/* Group Message Input Form */}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSendGroupMessage();
                            }}
                            className="p-3 bg-[#001933] border-t border-white/10 flex items-center gap-2"
                          >
                            {/* Quick @ Tag button */}
                            <button
                              type="button"
                              onClick={() => {
                                setMentionSuggestionsOpen(prev => !prev);
                                setMentionFilter('');
                              }}
                              title="Tag a group member"
                              className={`p-2 rounded-full border text-xs transition-colors shrink-0 ${
                                mentionSuggestionsOpen
                                  ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37]'
                                  : 'bg-[#001122] hover:bg-white/10 text-white/70 hover:text-white border-white/20'
                              }`}
                            >
                              <AtSign className="w-4 h-4" />
                            </button>

                            {/* Share Photo Button */}
                            <button
                              type="button"
                              onClick={() => setShowShareMediaPrompt(true)}
                              title="Share photo to group"
                              className="p-2 rounded-full bg-[#001122] hover:bg-white/10 text-white/70 hover:text-[#D4AF37] border border-white/20 text-xs transition-colors shrink-0"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>

                            <input
                              ref={groupInputRef}
                              type="text"
                              value={groupInputText}
                              onChange={handleGroupInputChange}
                              placeholder={`Message ${activeGroup.name} (type @ to tag)...`}
                              className="flex-1 bg-[#001122] border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
                            />
                            <button
                              type="submit"
                              disabled={!groupInputText.trim()}
                              className="p-2.5 rounded-full bg-[#D4AF37] hover:bg-amber-400 disabled:opacity-40 text-[#001F3F] font-bold transition-all shadow shrink-0 cursor-pointer"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </form>
                        </>
                      ) : (
                        <div className="p-3.5 bg-[#001933] border-t border-white/10 text-center text-xs text-white/70 flex items-center justify-center gap-2 py-4">
                          <Lock className="w-4 h-4 text-[#D4AF37]" />
                          <span>Only administrators can send messages to <strong>{activeGroup.name}</strong>.</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white/50">
                  <Users className="w-12 h-12 text-[#D4AF37]/50 mb-2" />
                  <h3 className="font-bold text-white text-sm">Gateway Church Groups</h3>
                  <p className="text-xs text-white/60 max-w-xs mt-1">
                    Join ministry wings, brotherhood cells, ladies grooming, and the Foundation School.
                  </p>
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
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3"
          onClick={() => setShowPaymentModal(false)}
        >
          <div 
            className="bg-[#001B36] border-2 border-[#D4AF37] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-white animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] text-[#001F3F] flex items-center justify-center font-bold">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif-church font-bold text-base text-[#D4AF37]">
                    {paymentTargetGroup.name} Enrollment
                  </h3>
                  <p className="text-xs text-white/70">Apostolic 3-Month Discipleship Term</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentNoticeMessage && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-[#D4AF37]/40 text-xs text-amber-200">
                {paymentNoticeMessage}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-[#001122] border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between items-center text-white/70">
                <span>Tuition / Membership Term</span>
                <span className="font-bold text-white">3 Months (90 Days)</span>
              </div>
              <div className="flex justify-between items-center text-white/70">
                <span>Curriculum Modules</span>
                <span className="font-bold text-emerald-400">All Included</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between items-center text-sm">
                <span className="font-bold text-white">Total Membership Fee</span>
                <span className="font-black text-[#D4AF37] text-lg">${paymentTargetGroup.price_usd || 150} USD</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-white/80">Select Payment Method</label>
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
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === m.id
                        ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37]'
                        : 'bg-[#001122] text-white/70 border-white/15 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-white/80">
                {paymentMethod === 'card' ? 'Cardholder Phone' : `${paymentMethod === 'ecocash' ? 'EcoCash' : 'InnBucks'} Number`}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="tel"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  placeholder="0772123456"
                  className="w-full bg-[#001122] border border-white/20 rounded-xl pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Pay Button */}
            <button
              id="btn-confirm-foundation-school-payment"
              onClick={handleProcessPayment}
              disabled={isProcessingPayment || !paymentPhone.trim()}
              className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-amber-400 disabled:opacity-50 text-[#001F3F] font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#001F3F] border-t-transparent rounded-full animate-spin" />
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
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3"
          onClick={() => setShowCreateGroupModal(false)}
        >
          <div 
            className="bg-[#001B36] border border-[#D4AF37]/50 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-white animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#001F3F] flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-church font-bold text-base text-[#D4AF37]">
                    Create Church Group
                  </h3>
                  <p className="text-[11px] text-white/60">WhatsApp-style Fellowship Cell</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-white/90 mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Ignite Worship Team"
                  className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-bold text-white/90 mb-1">About / Description</label>
                <textarea
                  rows={2}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="State the purpose and mission of the group..."
                  className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-white/90 mb-1">Category</label>
                  <select
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(e.target.value as any)}
                    className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {['Worship', 'Men', 'Women', 'Youth', 'School', 'General'].map(c => (
                      <option key={c} value={c} className="bg-[#001F3F] text-white">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-white/90 mb-1">Avatar Image URL</label>
                  <input
                    type="url"
                    value={newGroupAvatar}
                    onChange={(e) => setNewGroupAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <LocalImagePicker value={newGroupAvatar} onChange={setNewGroupAvatar} className="mt-1.5" />
                </div>
              </div>

              {/* Paid Group Toggle (e.g. Foundation School) */}
              <div className="p-3 rounded-2xl bg-[#001122] border border-white/10 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGroupIsPaid}
                    onChange={(e) => setNewGroupIsPaid(e.target.checked)}
                    className="w-4 h-4 rounded border-white/30 text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <span className="font-bold text-white text-xs">
                    Paid Membership Group (e.g. Foundation School)
                  </span>
                </label>

                {newGroupIsPaid && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-white/70 mb-1">Price (USD)</label>
                      <input
                        type="number"
                        min="1"
                        value={newGroupPrice}
                        onChange={(e) => setNewGroupPrice(Number(e.target.value))}
                        className="w-full bg-[#001933] border border-white/20 rounded-xl p-2 text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-white/70 mb-1">Duration (Months)</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={newGroupDuration}
                        onChange={(e) => setNewGroupDuration(Number(e.target.value))}
                        className="w-full bg-[#001933] border border-white/20 rounded-xl p-2 text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-white/90 mb-1">Pinned Welcome Notice</label>
                <input
                  type="text"
                  value={newGroupPinnedNotice}
                  onChange={(e) => setNewGroupPinnedNotice(e.target.value)}
                  placeholder="e.g. Welcome in Jesus' name! Iron sharpens iron."
                  className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-[#001F3F] font-black uppercase tracking-wider text-xs shadow-lg transition-transform hover:scale-[1.02] mt-2"
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
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3"
          onClick={() => setShowAddMemberModal(false)}
        >
          <div 
            className="bg-[#001B36] border border-[#D4AF37]/50 rounded-3xl max-w-md w-full p-5 space-y-3 shadow-2xl text-white animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div>
                <h3 className="font-serif-church font-bold text-base text-[#D4AF37]">
                  Add Member to {activeGroup.name}
                </h3>
                <p className="text-[11px] text-white/60">Select from congregation members</p>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-[11px] text-blue-300 leading-snug">
              <span className="font-bold">WhatsApp Protocol Notice:</span> Super Admins (Apostle Joe, Prophetess Melinda, Pastor Easter) and Developers cannot be forced into groups directly; an official invitation will be sent to their inbox for them to accept or decline.
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5 space-y-1">
              {prioritizedContacts
                .filter(u => !activeGroup.member_ids.includes(u.id))
                .map(contact => {
                  const isPrivileged = ['super_admin', 'developer'].includes(contact.role);
                  return (
                    <div key={contact.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-white/5 rounded-xl">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full border border-[#D4AF37]/50 overflow-hidden bg-[#001F3F] flex items-center justify-center text-[10px] font-bold text-[#D4AF37] shrink-0">
                          {contact.avatar_url ? (
                            <img src={contact.avatar_url} alt={contact.full_name} className="w-full h-full object-cover" />
                          ) : (
                            contact.full_name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white truncate flex items-center gap-1">
                            <span>{contact.full_name}</span>
                            {isPrivileged && (
                              <span className="text-[9px] px-1 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold">
                                {contact.role === 'super_admin' ? 'Super Admin' : 'Dev'}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-white/50 truncate font-mono">
                            {contact.phone} • {contact.location || 'Harare'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddMemberToGroup(contact)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                          isPrivileged
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                            : 'bg-[#D4AF37] text-[#001F3F] hover:bg-amber-400'
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
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3"
          onClick={() => setShowJoinByCodeModal(false)}
        >
          <div 
            className="bg-[#001B36] border border-[#D4AF37]/50 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-white animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-serif-church font-bold text-sm text-[#D4AF37]">
                Join via Group Link / Code
              </h3>
              <button
                onClick={() => setShowJoinByCodeModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block text-white/80 font-semibold">Paste Invite Code or Link</label>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                placeholder="e.g. ignite-worship-2026 or https://gatewayconnect.church/join/group?code=..."
                className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {(() => {
              const cleanInput = inviteCodeInput.trim().toLowerCase();
              const matched = cleanInput ? groups.find(g => g.invite_code.toLowerCase() === cleanInput || cleanInput.includes(g.invite_code.toLowerCase())) : null;

              return (
                <div className="space-y-3">
                  {matched && (
                    <div className="bg-[#001224] border border-[#D4AF37]/40 rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-amber-700 text-[#001F3F] font-black text-sm flex items-center justify-center shrink-0 shadow">
                        {matched.name.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-xs truncate">{matched.name}</h4>
                        <p className="text-[10px] text-white/60 truncate">{matched.description || 'Church Community Group'}</p>
                        <p className="text-[10px] text-[#D4AF37] font-semibold">{matched.member_ids.length} members</p>
                      </div>
                    </div>
                  )}

                  {/* Two Buttons at the bottom: 1st Join, 2nd Decline */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <button
                      onClick={handleJoinByCode}
                      disabled={!inviteCodeInput.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow disabled:opacity-40 transition-all active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Join</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowJoinByCodeModal(false);
                        setInviteCodeInput('');
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
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
      {showGroupInfoModal && activeGroup && (() => {
        const isUserGroupAdmin = (activeGroup.admin_ids || [activeGroup.created_by]).includes(currentUser.id) || isSuperAdminOrDev;
        const isGroupPinned = activeGroup.pinned_by_users?.includes(currentUser.id);

        return (
          <div 
            className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3"
            onClick={() => {
              setShowGroupInfoModal(false);
              setIsEditingGroupDetails(false);
            }}
          >
            <div 
              className="bg-[#001B36] border border-[#D4AF37]/50 rounded-2xl max-w-sm w-full p-3.5 space-y-2.5 shadow-2xl text-white animate-in zoom-in-95 duration-150 max-h-[82vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="font-serif-church font-bold text-sm text-[#D4AF37]">
                    Group Info
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {isUserGroupAdmin && !isEditingGroupDetails && (
                    <button
                      onClick={() => {
                        setEditGroupName(activeGroup.name);
                        setEditGroupDesc(activeGroup.description);
                        setIsEditingGroupDetails(true);
                      }}
                      className="p-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#D4AF37] text-[11px] font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowGroupInfoModal(false);
                      setIsEditingGroupDetails(false);
                    }}
                    className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Group Header Info / Edit Form */}
              {isEditingGroupDetails ? (
                <div className="p-2.5 rounded-xl bg-[#001122] border border-[#D4AF37]/30 space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-white/70 uppercase mb-0.5">Group Name</label>
                    <input
                      type="text"
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      className="w-full bg-[#001F3F] border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/70 uppercase mb-0.5">Description</label>
                    <textarea
                      rows={2}
                      value={editGroupDesc}
                      onChange={(e) => setEditGroupDesc(e.target.value)}
                      className="w-full bg-[#001F3F] border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setIsEditingGroupDetails(false)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        StorageService.updateGroupInfo(activeGroup.id, {
                          name: editGroupName,
                          description: editGroupDesc
                        });
                        refreshGroupsData();
                        setIsEditingGroupDetails(false);
                      }}
                      className="px-3 py-1 rounded-lg bg-[#D4AF37] text-[#001F3F] text-xs font-bold shadow"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-1 py-0.5">
                  <div className="w-12 h-12 rounded-xl border border-[#D4AF37] overflow-hidden bg-[#001F3F] mx-auto flex items-center justify-center text-base font-bold text-[#D4AF37] shadow">
                    {activeGroup.avatar_url ? (
                      <img src={activeGroup.avatar_url} alt={activeGroup.name} className="w-full h-full object-cover" />
                    ) : (
                      activeGroup.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-white">{activeGroup.name}</h4>
                  <p className="text-[11px] text-white/70 max-w-xs mx-auto line-clamp-2 leading-tight">{activeGroup.description}</p>
                </div>
              )}

              {/* Group Meta Info */}
              <div className="p-2 rounded-xl bg-[#001122] border border-white/10 grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="text-white/60">
                  <span className="block text-[10px] uppercase text-white/40">Leader</span>
                  <span className="font-semibold text-white truncate block">{activeGroup.creator_name}</span>
                </div>
                <div className="text-white/60">
                  <span className="block text-[10px] uppercase text-white/40">Category</span>
                  <span className="font-semibold text-[#D4AF37] truncate block">{activeGroup.category || 'General'}</span>
                </div>
                <div className="text-white/60">
                  <span className="block text-[10px] uppercase text-white/40">Invite Code</span>
                  <span className="font-mono font-semibold text-white/90 truncate block">{activeGroup.invite_code}</span>
                </div>
                {activeGroup.is_paid && (
                  <div className="text-white/60">
                    <span className="block text-[10px] uppercase text-white/40">Membership</span>
                    <span className="font-semibold text-amber-400 truncate block">${activeGroup.price_usd || 150}</span>
                  </div>
                )}
              </div>

              {/* Admin Permissions Controls (WhatsApp Style) */}
              {isUserGroupAdmin && (
                <div className="p-2 rounded-xl bg-[#001830] border border-[#D4AF37]/30 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                    <Shield className="w-3 h-3" />
                    <span>Admin Controls</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/80">Only Admins Post Messages</span>
                    <button
                      onClick={() => {
                        StorageService.updateGroupSettings(activeGroup.id, {
                          only_admins_can_send_messages: !activeGroup.only_admins_can_send_messages
                        });
                        refreshGroupsData();
                      }}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        activeGroup.only_admins_can_send_messages ? 'bg-[#D4AF37]' : 'bg-white/20'
                      }`}
                    >
                      <span className={`block w-3.5 h-3.5 rounded-full bg-[#001F3F] transition-transform ${
                        activeGroup.only_admins_can_send_messages ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                    <span className="text-white/80">Only Admins Add Members</span>
                    <button
                      onClick={() => {
                        StorageService.updateGroupSettings(activeGroup.id, {
                          only_admins_can_add_members: !activeGroup.only_admins_can_add_members
                        });
                        refreshGroupsData();
                      }}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        activeGroup.only_admins_can_add_members ? 'bg-[#D4AF37]' : 'bg-white/20'
                      }`}
                    >
                      <span className={`block w-3.5 h-3.5 rounded-full bg-[#001F3F] transition-transform ${
                        activeGroup.only_admins_can_add_members ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Members List with Admin Badges & Promotion */}
              <div className="flex-1 overflow-y-auto space-y-1 min-h-[100px] max-h-[180px]">
                <div className="flex items-center justify-between px-1">
                  <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    Members ({activeGroup.member_ids.length})
                  </h5>
                  <span className="text-[10px] text-[#D4AF37]">
                    {(activeGroup.admin_ids || [activeGroup.created_by]).length} Admin(s)
                  </span>
                </div>
                <div className="divide-y divide-white/5">
                  {activeGroup.member_ids.map(mid => {
                    const mUser = StorageService.getAllUsers().find(u => u.id === mid);
                    const isMemberAdmin = (activeGroup.admin_ids || [activeGroup.created_by]).includes(mid) || mUser?.role === 'super_admin';
                    const isCreator = mid === activeGroup.created_by;

                    return (
                      <div key={mid} className="py-1.5 px-1 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-[#001F3F] border border-white/20 flex items-center justify-center text-[9px] text-[#D4AF37] font-bold shrink-0">
                            {mUser?.full_name?.slice(0, 2).toUpperCase() || 'MB'}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-white/90 truncate block text-[11px]">
                              {mUser?.full_name || 'Member'}
                              {mid === currentUser.id && ' (You)'}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {isMemberAdmin && (
                                <span className="text-[8.5px] px-1 py-0.2 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 font-bold">
                                  {isCreator ? 'Creator' : 'Admin'}
                                </span>
                              )}
                              {mUser?.role && mUser.role !== 'member' && (
                                <span className="text-[8.5px] px-1 py-0.2 rounded bg-white/10 text-white/60 capitalize">
                                  {mUser.role.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Direct Message (Inbox) button - ICON ONLY, no text label */}
                          {mid !== currentUser.id && mUser && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowGroupInfoModal(false);
                                setActiveTab('direct');
                                setActiveUserId(mUser.id);
                              }}
                              className="p-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 transition-colors cursor-pointer"
                              title={`Direct Message ${mUser.full_name}`}
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>
                          )}

                          {/* Admin Actions: Promote / Dismiss / Remove */}
                          {isUserGroupAdmin && mid !== currentUser.id && !isCreator && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  StorageService.togglePromoteGroupAdmin(activeGroup.id, mid);
                                  refreshGroupsData();
                                }}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                                  isMemberAdmin
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                                    : 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/30'
                                }`}
                                title={isMemberAdmin ? 'Dismiss as Admin' : 'Promote to Admin'}
                              >
                                {isMemberAdmin ? 'Dismiss' : 'Promote'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Remove ${mUser?.full_name || 'this member'} from ${activeGroup.name}?`)) {
                                    StorageService.removeMemberFromGroup(activeGroup.id, mid, currentUser.id);
                                    refreshGroupsData();
                                  }
                                }}
                                className="p-0.5 px-1.5 rounded bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-[9px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                                title={`Remove member`}
                              >
                                <UserMinus className="w-2.5 h-2.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      StorageService.togglePinChatGroup(activeGroup.id, currentUser.id);
                      refreshGroupsData();
                    }}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 shadow transition-colors cursor-pointer ${
                      isGroupPinned
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                        : 'bg-white/10 border-white/15 text-white hover:bg-white/15'
                    }`}
                  >
                    <Pin className={`w-3 h-3 ${isGroupPinned ? 'fill-[#D4AF37]' : ''}`} />
                    <span>{isGroupPinned ? 'Unpin' : 'Pin'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(activeGroup.invite_code)}
                    className="py-1.5 px-2 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-[#001F3F] font-bold text-[11px] flex items-center justify-center gap-1 shadow cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Invite</span>
                  </button>

                  {/* Functional Clear Chat Button so a user can clear chats from their end */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowGroupInfoModal(false);
                      setClearChatConfirmModal({
                        isOpen: true,
                        isGroup: true,
                        title: activeGroup.name
                      });
                    }}
                    className="py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
                    title="Clear chat history from your device"
                  >
                    <Trash2 className="w-3 h-3 text-amber-400" />
                    <span>Clear Chat</span>
                  </button>
                </div>

                {/* WhatsApp-Style Exit Group Button */}
                {isUserGroupMember && (
                  <button
                    type="button"
                    onClick={() => setShowExitGroupConfirm(true)}
                    className="w-full py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit Group</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* WhatsApp-Style Exit Group Confirmation Modal */}
      {showExitGroupConfirm && activeGroup && (
        <div 
          className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowExitGroupConfirm(false)}
        >
          <div 
            className="bg-[#00172e] border border-red-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-white">Exit "{activeGroup.name}"?</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                You will no longer be a participant in this fellowship group and will stop receiving group messages. You can always rejoin later.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitGroupConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExitActiveGroup}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors shadow-lg cursor-pointer"
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
          className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setDeleteConfirmModal({ isOpen: false, isMultiple: false, canDeleteForEveryone: false, isGroup: false })}
        >
          <div 
            className="bg-[#00172e] border border-red-500/40 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-white text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-white">
                {deleteConfirmModal.isMultiple ? `Delete ${selectedMessageIds.length} Messages?` : 'Delete Message?'}
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Choose how you want to delete this message.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              {deleteConfirmModal.canDeleteForEveryone && (
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(true)}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors shadow-lg cursor-pointer"
                >
                  Delete for Everyone
                </button>
              )}
              <button
                type="button"
                onClick={() => handleConfirmDelete(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Delete for Me
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false, isMultiple: false, canDeleteForEveryone: false, isGroup: false })}
                className="w-full py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
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
          className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setClearChatConfirmModal({ isOpen: false, isGroup: false, title: '' })}
        >
          <div 
            className="bg-[#00172e] border border-amber-500/40 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-white text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-white">
                Clear chats from your end?
              </h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Messages in <span className="font-semibold text-amber-300">{clearChatConfirmModal.title}</span> will be cleared from your view on this device.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClearChatConfirmModal({ isOpen: false, isGroup: false, title: '' })}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteClearChat}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-[#001F3F] transition-colors shadow-lg cursor-pointer"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp-Style Fullscreen Media Preview Lightbox Modal */}
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

    </div>
  );
};
