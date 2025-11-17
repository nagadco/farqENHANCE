import { useLanguage } from '../contexts/LanguageContext';

export default function Header() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div dir="ltr" className="w-full h-[90px] bg-white flex items-center justify-between px-11 sm:px-14 lg:px-20 border-b border-gray-100">
      {/* Logo */}
      <div className="text-[#043434] text-xl sm:text-2xl font-bold font-['Futura']">
        Farq
      </div>

      {/* Right Section: Language */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Language Selector */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#043434]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className={`text-[#282A33] text-sm sm:text-base font-medium ${language === 'en' ? 'font-arabic' : ''}`}>
            {language === 'en' ? 'عربي' : 'English'}
          </span>
        </button>
      </div>
    </div>
  );
}
