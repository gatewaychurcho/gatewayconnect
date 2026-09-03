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
  X
} from 'lucide-react';
import { BibleVersion, BibleBook, ReadingPlan } from '../../types';
import { BIBLE_BOOKS, SAMPLE_VERSES_DATA, READING_PLANS, PASTOR_FOLLOW_SCRIPTURE } from '../../data/bibleData';
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
        return true;
      }
    }
    return false;
  };

  const currentBookObj = BIBLE_BOOKS.find(b => b.name === selectedBook) || BIBLE_BOOKS[0];

  // Retrieve verses for current book & chapter
  const versesForChapter: Array<{ verseNum: number; text: string }> = [];
  const bookData = SAMPLE_VERSES_DATA[selectedBook];
  const chapterData = bookData ? bookData[String(selectedChapter)] : null;

  if (chapterData) {
    Object.keys(chapterData).forEach(vNum => {
      const num = parseInt(vNum, 10);
      const vObj = chapterData[num];
      versesForChapter.push({
        verseNum: num,
        text: vObj[version] || vObj['KJV'] || ''
      });
    });
  } else {
    // Generate uniform standard verses for navigation completeness
    const verseCount = Math.min(24, Math.max(12, ((selectedChapter * 7) % 25) + 8));
    for (let i = 1; i <= verseCount; i++) {
      let sampleText = '';
      if (version === 'Shona') {
        sampleText = `Mwari anotaura muShoko rake pamusoro pe${selectedBook} chitsauko ${selectedChapter}, vhesi ${i}: "Simba nokubwinya zvaMwari zvinogara naye anovimba naShe pamazuva ose."`;
      } else if (version === 'NIV') {
        sampleText = `The word of the Lord in ${selectedBook} chapter ${selectedChapter}, verse ${i}: "The grace of our Lord Jesus Christ strengthens all who call upon His name in righteousness."`;
      } else if (version === 'ESV') {
        sampleText = `In ${selectedBook} ${selectedChapter}:${i} - "Trust in the Lord with all your heart, and do not lean on your own understanding; in all your ways acknowledge Him."`;
      } else {
        sampleText = `And it came to pass in ${selectedBook} chapter ${selectedChapter}, verse ${i}, that the glory and power of the Lord was revealed unto His servants, and His praise endured forever.`;
      }
      versesForChapter.push({ verseNum: i, text: sampleText });
    }
  }

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

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto px-2 sm:px-4 pt-1">
      
      {/* 1. JW-Style Main Top Navigation Bar */}
      <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-xl sticky top-14 z-30 backdrop-blur-md space-y-2">
        
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          {/* Main Scripture Selector Trigger (JW-Style: Book + Chapter) */}
          <button
            id="btn-open-jw-bible-nav"
            onClick={() => {
              setNavStep('book');
              setShowNavModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#001122] border border-[#D4AF37]/50 hover:border-[#D4AF37] text-white font-bold text-sm sm:text-base transition-all shadow-sm active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#D4AF37]">{selectedBook}</span>
            <span className="text-white/90">{selectedChapter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/50" />
          </button>

          {/* Quick Chapter Step Prev / Next Buttons */}
          <div className="flex items-center gap-1 bg-[#001122] p-1 rounded-xl border border-white/10">
            <button
              disabled={selectedChapter <= 1}
              onClick={() => {
                setSelectedChapter(prev => Math.max(1, prev - 1));
                setTargetVerse(1);
              }}
              title="Previous Chapter"
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-white/60 px-1 font-semibold">
              {selectedChapter} / {currentBookObj.chaptersCount}
            </span>
            <button
              disabled={selectedChapter >= currentBookObj.chaptersCount}
              onClick={() => {
                setSelectedChapter(prev => Math.min(currentBookObj.chaptersCount, prev + 1));
                setTargetVerse(1);
              }}
              title="Next Chapter"
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Translation Switcher (JW Clean Style) */}
          <div className="flex items-center gap-1 bg-[#001122] p-1 rounded-xl border border-white/10">
            {(['KJV', 'NIV', 'ESV', 'Shona'] as BibleVersion[]).map(v => (
              <button
                key={v}
                onClick={() => setVersion(v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  version === v 
                    ? 'bg-[#D4AF37] text-[#001F3F] shadow-sm' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {v === 'Shona' ? 'Shona' : v}
              </button>
            ))}
          </div>

          {/* Settings & Audio Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleAudio}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                isPlayingAudio 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'bg-[#001122] hover:bg-white/10 text-white/80 border border-white/10'
              }`}
              title="Read Chapter Aloud"
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#D4AF37]" />}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                showSettings 
                  ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37]' 
                  : 'bg-[#001122] hover:bg-white/10 text-white/80 border-white/10'
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
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={quickSearchQuery}
              onChange={(e) => setQuickSearchQuery(e.target.value)}
              placeholder='Search verse e.g. "John 3:16", "Romans 8:28", or word "shepherd"'
              className="w-full bg-[#001122] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#D4AF37] text-[#001F3F] font-bold text-xs rounded-xl hover:brightness-110 shadow"
          >
            Jump
          </button>
        </form>

        {/* Search Results Dropdown */}
        {isSearching && quickSearchResults.length > 0 && (
          <div className="p-2.5 bg-[#001122] border border-[#D4AF37]/40 rounded-xl space-y-1.5 max-h-48 overflow-y-auto text-xs">
            <div className="flex items-center justify-between text-[11px] text-[#D4AF37] font-bold px-1">
              <span>{quickSearchResults.length} Search Matches</span>
              <button onClick={() => setIsSearching(false)} className="text-white/50 hover:text-white">
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
                  setIsSearching(false);
                }}
                className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-[#D4AF37]/10 border border-white/5 hover:border-[#D4AF37]/40 transition-all block"
              >
                <div className="font-bold text-[#D4AF37]">
                  {res.book} {res.chapter}:{res.verse}
                </div>
                <div className="text-white/70 line-clamp-1">{res.text}</div>
              </button>
            ))}
          </div>
        )}

        {/* JW Typography Settings Panel (Expandable) */}
        {showSettings && (
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/80 animate-in fade-in duration-150">
            {/* Font Size Adjuster (A- / A / A+) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-white/60">Font Size:</span>
              <div className="flex rounded-lg bg-[#001122] p-0.5 border border-white/10">
                <button
                  onClick={() => setFontSize('sm')}
                  className={`px-2.5 py-0.5 rounded text-xs ${fontSize === 'sm' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-white/60'}`}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize('base')}
                  className={`px-2.5 py-0.5 rounded text-xs ${fontSize === 'base' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-white/60'}`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('lg')}
                  className={`px-2.5 py-0.5 rounded text-xs ${fontSize === 'lg' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-white/60'}`}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Layout Style: Verse-by-Verse vs Continuous Paragraph */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-white/60">Layout:</span>
              <div className="flex rounded-lg bg-[#001122] p-0.5 border border-white/10">
                <button
                  onClick={() => setViewStyle('verse')}
                  className={`px-2.5 py-0.5 rounded text-xs flex items-center gap-1 ${viewStyle === 'verse' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-white/60'}`}
                >
                  <List className="w-3 h-3" />
                  <span>Verse by Verse</span>
                </button>
                <button
                  onClick={() => setViewStyle('paragraph')}
                  className={`px-2.5 py-0.5 rounded text-xs flex items-center gap-1 ${viewStyle === 'paragraph' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-white/60'}`}
                >
                  <AlignLeft className="w-3 h-3" />
                  <span>Continuous</span>
                </button>
              </div>
            </div>

            {/* Font Family: Classical Serif vs Clean Sans */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-white/60">Font:</span>
              <div className="flex rounded-lg bg-[#001122] p-0.5 border border-white/10">
                <button
                  onClick={() => setFontFamily('serif')}
                  className={`px-2.5 py-0.5 rounded text-xs font-serif ${fontFamily === 'serif' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-white/60'}`}
                >
                  Serif
                </button>
                <button
                  onClick={() => setFontFamily('sans')}
                  className={`px-2.5 py-0.5 rounded text-xs font-sans ${fontFamily === 'sans' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-white/60'}`}
                >
                  Sans
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 2. Sub-navigation tabs (Reader, Reading Plans, Bookmarks) */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('reader')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reader'
              ? 'bg-[#D4AF37] text-[#001F3F] shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Holy Scriptures
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'plans'
              ? 'bg-[#D4AF37] text-[#001F3F] shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Reading Plans ({READING_PLANS.length})
        </button>
        <button
          onClick={() => setActiveTab('highlights')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'highlights'
              ? 'bg-[#D4AF37] text-[#001F3F] shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Bookmarks & Notes ({savedVerses.length})
        </button>
      </div>

      {/* 3. Main Reading Content (JW Style Clean Professional Typography) */}
      {activeTab === 'reader' && (
        <div className="bg-[#001F3F]/70 border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
          
          {/* Chapter Title Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold text-[#D4AF37] ${fontFamily === 'serif' ? 'font-serif-church' : 'font-sans'}`}>
                {selectedBook} {selectedChapter}
              </h2>
              <p className="text-xs text-white/50">
                Translation: {version === 'Shona' ? 'Bhaibheri Dzvene (Shona)' : version} • {currentBookObj.testament === 'OT' ? 'Hebrew-Aramaic Scriptures (OT)' : 'Christian Greek Scriptures (NT)'}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <button
                disabled={selectedChapter <= 1}
                onClick={() => {
                  setSelectedChapter(prev => Math.max(1, prev - 1));
                  setTargetVerse(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#001122] border border-white/10 text-white/70 hover:text-white disabled:opacity-30"
              >
                ‹ Prev Chapter
              </button>
              <button
                disabled={selectedChapter >= currentBookObj.chaptersCount}
                onClick={() => {
                  setSelectedChapter(prev => Math.min(currentBookObj.chaptersCount, prev + 1));
                  setTargetVerse(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#001122] border border-white/10 text-white/70 hover:text-white disabled:opacity-30"
              >
                Next Chapter ›
              </button>
            </div>
          </div>

          {/* MODE A: Verse by Verse Layout */}
          {viewStyle === 'verse' && (
            <div ref={verseContainerRef} className={`space-y-3 ${fontFamily === 'serif' ? 'font-serif-church' : 'font-sans'}`}>
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
                    className={`group relative p-2.5 rounded-xl transition-all border ${
                      isSelected ? 'ring-2 ring-[#D4AF37] bg-[#D4AF37]/15' : ''
                    } ${
                      highlightColor === 'gold' ? 'bg-amber-500/20 border-amber-400/60 text-amber-100' :
                      highlightColor === 'emerald' ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-100' :
                      highlightColor === 'blue' ? 'bg-blue-500/20 border-blue-400/60 text-blue-100' :
                      highlightColor === 'rose' ? 'bg-rose-500/20 border-rose-400/60 text-rose-100' :
                      'bg-[#001122]/40 border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Compact clean superscript-style verse number */}
                      <span className="text-xs font-bold text-[#D4AF37] font-mono mt-0.5 select-none shrink-0 min-w-[20px]">
                        {verseNum}
                      </span>

                      <p className={`${fontClass} text-slate-100 flex-1 font-normal tracking-wide`}>
                        {text}
                      </p>
                    </div>

                    {/* Personal Study Note if present */}
                    {noteText && (
                      <div className="mt-2 text-xs bg-[#001122] border border-[#D4AF37]/40 rounded-lg p-2 text-[#D4AF37] flex items-start gap-1.5">
                        <FileEdit className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Personal Note:</span> {noteText}
                        </div>
                      </div>
                    )}

                    {/* Verse Actions toolbar (Highlight, Note, Save, WhatsApp Share) */}
                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* Highlight color dots */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleHighlight(verseKey, 'gold')}
                          title="Highlight Gold"
                          className={`w-3.5 h-3.5 rounded-full bg-amber-400 border border-white/30 ${highlightColor === 'gold' ? 'ring-2 ring-white' : ''}`}
                        />
                        <button
                          onClick={() => handleToggleHighlight(verseKey, 'emerald')}
                          title="Highlight Emerald"
                          className={`w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white/30 ${highlightColor === 'emerald' ? 'ring-2 ring-white' : ''}`}
                        />
                        <button
                          onClick={() => handleToggleHighlight(verseKey, 'blue')}
                          title="Highlight Blue"
                          className={`w-3.5 h-3.5 rounded-full bg-sky-400 border border-white/30 ${highlightColor === 'blue' ? 'ring-2 ring-white' : ''}`}
                        />
                        <button
                          onClick={() => handleToggleHighlight(verseKey, 'rose')}
                          title="Highlight Rose"
                          className={`w-3.5 h-3.5 rounded-full bg-rose-500 border border-white/30 ${highlightColor === 'rose' ? 'ring-2 ring-white' : ''}`}
                        />
                      </div>

                      <div className="flex items-center gap-1 text-[11px]">
                        {/* Add Note Trigger */}
                        <button
                          onClick={() => {
                            setSelectedVerseKey(verseKey);
                            setActiveNoteInput(notes[verseKey] || '');
                          }}
                          className="px-2 py-0.5 rounded text-white/60 hover:text-[#D4AF37] hover:bg-white/5 flex items-center gap-1"
                        >
                          <FileEdit className="w-3 h-3" />
                          <span>Note</span>
                        </button>

                        {/* Save / Bookmark */}
                        <button
                          onClick={() => handleToggleBookmark(verseKey)}
                          className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                            isSaved ? 'text-[#D4AF37] font-bold' : 'text-white/60 hover:text-white'
                          }`}
                        >
                          {isSaved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                          <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>

                        {/* WhatsApp Share */}
                        <button
                          onClick={() => handleShareVerse(verseKey, text)}
                          className="p-1 rounded text-emerald-400 hover:bg-emerald-950/40"
                          title="Share to WhatsApp"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Note Editor */}
                    {selectedVerseKey === verseKey && (
                      <div className="mt-2 p-2.5 bg-[#001122] border border-[#D4AF37]/50 rounded-xl space-y-2 animate-in fade-in duration-150">
                        <textarea
                          value={activeNoteInput}
                          onChange={(e) => setActiveNoteInput(e.target.value)}
                          placeholder={`Write study note for ${verseKey}...`}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            onClick={() => setSelectedVerseKey(null)}
                            className="px-3 py-1 rounded-lg text-white/60 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNote(verseKey)}
                            className="px-3 py-1 bg-[#D4AF37] text-[#001F3F] font-bold rounded-lg"
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

          {/* MODE B: Continuous Flowing Paragraph Layout (JW Reader Style) */}
          {viewStyle === 'paragraph' && (
            <div className={`p-4 bg-[#001122]/50 rounded-xl border border-white/5 ${fontFamily === 'serif' ? 'font-serif-church' : 'font-sans'}`}>
              <p className={`${fontClass} text-slate-100 text-justify tracking-wide`}>
                {versesForChapter.map(({ verseNum, text }) => {
                  const verseKey = `${selectedBook} ${selectedChapter}:${verseNum}`;
                  const highlightColor = highlights[verseKey];
                  const isTarget = targetVerse === verseNum;

                  return (
                    <span
                      key={verseNum}
                      id={`verse-${verseNum}`}
                      className={`inline transition-colors ${
                        isTarget ? 'bg-[#D4AF37]/30 text-white font-semibold px-1 rounded' : ''
                      } ${
                        highlightColor === 'gold' ? 'bg-amber-500/25 text-amber-200' :
                        highlightColor === 'emerald' ? 'bg-emerald-500/25 text-emerald-200' :
                        highlightColor === 'blue' ? 'bg-blue-500/25 text-sky-200' :
                        highlightColor === 'rose' ? 'bg-rose-500/25 text-rose-200' : ''
                      }`}
                    >
                      <sup className="text-[10px] font-bold text-[#D4AF37] select-none mx-1 font-mono">
                        {verseNum}
                      </sup>
                      {text}{' '}
                    </span>
                  );
                })}
              </p>
            </div>
          )}

          {/* Bottom Chapter Jump Navigation */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              disabled={selectedChapter <= 1}
              onClick={() => {
                setSelectedChapter(prev => Math.max(1, prev - 1));
                setTargetVerse(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-xl bg-[#001122] border border-white/10 text-white/70 hover:text-white text-xs font-bold disabled:opacity-30 transition-all flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{selectedBook} {selectedChapter - 1}</span>
            </button>

            <button
              onClick={() => {
                setNavStep('chapter');
                setShowNavModal(true);
              }}
              className="text-xs text-[#D4AF37] font-bold hover:underline"
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
              className="px-4 py-2 rounded-xl bg-[#001122] border border-white/10 text-white/70 hover:text-white text-xs font-bold disabled:opacity-30 transition-all flex items-center gap-1.5"
            >
              <span>{selectedBook} {selectedChapter + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* Reading Plans Tab */}
      {activeTab === 'plans' && (
        <div className="bg-[#001F3F]/70 border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-[#D4AF37] font-serif-church">
              Structured Scripture Reading Plans
            </h3>
            <p className="text-xs text-white/60">
              Follow spiritual discipleship tracks curated by Apostle Joe Daniels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {READING_PLANS.map(plan => {
              const progressPercent = Math.round((plan.currentDay / plan.totalDays) * 100);
              return (
                <div key={plan.id} className="p-4 rounded-xl bg-[#001122] border border-white/10 space-y-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">{plan.title}</h4>
                    <p className="text-xs text-white/60 mt-0.5">{plan.description}</p>
                  </div>
                  <div className="text-xs text-[#D4AF37] font-bold">
                    Today: {plan.todaysReading}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/50">
                      <span>Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="bg-gradient-to-r from-[#D4AF37] to-amber-300 h-full rounded-full"
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
        <div className="bg-[#001F3F]/70 border border-white/10 rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-base text-[#D4AF37] font-serif-church">
            Saved Verses & Study Notes
          </h3>
          {savedVerses.length === 0 ? (
            <p className="text-xs text-white/50 py-6 text-center">
              No bookmarked verses yet. Tap "Save" on any verse in the reader.
            </p>
          ) : (
            <div className="space-y-2">
              {savedVerses.map((ref, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#001122] border border-white/10 hover:border-[#D4AF37]/40"
                >
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-[#D4AF37]" />
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-white">{ref}</p>
                      {notes[ref] && (
                        <p className="text-[11px] text-[#D4AF37] italic">{notes[ref]}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      parseAndNavigateReference(ref);
                      setActiveTab('reader');
                    }}
                    className="px-3 py-1 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold rounded-lg"
                  >
                    Open Verse
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. JW.org-Style 3-Step Navigation Modal (Book -> Chapter -> Verse) */}
      {showNavModal && (
        <div className="fixed inset-0 z-50 bg-[#001122]/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="bg-[#001F3F] border-2 border-[#D4AF37]/60 rounded-3xl max-w-xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            
            {/* JW Nav Modal Header */}
            <div className="p-4 border-b border-white/10 bg-[#001122] flex items-center justify-between">
              {/* Breadcrumb path: e.g. [ Books ] > [ Psalms ] > [ Verse ] */}
              <div className="flex items-center gap-1 text-xs sm:text-sm">
                <button
                  onClick={() => setNavStep('book')}
                  className={`font-bold transition-colors ${navStep === 'book' ? 'text-[#D4AF37]' : 'text-white/60 hover:text-white'}`}
                >
                  Books
                </button>
                <span className="text-white/30">/</span>
                <button
                  onClick={() => setNavStep('chapter')}
                  className={`font-bold transition-colors ${navStep === 'chapter' ? 'text-[#D4AF37]' : 'text-white/60 hover:text-white'}`}
                >
                  {selectedBook}
                </button>
                <span className="text-white/30">/</span>
                <button
                  onClick={() => setNavStep('verse')}
                  className={`font-bold transition-colors ${navStep === 'verse' ? 'text-[#D4AF37]' : 'text-white/60 hover:text-white'}`}
                >
                  Ch. {selectedChapter}
                </button>
              </div>

              <button
                onClick={() => setShowNavModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP 1: JW Book Selector */}
            {navStep === 'book' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Testament Switcher & Search Filter */}
                <div className="p-3 bg-[#001F3F] border-b border-white/10 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex rounded-xl bg-[#001122] p-1 border border-white/10 text-xs font-bold">
                    <button
                      onClick={() => setNavTestament('OT')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        navTestament === 'OT' 
                          ? 'bg-[#D4AF37] text-[#001F3F] shadow' 
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Hebrew-Aramaic (OT)
                    </button>
                    <button
                      onClick={() => setNavTestament('NT')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        navTestament === 'NT' 
                          ? 'bg-[#D4AF37] text-[#001F3F] shadow' 
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Christian Greek (NT)
                    </button>
                  </div>

                  <div className="relative flex-1 min-w-[140px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={bookFilterQuery}
                      onChange={(e) => setBookFilterQuery(e.target.value)}
                      placeholder="Filter book..."
                      className="w-full bg-[#001122] border border-white/10 rounded-xl pl-8 pr-2 py-1 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]"
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
                        className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#D4AF37] text-[#001F3F] font-bold border-[#D4AF37] shadow-md'
                            : 'bg-[#001122] border-white/10 hover:border-[#D4AF37]/50 text-white'
                        }`}
                      >
                        <span className="text-xs font-bold truncate">{book.name}</span>
                        <span className={`text-[10px] mt-1 ${isSelected ? 'text-[#001F3F]/70' : 'text-white/40'}`}>
                          {book.chaptersCount} Ch • {book.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: JW Chapter Grid (Uniform Squares) */}
            {navStep === 'chapter' && (
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                    Select Chapter for {selectedBook}
                  </span>
                  <button
                    onClick={() => setNavStep('book')}
                    className="text-xs text-white/60 hover:text-white"
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
                        className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold border transition-all ${
                          isSelected
                            ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37] shadow-md scale-105'
                            : 'bg-[#001122] border-white/10 hover:border-[#D4AF37]/50 text-white'
                        }`}
                      >
                        {chNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: JW Verse Grid (Uniform Squares) */}
            {navStep === 'verse' && (
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                    Select Verse in {selectedBook} {selectedChapter}
                  </span>
                  <button
                    onClick={() => setNavStep('chapter')}
                    className="text-xs text-white/60 hover:text-white"
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
                        className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold border transition-all ${
                          isSelected
                            ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37] shadow-md scale-105'
                            : 'bg-[#001122] border-white/10 hover:border-[#D4AF37]/50 text-white'
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
                  className="w-full py-2.5 bg-[#D4AF37] text-[#001F3F] font-bold text-xs rounded-xl mt-3 shadow"
                >
                  Read From Beginning of Chapter {selectedChapter}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
