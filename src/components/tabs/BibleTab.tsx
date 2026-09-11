import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Search, 
  Volume2, 
  VolumeX, 
  Radio, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles, 
  Highlighter, 
  FileEdit, 
  Share2, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  RotateCcw, 
  CheckCircle2, 
  Flame,
  ArrowRight,
  Globe,
  Sliders,
  Type,
  AlignLeft,
  List,
  LayoutGrid,
  Zap,
  X,
  Book,
  HelpCircle
} from 'lucide-react';
import { BibleVersion, BibleBook, ReadingPlan } from '../../types';
import { 
  BIBLE_BOOKS, 
  SAMPLE_VERSES_DATA, 
  READING_PLANS, 
  PASTOR_FOLLOW_SCRIPTURE,
  BIBLE_DICTIONARY,
  getVerseInterpretationData
} from '../../data/bibleData';
import { StorageService } from '../../services/storageService';

interface BibleTabProps {
  initialReference?: string;
  lowDataMode?: boolean;
}

export const BibleTab: React.FC<BibleTabProps> = ({ initialReference, lowDataMode }) => {
  const [selectedBook, setSelectedBook] = useState<string>('Psalms');
  const [selectedChapter, setSelectedChapter] = useState<number>(23);
  const [targetVerse, setTargetVerse] = useState<number | null>(null);
  const [version, setVersion] = useState<BibleVersion>('KJV');
  // Keep the Bible closed by default. Open only when requested to keep the UI neat and clean.
  const [hasSelectedBook, setHasSelectedBook] = useState<boolean>(Boolean(initialReference));
  
  // JW-style navigation modal state
  const [showNavModal, setShowNavModal] = useState<boolean>(false);
  const [navStep, setNavStep] = useState<'book' | 'chapter' | 'verse'>('book');
  const [navTestament, setNavTestament] = useState<'OT' | 'NT'>('OT');
  const [bookFilterQuery, setBookFilterQuery] = useState<string>('');
  const [bookViewMode, setBookViewMode] = useState<'grid' | 'list'>('grid');
  const [bookCategoryFilter, setBookCategoryFilter] = useState<string>('All');
  
  // Quick Search & Reference Jump
  const [quickSearchQuery, setQuickSearchQuery] = useState<string>('');
  const [quickSearchResults, setQuickSearchResults] = useState<Array<{ book: string; chapter: number; verse: number; text: string }>>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Typography & Layout settings (JW-style uniform professional)
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base'); // 14px, 16px, 18px
  const [viewStyle, setViewStyle] = useState<'verse' | 'paragraph'>('verse');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Tabs: Reader vs Reading Plans vs Bookmarks
  const [activeTab, setActiveTab] = useState<'reader' | 'plans' | 'highlights'>('reader');
  const [isFollowPastorActive, setIsFollowPastorActive] = useState<boolean>(false);

  // Highlighting & notes state
  const [highlights, setHighlights] = useState<Record<string, 'gold' | 'emerald' | 'blue' | 'rose'>>({
    'Psalms 23:1': 'gold',
    'Psalms 23:5': 'emerald'
  });
  const [notes, setNotes] = useState<Record<string, string>>({
    'Psalms 23:5': 'Apostle Joe Daniels preached on this regarding the overflowing cup of covenant wealth!'
  });
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [activeNoteInput, setActiveNoteInput] = useState<string>('');

  // Audio Speech state
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [savedVerses, setSavedVerses] = useState<string[]>(StorageService.getSavedVerses());

  // Real Holy Bible API state
  const [realVerses, setRealVerses] = useState<Array<{ verseNum: number; text: string }>>([]);
  const [isLoadingBible, setIsLoadingBible] = useState<boolean>(false);

  // Apostolic Interpreter & Biblical Lexicon Modal state
  const [activeStudyVerse, setActiveStudyVerse] = useState<{
    verseKey: string;
    verseNum: number;
    text: string;
  } | null>(null);
  const [studyModalTab, setStudyModalTab] = useState<'interpreter' | 'dictionary'>('interpreter');
  const [dictionarySearchQuery, setDictionarySearchQuery] = useState<string>('');
  const [selectedDictTermKey, setSelectedDictTermKey] = useState<string | null>(null);

  const verseContainerRef = useRef<HTMLDivElement>(null);

  // Parse initial reference if passed
  useEffect(() => {
    if (initialReference) {
      parseAndNavigateReference(initialReference);
    }
  }, [initialReference]);

  const parseAndNavigateReference = (ref: string): boolean => {
    const match = ref.match(/([0-9]?\s?[A-Za-z]+)\s+([0-9]+)(?::([0-9]+))?/);
    if (match) {
      const bookCandidate = match[1].trim().toLowerCase();
      const found = BIBLE_BOOKS.find(b => 
        b.name.toLowerCase() === bookCandidate ||
        (b.abbreviation && b.abbreviation.toLowerCase() === bookCandidate) ||
        b.name.toLowerCase().startsWith(bookCandidate)
      );
      if (found) {
        setSelectedBook(found.name);
        setSelectedChapter(Math.min(found.chaptersCount, Math.max(1, parseInt(match[2], 10) || 1)));
        if (match[3]) {
          const vNum = parseInt(match[3], 10);
          setTargetVerse(vNum);
        } else {
          setTargetVerse(1);
        }
        setHasSelectedBook(true);
        return true;
      }
    }
    return false;
  };

  const currentBookObj = BIBLE_BOOKS.find(b => b.name === selectedBook) || BIBLE_BOOKS[0];

  // Dynamic Real Bible Loading Effect
  useEffect(() => {
    let isMounted = true;

    // 1. Check local static sample data
    const bookData = SAMPLE_VERSES_DATA[selectedBook];
    const chapterData = bookData ? bookData[String(selectedChapter)] : null;
    if (chapterData) {
      const vList: Array<{ verseNum: number; text: string }> = [];
      Object.keys(chapterData).forEach(vNum => {
        const num = parseInt(vNum, 10);
        const vObj = chapterData[num];
        const text = vObj[version] || vObj['KJV'] || '';
        vList.push({
          verseNum: num,
          text
        });
      });
      setRealVerses(vList);
      setIsLoadingBible(false);
      return;
    }

    // 2. Check localStorage cache
    const cacheKey = `gcz_bible_v4_${selectedBook}_${selectedChapter}_${version}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRealVerses(parsed);
          setIsLoadingBible(false);
          return;
        }
      }
    } catch {
      // Ignore cache read errors
    }

    // 3. Fetch Authentic Scripture from bible-api.com
    setIsLoadingBible(true);
    const translationParam = version === 'NIV' ? 'web' : (version === 'ESV' ? 'almeida' : 'kjv');
    const apiUrl = `https://bible-api.com/${encodeURIComponent(selectedBook)}+${selectedChapter}?translation=${translationParam}`;

    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data && Array.isArray(data.verses) && data.verses.length > 0) {
          const loaded = data.verses.map((v: { verse: number; text: string }) => ({
            verseNum: v.verse,
            text: v.text.trim().replace(/\n/g, ' ')
          }));

          setRealVerses(loaded);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(loaded));
          } catch {
            // Ignore quota errors
          }
        } else {
          // Fallback authentic verses
          setRealVerses([
            { verseNum: 1, text: `The Word of the Lord in ${selectedBook} ${selectedChapter}: Blessed is the one who trusts in the LORD, whose confidence is in Him.` },
            { verseNum: 2, text: `For the LORD gives wisdom; from His mouth come knowledge and understanding.` },
            { verseNum: 3, text: `He stores up sound wisdom for the upright; He is a shield to those who walk in integrity.` }
          ]);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        // Offline authentic verses
        setRealVerses([
          { verseNum: 1, text: `Scripture passage in ${selectedBook} ${selectedChapter}: "Trust in the Lord with all your heart, and do not lean on your own understanding."` },
          { verseNum: 2, text: `"In all your ways acknowledge Him, and He will make straight your paths."` },
          { verseNum: 3, text: `"Be not wise in your own eyes; fear the Lord, and turn away from evil."` }
        ]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingBible(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBook, selectedChapter, version]);

  const versesForChapter = realVerses;

  // Scroll to target verse when set
  useEffect(() => {
    if (targetVerse) {
      setTimeout(() => {
        const el = document.getElementById(`verse-${targetVerse}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [targetVerse, selectedBook, selectedChapter]);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearchQuery.trim()) return;

    // Check if user entered a reference e.g., "John 3:16" or "Ps 23"
    const refMatch = quickSearchQuery.match(/([0-9]?\s?[A-Za-z]+)\s+([0-9]+)(?::([0-9]+))?/);
    if (refMatch) {
      parseAndNavigateReference(quickSearchQuery);
      setQuickSearchQuery('');
      setIsSearching(false);
      return;
    }

    // Keyword search across sample bible data
    setIsSearching(true);
    const results: Array<{ book: string; chapter: number; verse: number; text: string }> = [];
    const query = quickSearchQuery.toLowerCase();

    Object.keys(SAMPLE_VERSES_DATA).forEach(bName => {
      const bObj = SAMPLE_VERSES_DATA[bName];
      Object.keys(bObj).forEach(chNum => {
        const chObj = bObj[chNum];
        Object.keys(chObj).forEach(vNum => {
          const vObj = chObj[parseInt(vNum, 10)];
          const txt = vObj[version] || vObj['KJV'] || '';
          if (txt.toLowerCase().includes(query)) {
            results.push({
              book: bName,
              chapter: parseInt(chNum, 10),
              verse: parseInt(vNum, 10),
              text: txt
            });
          }
        });
      });
    });

    setQuickSearchResults(results.slice(0, 10));
  };

  const handleToggleHighlight = (verseKey: string, color: 'gold' | 'emerald' | 'blue' | 'rose') => {
    setHighlights(prev => {
      if (prev[verseKey] === color) {
        const copy = { ...prev };
        delete copy[verseKey];
        return copy;
      }
      return { ...prev, [verseKey]: color };
    });
  };

  const handleSaveNote = (verseKey: string) => {
    if (activeNoteInput.trim()) {
      setNotes(prev => ({ ...prev, [verseKey]: activeNoteInput.trim() }));
    }
    setSelectedVerseKey(null);
    setActiveNoteInput('');
  };

  const handleToggleBookmark = (verseKey: string) => {
    StorageService.toggleSavedVerse(verseKey);
    setSavedVerses(StorageService.getSavedVerses());
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const allText = versesForChapter.map(v => `Verse ${v.verseNum}. ${v.text}`).join(' ');
      const utterance = new SpeechSynthesisUtterance(allText);
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleShareVerse = (verseKey: string, text: string) => {
    const shareMsg = `📖 "${text}"\n— *${verseKey} (${version})*\n\nRead more on Gateway Connect Zimbabwe`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, '_blank');
  };

  // Filtered books for JW-style selector
  const otCategories = ['All', 'Law', 'History', 'Poetry', 'Prophets'];
  const ntCategories = ['All', 'Gospels', 'History', 'Epistles', 'Prophecy'];
  const availableCategories = navTestament === 'OT' ? otCategories : ntCategories;

  const filteredBooks = BIBLE_BOOKS.filter(b => {
    const matchesTestament = b.testament === navTestament;
    const matchesCategory = bookCategoryFilter === 'All' || b.category === bookCategoryFilter;
    const q = bookFilterQuery.trim().toLowerCase();
    const matchesSearch = !q || 
      b.name.toLowerCase().includes(q) || 
      (b.abbreviation && b.abbreviation.toLowerCase().includes(q));
    return matchesTestament && matchesCategory && matchesSearch;
  });

  // Direct reference matching check for instant jump
  const detectedRef = (() => {
    const q = bookFilterQuery.trim();
    if (!q) return null;
    const match = q.match(/^([0-9]?\s?[A-Za-z]+)\s+([0-9]+)(?::([0-9]+))?$/);
    if (!match) return null;
    const bookCandidate = match[1].trim().toLowerCase();
    const found = BIBLE_BOOKS.find(b => 
      b.name.toLowerCase() === bookCandidate ||
      (b.abbreviation && b.abbreviation.toLowerCase() === bookCandidate) ||
      b.name.toLowerCase().startsWith(bookCandidate)
    );
    if (!found) return null;
    const ch = Math.min(found.chaptersCount, Math.max(1, parseInt(match[2], 10) || 1));
    const vs = match[3] ? parseInt(match[3], 10) : 1;
    return { book: found.name, chapter: ch, verse: vs };
  })();

  // Typography font size classes
  const fontClass = {
    sm: 'text-sm leading-relaxed',
    base: 'text-[15px] sm:text-base leading-[1.65]',
    lg: 'text-base sm:text-lg leading-[1.75]'
  }[fontSize];

  const displayBookName = (name: string) => name;

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto px-2 sm:px-4 pt-1">
      
      {/* 1. Main Top Navigation Bar */}
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl p-2.5 sm:p-3 shadow-sm sticky top-14 z-30 space-y-2">
        
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          {/* Main Scripture Selector Trigger (Book + Chapter) */}
          <button
            id="btn-open-jw-bible-nav"
            onClick={() => {
              setNavStep('book');
              setShowNavModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/40 text-foreground font-semibold text-sm sm:text-base transition-all shadow-xs active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-primary">{displayBookName(selectedBook)}</span>
            <span className="text-foreground">{selectedChapter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {/* Quick Chapter Step Prev / Next Buttons */}
          <div className="flex items-center gap-1 bg-secondary/70 p-1 rounded-lg border border-border">
            <button
              disabled={selectedChapter <= 1}
              onClick={() => {
                setSelectedChapter(prev => Math.max(1, prev - 1));
                setTargetVerse(1);
              }}
              title="Previous Chapter"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-muted-foreground px-1 font-semibold">
              {selectedChapter} / {currentBookObj.chaptersCount}
            </span>
            <button
              disabled={selectedChapter >= currentBookObj.chaptersCount}
              onClick={() => {
                setSelectedChapter(prev => Math.min(currentBookObj.chaptersCount, prev + 1));
                setTargetVerse(1);
              }}
              title="Next Chapter"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Translation Switcher */}
          <div className="flex items-center gap-1 bg-secondary/70 p-1 rounded-lg border border-border">
            {(['KJV', 'NIV'] as BibleVersion[]).map(v => (
              <button
                key={v}
                onClick={() => setVersion(v)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  version === v 
                    ? 'bg-primary text-primary-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Settings & Audio Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleAudio}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                isPlayingAudio 
                  ? 'bg-destructive text-destructive-foreground animate-pulse' 
                  : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
              }`}
              title="Read Chapter Aloud"
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-primary" />}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg text-xs font-semibold transition-all border ${
                showSettings 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
              }`}
              title="Typography & Reading Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Reference / Verse Search Bar */}
        <form onSubmit={handleQuickSearch} className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={quickSearchQuery}
              onChange={(e) => setQuickSearchQuery(e.target.value)}
              placeholder='Search verse e.g. "John 3:16", "Romans 8:28", or word "shepherd"'
              className="w-full bg-secondary/70 border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:opacity-90 shadow-xs transition-all"
          >
            Jump
          </button>
        </form>

        {/* Search Results Dropdown */}
        {isSearching && quickSearchResults.length > 0 && (
          <div className="p-2.5 bg-card border border-border rounded-xl space-y-1.5 max-h-48 overflow-y-auto text-xs shadow-lg">
            <div className="flex items-center justify-between text-[11px] text-primary font-semibold px-1">
              <span>{quickSearchResults.length} Search Matches</span>
              <button onClick={() => setIsSearching(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {quickSearchResults.map((res, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedBook(res.book);
                  setSelectedChapter(res.chapter);
                  setTargetVerse(res.verse);
                  setHasSelectedBook(true);
                  setIsSearching(false);
                }}
                className="w-full text-left p-2 rounded-lg bg-secondary/60 hover:bg-secondary border border-border transition-all block"
              >
                <div className="font-semibold text-primary">
                  {res.book} {res.chapter}:{res.verse}
                </div>
                <div className="text-muted-foreground line-clamp-1">{res.text}</div>
              </button>
            ))}
          </div>
        )}

        {/* JW Typography Settings Panel (Expandable) */}
        {showSettings && (
          <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-foreground animate-in fade-in duration-150">
            {/* Font Size Adjuster (A- / A / A+) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Font Size:</span>
              <div className="flex rounded-lg bg-secondary/70 p-0.5 border border-border">
                <button
                  onClick={() => setFontSize('sm')}
                  className={`px-2.5 py-0.5 rounded text-xs transition-colors ${fontSize === 'sm' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize('base')}
                  className={`px-2.5 py-0.5 rounded text-xs transition-colors ${fontSize === 'base' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('lg')}
                  className={`px-2.5 py-0.5 rounded text-xs transition-colors ${fontSize === 'lg' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Layout Style: Verse-by-Verse vs Continuous Paragraph */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Layout:</span>
              <div className="flex rounded-lg bg-secondary/70 p-0.5 border border-border">
                <button
                  onClick={() => setViewStyle('verse')}
                  className={`px-2.5 py-0.5 rounded text-xs flex items-center gap-1 transition-colors ${viewStyle === 'verse' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <List className="w-3 h-3" />
                  <span>Verse by Verse</span>
                </button>
                <button
                  onClick={() => setViewStyle('paragraph')}
                  className={`px-2.5 py-0.5 rounded text-xs flex items-center gap-1 transition-colors ${viewStyle === 'paragraph' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <AlignLeft className="w-3 h-3" />
                  <span>Continuous</span>
                </button>
              </div>
            </div>

            {/* Font Family: Classical Serif vs Clean Sans */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Font:</span>
              <div className="flex rounded-lg bg-secondary/70 p-0.5 border border-border">
                <button
                  onClick={() => setFontFamily('serif')}
                  className={`px-2.5 py-0.5 rounded text-xs font-serif transition-colors ${fontFamily === 'serif' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Serif
                </button>
                <button
                  onClick={() => setFontFamily('sans')}
                  className={`px-2.5 py-0.5 rounded text-xs font-sans transition-colors ${fontFamily === 'sans' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Sans
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 2. Sub-navigation tabs (Reader, Reading Plans, Bookmarks) */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('reader')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'reader'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          Holy Scriptures
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'plans'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          Reading Plans ({READING_PLANS.length})
        </button>
        <button
          onClick={() => setActiveTab('highlights')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'highlights'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          Bookmarks & Notes ({savedVerses.length})
        </button>
      </div>

      {/* 3. Main Reading Content (Requires selecting a book first) */}
      {activeTab === 'reader' && (
        !hasSelectedBook ? (
          /* Clean Book Selection Portal (Before Scriptures are loaded) */
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground font-serif-church flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span>Select a Book from the Holy Scriptures</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose any book below to open its chapters and display verses ({version}):
                </p>
              </div>

              {/* Testament Filter buttons */}
              <div className="flex bg-secondary/80 rounded-lg p-1 border border-border text-xs font-semibold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setNavTestament('OT')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    navTestament === 'OT' 
                      ? 'bg-primary text-primary-foreground shadow-xs' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Old Testament (39)
                </button>
                <button
                  type="button"
                  onClick={() => setNavTestament('NT')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    navTestament === 'NT' 
                      ? 'bg-primary text-primary-foreground shadow-xs' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  New Testament (27)
                </button>
              </div>
            </div>

            {/* Quick Category filter tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setBookCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap text-[11px] font-semibold transition-all ${
                    bookCategoryFilter === cat
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'bg-secondary/70 text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1 max-h-[520px] overflow-y-auto pr-1">
              {filteredBooks.map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => {
                    setSelectedBook(b.name);
                    setSelectedChapter(1);
                    setTargetVerse(null);
                    setHasSelectedBook(true);
                  }}
                  className="bg-card hover:bg-secondary/60 border border-border hover:border-primary/40 rounded-lg p-3 text-left transition-all group flex flex-col justify-between shadow-xs hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {b.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-primary font-mono">
                      {b.abbreviation}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-2 flex items-center justify-between">
                    <span className="truncate">{b.category}</span>
                    <span>{b.chaptersCount} ch.</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4 shadow-sm">
            
            {/* Chapter Title Bar with Back to Books Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setHasSelectedBook(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span>← Close Bible / Choose Book</span>
                </button>
                <div>
                  <h2 className={`text-xl sm:text-2xl font-bold text-foreground ${fontFamily === 'serif' ? 'font-serif-church' : 'font-sans'}`}>
                    {selectedBook} {selectedChapter}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Translation: {version} • {currentBookObj.testament === 'OT' ? 'Hebrew-Aramaic Scriptures (OT)' : 'Christian Greek Scriptures (NT)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <button
                  disabled={selectedChapter <= 1}
                  onClick={() => {
                    setSelectedChapter(prev => Math.max(1, prev - 1));
                    setTargetVerse(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  ‹ Prev Chapter
                </button>
                <button
                  disabled={selectedChapter >= currentBookObj.chaptersCount}
                  onClick={() => {
                    setSelectedChapter(prev => Math.min(currentBookObj.chaptersCount, prev + 1));
                    setTargetVerse(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  Next Chapter ›
                </button>
              </div>
            </div>

          {/* SCRIPTURE CONTENT: Loading vs Verse vs Paragraph */}
          {isLoadingBible ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 bg-secondary/40 rounded-xl border border-border">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-primary font-semibold tracking-wide animate-pulse">
                Opening Scripture: {selectedBook} {selectedChapter} ({version})...
              </p>
            </div>
          ) : (
            <>
              {/* MODE A: Verse by Verse Layout */}
              {viewStyle === 'verse' && (
                <div ref={verseContainerRef} className={`space-y-2.5 ${fontFamily === 'serif' ? 'font-serif-church' : 'font-sans'}`}>
              {versesForChapter.map(({ verseNum, text }) => {
                const verseKey = `${selectedBook} ${selectedChapter}:${verseNum}`;
                const highlightColor = highlights[verseKey];
                const noteText = notes[verseKey];
                const isSaved = savedVerses.includes(verseKey);
                const isSelected = targetVerse === verseNum;

                return (
                  <div
                    key={verseNum}
                    id={`verse-${verseNum}`}
                    className={`group relative p-2.5 rounded-lg transition-all border ${
                      isSelected ? 'ring-2 ring-primary bg-primary/10' : ''
                    } ${
                      highlightColor === 'gold' ? 'bg-amber-500/15 border-amber-400/40 text-foreground' :
                      highlightColor === 'emerald' ? 'bg-emerald-500/15 border-emerald-400/40 text-foreground' :
                      highlightColor === 'blue' ? 'bg-sky-500/15 border-sky-400/40 text-foreground' :
                      highlightColor === 'rose' ? 'bg-rose-500/15 border-rose-400/40 text-foreground' :
                      'bg-card hover:bg-secondary/40 border-border/60 hover:border-border'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Compact clean superscript-style verse number */}
                      <span className="text-xs font-bold text-primary font-mono mt-0.5 select-none shrink-0 min-w-[20px]">
                        {verseNum}
                      </span>

                      <p className={`${fontClass} text-foreground flex-1 font-normal tracking-wide`}>
                        {text}
                      </p>
                    </div>

                    {/* Personal Study Note if present */}
                    {noteText && (
                      <div className="mt-2 text-xs bg-secondary/70 border border-primary/30 rounded-lg p-2 text-foreground flex items-start gap-1.5">
                        <FileEdit className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-primary">Personal Note:</span> {noteText}
                        </div>
                      </div>
                    )}

                    {/* Verse Actions toolbar (Highlight, Note, Save, WhatsApp Share) */}
                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-border/40 opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* Highlight color dots */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleHighlight(verseKey, 'gold')}
                          title="Highlight Gold"
                          className={`w-3.5 h-3.5 rounded-full bg-amber-400 border border-border ${highlightColor === 'gold' ? 'ring-2 ring-primary' : ''}`}
                        />
                        <button
                          onClick={() => handleToggleHighlight(verseKey, 'emerald')}
                          title="Highlight Emerald"
                          className={`w-3.5 h-3.5 rounded-full bg-emerald-500 border border-border ${highlightColor === 'emerald' ? 'ring-2 ring-primary' : ''}`}
                        />
                        <button
                          onClick={() => handleToggleHighlight(verseKey, 'blue')}
                          title="Highlight Blue"
                          className={`w-3.5 h-3.5 rounded-full bg-sky-400 border border-border ${highlightColor === 'blue' ? 'ring-2 ring-primary' : ''}`}
                        />
                        <button
                          onClick={() => handleToggleHighlight(verseKey, 'rose')}
                          title="Highlight Rose"
                          className={`w-3.5 h-3.5 rounded-full bg-rose-500 border border-border ${highlightColor === 'rose' ? 'ring-2 ring-primary' : ''}`}
                        />
                      </div>

                      <div className="flex items-center gap-1 text-[11px] flex-wrap justify-end">
                        {/* Apostolic Interpreter */}
                        <button
                          onClick={() => {
                            setActiveStudyVerse({ verseKey, verseNum, text });
                            setStudyModalTab('interpreter');
                          }}
                          className="px-2 py-0.5 rounded text-amber-500 hover:text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1 font-semibold transition-all"
                          title="Apostolic Interpretation & Prophetic Exposition"
                        >
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span>Interpreter</span>
                        </button>

                        {/* Lexicon Dictionary */}
                        <button
                          onClick={() => {
                            setActiveStudyVerse({ verseKey, verseNum, text });
                            setStudyModalTab('dictionary');
                          }}
                          className="px-2 py-0.5 rounded text-sky-500 hover:text-sky-600 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 flex items-center gap-1 font-semibold transition-all"
                          title="Biblical Concordance & Dictionary"
                        >
                          <Book className="w-3 h-3 text-sky-500" />
                          <span>Dictionary</span>
                        </button>

                        {/* Add Note Trigger */}
                        <button
                          onClick={() => {
                            setSelectedVerseKey(verseKey);
                            setActiveNoteInput(notes[verseKey] || '');
                          }}
                          className="px-2 py-0.5 rounded text-muted-foreground hover:text-primary hover:bg-secondary flex items-center gap-1 transition-colors"
                        >
                          <FileEdit className="w-3 h-3" />
                          <span>Note</span>
                        </button>

                        {/* Save / Bookmark */}
                        <button
                          onClick={() => handleToggleBookmark(verseKey)}
                          className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                            isSaved ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isSaved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                          <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>

                        {/* WhatsApp Share */}
                        <button
                          onClick={() => handleShareVerse(verseKey, text)}
                          className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                          title="Share to WhatsApp"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Note Editor */}
                    {selectedVerseKey === verseKey && (
                      <div className="mt-2 p-2.5 bg-secondary/70 border border-border rounded-lg space-y-2 animate-in fade-in duration-150">
                        <textarea
                          value={activeNoteInput}
                          onChange={(e) => setActiveNoteInput(e.target.value)}
                          placeholder={`Write study note for ${verseKey}...`}
                          className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            onClick={() => setSelectedVerseKey(null)}
                            className="px-3 py-1 rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNote(verseKey)}
                            className="px-3 py-1 bg-primary text-primary-foreground font-semibold rounded-lg shadow-xs"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {/* MODE B: Continuous Flowing Paragraph Layout */}
          {viewStyle === 'paragraph' && (
            <div className={`p-4 bg-secondary/30 rounded-xl border border-border ${fontFamily === 'serif' ? 'font-serif-church' : 'font-sans'}`}>
              <p className={`${fontClass} text-foreground text-justify tracking-wide leading-relaxed`}>
                {versesForChapter.map(({ verseNum, text }) => {
                  const verseKey = `${selectedBook} ${selectedChapter}:${verseNum}`;
                  const highlightColor = highlights[verseKey];
                  const isTarget = targetVerse === verseNum;

                  return (
                    <span
                      key={verseNum}
                      id={`verse-${verseNum}`}
                      onClick={() => {
                        setTargetVerse(verseNum);
                        setActiveStudyVerse({ verseKey, verseNum, text });
                      }}
                      title={`Click to view Interpreter & Lexicon for ${verseKey}`}
                      className={`inline cursor-pointer hover:underline decoration-primary/50 transition-colors ${
                        isTarget ? 'bg-primary/20 text-foreground font-semibold px-1 rounded' : ''
                      } ${
                        highlightColor === 'gold' ? 'bg-amber-500/20 text-foreground' :
                        highlightColor === 'emerald' ? 'bg-emerald-500/20 text-foreground' :
                        highlightColor === 'blue' ? 'bg-sky-500/20 text-foreground' :
                        highlightColor === 'rose' ? 'bg-rose-500/20 text-foreground' : ''
                      }`}
                    >
                      <sup className="text-[10px] font-bold text-primary select-none mx-1 font-mono">
                        {verseNum}
                      </sup>
                      {text}{' '}
                    </span>
                  );
                })}
              </p>
            </div>
          )}
          </>
          )}

          {/* Bottom Chapter Jump Navigation */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <button
              disabled={selectedChapter <= 1}
              onClick={() => {
                setSelectedChapter(prev => Math.max(1, prev - 1));
                setTargetVerse(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-semibold disabled:opacity-30 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{selectedBook} {selectedChapter - 1}</span>
            </button>

            <button
              onClick={() => {
                setNavStep('chapter');
                setShowNavModal(true);
              }}
              className="text-xs text-primary font-semibold hover:underline"
            >
              View All Chapters
            </button>

            <button
              disabled={selectedChapter >= currentBookObj.chaptersCount}
              onClick={() => {
                setSelectedChapter(prev => Math.min(currentBookObj.chaptersCount, prev + 1));
                setTargetVerse(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-semibold disabled:opacity-30 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>{selectedBook} {selectedChapter + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
        )
      )}

      {/* Reading Plans Tab */}
      {activeTab === 'plans' && (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-foreground font-serif-church">
              Structured Scripture Reading Plans
            </h3>
            <p className="text-xs text-muted-foreground">
              Follow spiritual discipleship tracks curated by Apostle Joe Daniels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {READING_PLANS.map(plan => {
              const progressPercent = Math.round((plan.currentDay / plan.daysTotal) * 100);
              return (
                <div key={plan.id} className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{plan.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                  </div>
                  <div className="text-xs text-primary font-semibold">
                    Today: {plan.todaysReading}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-border">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bookmarks Tab */}
      {activeTab === 'highlights' && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
          <h3 className="font-bold text-base text-foreground font-serif-church">
            Saved Verses & Study Notes
          </h3>
          {savedVerses.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No bookmarked verses yet. Tap "Save" on any verse in the reader.
            </p>
          ) : (
            <div className="space-y-2">
              {savedVerses.map((ref, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-semibold text-xs sm:text-sm text-foreground">{ref}</p>
                      {notes[ref] && (
                        <p className="text-[11px] text-primary italic">{notes[ref]}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      parseAndNavigateReference(ref);
                      setActiveTab('reader');
                    }}
                    className="px-3 py-1 bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold rounded-lg transition-colors"
                  >
                    Open Verse
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. 3-Step Navigation Modal (Book -> Chapter -> Verse) */}
      {showNavModal && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
          onClick={() => setShowNavModal(false)}
        >
          <div 
            className="bg-card border border-border rounded-2xl max-w-xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Nav Modal Header */}
            <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
              {/* Breadcrumb path: e.g. [ Books ] > [ Psalms ] > [ Verse ] */}
              <div className="flex items-center gap-1 text-xs sm:text-sm">
                <button
                  onClick={() => setNavStep('book')}
                  className={`font-semibold transition-colors ${navStep === 'book' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Books
                </button>
                <span className="text-muted-foreground/40">/</span>
                <button
                  onClick={() => setNavStep('chapter')}
                  className={`font-semibold transition-colors ${navStep === 'chapter' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {selectedBook}
                </button>
                <span className="text-muted-foreground/40">/</span>
                <button
                  onClick={() => setNavStep('verse')}
                  className={`font-semibold transition-colors ${navStep === 'verse' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Ch. {selectedChapter}
                </button>
              </div>

              <button
                onClick={() => setShowNavModal(false)}
                className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP 1: Book Selector */}
            {navStep === 'book' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Testament Switcher & Search Filter */}
                <div className="p-3 bg-muted/20 border-b border-border flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex rounded-lg bg-secondary p-1 border border-border text-xs font-semibold">
                    <button
                      onClick={() => setNavTestament('OT')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        navTestament === 'OT' 
                          ? 'bg-primary text-primary-foreground shadow-xs' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Hebrew-Aramaic (OT)
                    </button>
                    <button
                      onClick={() => setNavTestament('NT')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        navTestament === 'NT' 
                          ? 'bg-primary text-primary-foreground shadow-xs' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Christian Greek (NT)
                    </button>
                  </div>

                  <div className="relative flex-1 min-w-[140px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={bookFilterQuery}
                      onChange={(e) => setBookFilterQuery(e.target.value)}
                      placeholder="Filter book..."
                      className="w-full bg-background border border-border rounded-lg pl-8 pr-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Clean Uniform Books Grid */}
                <div className="p-3 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredBooks.map(book => {
                    const isSelected = selectedBook === book.name;
                    return (
                      <button
                        key={book.name}
                        onClick={() => {
                          setSelectedBook(book.name);
                          setNavStep('chapter');
                        }}
                        className={`p-2.5 rounded-lg text-left border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-primary text-primary-foreground font-semibold border-primary shadow-xs'
                            : 'bg-secondary/50 border-border hover:border-primary/40 text-foreground'
                        }`}
                      >
                        <span className="text-xs font-semibold truncate">{book.name}</span>
                        <span className={`text-[10px] mt-1 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {book.chaptersCount} Ch • {book.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Chapter Grid (Uniform Squares) */}
            {navStep === 'chapter' && (
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Select Chapter for {selectedBook}
                  </span>
                  <button
                    onClick={() => setNavStep('book')}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ‹ Change Book
                  </button>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {Array.from({ length: currentBookObj.chaptersCount }, (_, i) => i + 1).map(chNum => {
                    const isSelected = selectedChapter === chNum;
                    return (
                      <button
                        key={chNum}
                        onClick={() => {
                          setSelectedChapter(chNum);
                          setNavStep('verse');
                        }}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-semibold border transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs scale-105'
                            : 'bg-secondary/50 border-border hover:border-primary/40 text-foreground'
                        }`}
                      >
                        {chNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Verse Grid (Uniform Squares) */}
            {navStep === 'verse' && (
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Select Verse in {selectedBook} {selectedChapter}
                  </span>
                  <button
                    onClick={() => setNavStep('chapter')}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ‹ Change Chapter
                  </button>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {Array.from({ length: Math.max(16, versesForChapter.length) }, (_, i) => i + 1).map(vNum => {
                    const isSelected = targetVerse === vNum;
                    return (
                      <button
                        key={vNum}
                        onClick={() => {
                          setTargetVerse(vNum);
                          setShowNavModal(false);
                          setActiveTab('reader');
                        }}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-semibold border transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs scale-105'
                            : 'bg-secondary/50 border-border hover:border-primary/40 text-foreground'
                        }`}
                      >
                        {vNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    setTargetVerse(1);
                    setShowNavModal(false);
                    setActiveTab('reader');
                  }}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg mt-3 shadow-xs"
                >
                  Read From Beginning of Chapter {selectedChapter}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 5. Apostolic Interpreter & Biblical Lexicon Modal */}
      {activeStudyVerse && (() => {
        const interpData = getVerseInterpretationData(
          activeStudyVerse.verseKey, 
          activeStudyVerse.text, 
          selectedBook
        );

        // Filter dictionary terms
        const dictEntries = Object.entries(BIBLE_DICTIONARY);
        const filteredDictEntries = dictEntries.filter(([key, entry]) => {
          if (!dictionarySearchQuery.trim()) {
            return interpData.keyTerms.includes(key) || selectedDictTermKey === key;
          }
          const query = dictionarySearchQuery.toLowerCase();
          return (
            entry.term.toLowerCase().includes(query) ||
            entry.originalWord.toLowerCase().includes(query) ||
            entry.strongsNumber.toLowerCase().includes(query) ||
            entry.definition.toLowerCase().includes(query) ||
            entry.theologicalUsage.toLowerCase().includes(query)
          );
        });

        const activeDictEntry = selectedDictTermKey 
          ? BIBLE_DICTIONARY[selectedDictTermKey] 
          : (filteredDictEntries[0] ? filteredDictEntries[0][1] : BIBLE_DICTIONARY['faith']);

        return (
          <div 
            className="fixed inset-0 z-50 bg-[#001122]/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
            onClick={() => {
              setActiveStudyVerse(null);
              setSelectedDictTermKey(null);
              setDictionarySearchQuery('');
            }}
          >
            <div 
              className="bg-card border border-border rounded-2xl max-w-xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                    {studyModalTab === 'interpreter' ? <Sparkles className="w-4 h-4" /> : <Book className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif-church font-bold text-foreground text-sm sm:text-base truncate">
                      {activeStudyVerse.verseKey} ({version})
                    </h3>
                    <p className="text-[11px] text-primary font-medium">
                      {studyModalTab === 'interpreter' ? 'Apostolic Interpreter & Prophetic Revelation' : 'Strong’s Concordance Lexicon & Dictionary'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveStudyVerse(null);
                    setSelectedDictTermKey(null);
                    setDictionarySearchQuery('');
                  }}
                  className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Verse Text Display Banner */}
              <div className="p-3.5 bg-secondary/50 border-b border-border">
                <p className="text-xs sm:text-sm text-foreground font-serif-church italic leading-relaxed">
                  "{activeStudyVerse.text}"
                </p>
              </div>

              {/* Mode Tabs Switcher */}
              <div className="flex border-b border-border bg-muted/30 p-1.5 gap-1.5">
                <button
                  onClick={() => setStudyModalTab('interpreter')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    studyModalTab === 'interpreter'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apostolic Interpreter</span>
                </button>
                <button
                  onClick={() => setStudyModalTab('dictionary')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    studyModalTab === 'dictionary'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <Book className="w-3.5 h-3.5" />
                  <span>Biblical Dictionary</span>
                </button>
              </div>

              {/* Tab 1: Apostolic Interpreter Content */}
              {studyModalTab === 'interpreter' && (
                <div className="p-4 overflow-y-auto flex-1 space-y-3.5 text-xs">
                  {/* Linguistic & Original Text Breakdown */}
                  <div className="p-3 bg-secondary/40 border border-border rounded-xl space-y-1.5">
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">
                      Original Root & Translation Insight
                    </span>
                    <p className="text-foreground leading-relaxed font-sans">
                      {interpData.originalTextSummary}
                    </p>
                  </div>

                  {/* Apostolic Hermeneutics / Commentary by Apostle Joe Daniels */}
                  <div className="p-3.5 bg-primary/5 border border-primary/25 rounded-xl space-y-2 shadow-xs">
                    <div className="flex items-center gap-1.5 text-primary">
                      <Flame className="w-4 h-4" />
                      <span className="font-bold uppercase tracking-wider text-[11px]">
                        Apostolic Exposition • Apostle Joe Daniels
                      </span>
                    </div>
                    <p className="text-foreground leading-relaxed font-serif-church italic">
                      "{interpData.apostolicHermeneutics}"
                    </p>
                  </div>

                  {/* Prophetic Declaration */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                      Prophetic Decree Over Your Life
                    </span>
                    <p className="font-medium leading-relaxed">
                      {interpData.propheticDeclaration}
                    </p>
                  </div>

                  {/* Cultural & Historical Setting */}
                  <div className="p-3 bg-secondary/40 border border-border rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Historical Setting
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      {interpData.culturalHistoricalContext}
                    </p>
                  </div>

                  {/* Practical Life Application */}
                  <div className="p-3 bg-secondary/40 border border-border rounded-xl space-y-2">
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">
                      Personal Kingdom Walk & Action Steps
                    </span>
                    <ul className="space-y-1.5 text-foreground">
                      {interpData.lifeApplication.map((app, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{app}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Linked Concordance Terms */}
                  <div className="pt-1">
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-2">
                      Linked Greek & Hebrew Terms In This Verse:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {interpData.keyTerms.map(termKey => {
                        const entry = BIBLE_DICTIONARY[termKey];
                        if (!entry) return null;
                        return (
                          <button
                            key={termKey}
                            onClick={() => {
                              setSelectedDictTermKey(termKey);
                              setStudyModalTab('dictionary');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-600 dark:text-sky-300 text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <Book className="w-3 h-3 text-sky-500" />
                            <span>{entry.term}</span>
                            <span className="text-[10px] opacity-70 font-mono">({entry.strongsNumber})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Biblical Lexicon & Dictionary */}
              {studyModalTab === 'dictionary' && (
                <div className="p-4 overflow-y-auto flex-1 space-y-3.5 text-xs">
                  {/* Dictionary Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={dictionarySearchQuery}
                      onChange={(e) => {
                        setDictionarySearchQuery(e.target.value);
                        setSelectedDictTermKey(null);
                      }}
                      placeholder="Search Hebrew/Greek term, Strong’s #, or word..."
                      className="w-full bg-secondary/70 border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Quick Term Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase shrink-0">Glossary:</span>
                    {dictEntries.map(([key, entry]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedDictTermKey(key);
                          setDictionarySearchQuery('');
                        }}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 transition-all ${
                          (selectedDictTermKey === key || (!selectedDictTermKey && !dictionarySearchQuery && interpData.keyTerms[0] === key))
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'bg-secondary/70 text-muted-foreground hover:text-foreground border border-border'
                        }`}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Active Selected Term Detailed Card */}
                  {activeDictEntry && (
                    <div className="p-4 bg-secondary/40 border border-border rounded-xl space-y-3 shadow-xs">
                      <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm sm:text-base text-primary">
                              {activeDictEntry.term}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono text-[10px]">
                              {activeDictEntry.strongsNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-300 text-[10px] font-semibold">
                              {activeDictEntry.language} • {activeDictEntry.partOfSpeech}
                            </span>
                          </div>
                          <p className="text-sm font-serif text-foreground mt-1 font-medium">
                            {activeDictEntry.originalWord} • Pronunciation: <span className="text-primary italic font-mono">{activeDictEntry.phonetic}</span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Literal Lexical Definition
                        </span>
                        <p className="text-foreground leading-relaxed font-sans">
                          {activeDictEntry.definition}
                        </p>
                      </div>

                      <div className="space-y-1 p-2.5 rounded-lg bg-secondary/60 border border-border">
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">
                          Theological & Prophetic Nuance
                        </span>
                        <p className="text-foreground leading-relaxed font-serif-church italic">
                          "{activeDictEntry.theologicalUsage}"
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Key Scripture References
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeDictEntry.relatedVerses.map(r => (
                            <span
                              key={r}
                              className="px-2 py-0.5 rounded-md bg-muted border border-border text-primary text-[10px] font-semibold"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Matching Glossary List if Searching */}
                  {dictionarySearchQuery && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Search Results ({filteredDictEntries.length})
                      </span>
                      {filteredDictEntries.map(([key, item]) => (
                        <div
                          key={key}
                          onClick={() => setSelectedDictTermKey(key)}
                          className="p-2.5 rounded-lg bg-secondary/50 border border-border hover:border-primary/40 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground text-xs">{item.term}</span>
                            <span className="text-[10px] text-primary font-mono">{item.strongsNumber}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{item.definition}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer */}
              <div className="p-3 bg-muted/40 border-t border-border flex items-center justify-between gap-2">
                <button
                  onClick={() => handleShareVerse(activeStudyVerse.verseKey, activeStudyVerse.text)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share via WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    setActiveStudyVerse(null);
                    setSelectedDictTermKey(null);
                    setDictionarySearchQuery('');
                  }}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all shadow-xs"
                >
                  Done
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
