import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { useLanguage } from '../contexts/LanguageContext';

type SortOption = 'distance' | 'price' | 'rating';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function SearchBar({ searchQuery, onSearchChange, sortBy, onSortChange }: SearchBarProps) {
  const { userLocation, locationAddress, hasLocationPermission, openMapModal } = useLocation();
  const { t } = useLanguage();
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    // Search is handled by the parent component through onSearchChange
    // This function can be used for additional search logic if needed
  };

  const sortOptions = [
    { value: 'distance', label: t('sort_by_distance') },
    { value: 'price', label: t('sort_by_price') },
    { value: 'rating', label: t('sort_by_rating') }
  ];

  const currentSortLabel = sortOptions.find(option => option.value === sortBy)?.label || t('sort_by_distance');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <div className="w-full max-w-7xl mx-auto lg:mt-8 lg:mb-8 px-4 sm:px-6 lg:px-8">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-xl shadow-lg p-4 flex items-center gap-8">
          {/* Search Input Section */}
          <div className="flex-1 bg-white rounded-lg">
            <div className="h-[60px] px-4 py-3.5 bg-white rounded-lg border border-gray-200 flex items-center gap-2.5">
              <Search className="w-6 h-6 text-[#94A3B8] flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('search_placeholder')}
                className="text-black text-base flex-1 bg-transparent border-none outline-none placeholder-[#94A3B8]"
              />
              <div className="w-px h-[34px] bg-[#CBD5E1]" />
              <button
                onClick={openMapModal}
                className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                type="button"
              >
                <MapPin className="w-6 h-6 text-[#44505C] flex-shrink-0" />
                {hasLocationPermission && userLocation ? (
                  <span className="text-[#44505C] text-base max-w-[242px] truncate">
                    {locationAddress || `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}
                  </span>
                ) : (
                  <span className="text-[#94A3B8] text-base">
                    {t('set_location')}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-[34px] bg-[#CBD5E1]" />

          {/* Controls Section */}
          <div className="flex items-center gap-3">
            {/* Sort Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="px-[18px] py-3 bg-white border-[0.5px] border-[#CBD5E1] rounded-[5px] flex items-center gap-1.5 hover:bg-gray-50 transition-colors"
              >
                <span className="text-[#0F172A] text-sm">{currentSortLabel}</span>
                <ChevronDown className={`w-4 h-4 text-[#0F172A] transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#CBD5E1] rounded-[5px] shadow-lg z-10">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value as SortOption);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-[18px] py-3 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-[5px] last:rounded-b-[5px] ${
                        sortBy === option.value ? 'bg-[#043434] text-white' : 'text-[#0F172A]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="px-6 py-[11px] bg-[#043434] rounded-lg flex items-center gap-1.5 hover:bg-[#033232] transition-colors"
            >
              <span className="text-[#F8FAFC] text-lg font-semibold">{t('search')}</span>
              <Search className="w-[18px] h-[18px] text-[#F8FAFC]" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden py-4">
        <div
          className="bg-white flex flex-col justify-center items-start gap-2 rounded-2xl"
          style={{
            padding: '12px 16px',
            boxShadow: '8px 8px 24px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Search Input */}
          <div className="self-stretch bg-white overflow-hidden rounded-xl border border-black/5 flex flex-col justify-start items-start gap-1.5">
            <div className="self-stretch bg-white overflow-hidden rounded-xl flex justify-start items-center gap-2.5 px-4 py-3">
              <div className="flex-1 flex justify-start items-center gap-1">
                <Search className="w-5 h-5 text-[#94A3B8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t('search_mobile_placeholder')}
                  className="flex-1 text-black text-base font-normal leading-6 bg-transparent border-none outline-none placeholder-[#94A3B8]"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-[#043434] rounded-xl flex justify-center items-center gap-1.5 px-6 py-[11px]"
              >
                <Search className="w-[18px] h-[18px] text-[#F8FAFC]" />
              </button>
            </div>
          </div>

          {/* Controls Row: Location + Sort */}
          <div className="flex justify-start items-center gap-2 w-full">
            {/* Location Button */}
            <button
              onClick={openMapModal}
              className="flex-1 h-10 flex items-center gap-2 px-[18px] py-3 bg-white rounded-xl border border-[#CBD5E1]/50 hover:bg-gray-50 transition-colors min-w-0"
              type="button"
            >
              <MapPin className="w-4 h-4 text-[#44505C] flex-shrink-0" />
              {hasLocationPermission && userLocation ? (
                <span className="text-[#44505C] text-sm font-normal leading-[17px] truncate overflow-hidden text-ellipsis">
                  {locationAddress || `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}
                </span>
              ) : (
                <span className="text-[#94A3B8] text-sm font-normal leading-[17px] truncate overflow-hidden text-ellipsis">
                  {t('set_location')}
                </span>
              )}
            </button>

            {/* Sort Button */}
            <div className="relative h-10 flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="h-10 bg-white rounded-xl border border-[#CBD5E1]/50 flex justify-center items-center gap-1.5 px-[18px] py-3 whitespace-nowrap"
              >
                <span className="text-center text-[#0F172A] text-sm font-normal leading-[17px]">
                  {currentSortLabel}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#0F172A] transition-transform flex-shrink-0 ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#CBD5E1]/50 rounded-xl shadow-lg z-10">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value as SortOption);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-[18px] py-3 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        sortBy === option.value ? 'bg-[#043434] text-white' : 'text-[#0F172A]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}