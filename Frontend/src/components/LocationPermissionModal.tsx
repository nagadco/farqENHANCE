import { useLanguage } from '../contexts/LanguageContext';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void;
  onDeny: () => void;
}

export default function LocationPermissionModal({
  isOpen,
  onAllow,
}: LocationPermissionModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - only on desktop */}
      <div className="hidden sm:block absolute inset-0 bg-black/30 backdrop-blur-md" />

      {/* Modal - Mobile Layout (Full Screen) */}
      <div className="sm:hidden fixed inset-0 w-full h-full bg-white overflow-hidden flex flex-col">
        {/* Top Section with Icon and Text */}
        <div className="flex-1 flex flex-col items-center px-4 pt-[198px]">
          {/* Location Icon */}
          <div className="w-[147px] h-[174px] relative">
            <img src="/location.svg" alt="Location" className="w-full h-full" />
          </div>

          {/* Text Section */}
          <div className="w-full max-w-[343px] flex flex-col items-center gap-1 mt-[33px]">
            {/* Title */}
            <div className="w-full text-center text-[#282A33] font-semibold break-words" style={{ fontSize: '24px', lineHeight: '28.8px' }}>
              {t('welcome')}
            </div>

            {/* Description */}
            <div className="w-full max-w-[318px] text-center text-[#282A33] font-medium break-words" style={{ fontSize: '16px', lineHeight: '22.4px' }}>
              {t('location_description')}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="w-full px-4 pb-8">
          <div className="w-full max-w-[343px] mx-auto flex flex-col gap-5">
            <div className="w-full flex flex-col items-center gap-5">
              {/* Privacy Text */}
              <div className="w-full text-center text-[#757575] font-normal break-words" style={{ fontSize: '14px', lineHeight: '19.6px' }}>
                {t('privacy_text')}
              </div>

              {/* Divider */}
              <div className="w-full h-0" style={{ opacity: 0.30, outline: '1px #B2B2B2 solid', outlineOffset: '-0.50px' }} />
            </div>

            {/* Enable Location Button */}
            <button
              onClick={onAllow}
              className="w-full flex justify-center items-center gap-1.5"
              style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16, background: '#043434', borderRadius: 8 }}
            >
              <div className="text-center text-[#F3F3F3] font-semibold break-words" style={{ fontSize: '18px', lineHeight: '22px' }}>
                {t('enable_location')}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Modal - Desktop Layout */}
      <div className="hidden sm:block relative w-full max-w-md lg:max-w-[443px] mx-4 bg-white overflow-hidden" style={{ boxShadow: '0px 24px 48px rgba(0, 0, 0, 0.10)', borderRadius: 16, padding: '32px 40px' }}>
        <div className="flex flex-col justify-start items-center gap-8">
          {/* Location Icon */}
          <div className="w-[147px] h-[174px] relative">
            <img src="/location.svg" alt="Location" className="w-full h-full" />
          </div>

          {/* Text and Button Section */}
          <div className="self-stretch flex flex-col justify-start items-start gap-5">
            <div className="w-[363px] flex flex-col justify-start items-center gap-5">
              {/* Title and Description */}
              <div className="self-stretch flex flex-col justify-start items-center gap-1">
                <div className="self-stretch flex flex-col justify-start items-center gap-1">
                  <div className="self-stretch text-center text-[#282A33] text-2xl font-semibold leading-[28.80px] break-words">
                    {t('welcome')}
                  </div>
                </div>
                <div className="w-[318px] text-center text-[#282A33] text-base font-medium leading-[22.40px] break-words">
                  {t('location_description')}
                </div>
              </div>

              {/* Enable Location Button */}
              <button
                onClick={onAllow}
                className="self-stretch flex justify-center items-center gap-1.5"
                style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16, background: '#043434', borderRadius: 8 }}
              >
                <div className="text-center text-[#F8FAFC] text-lg font-semibold leading-[22px] break-words">
                  {t('enable_location')}
                </div>
              </button>
            </div>

            {/* Divider and Privacy Text */}
            <div className="self-stretch flex flex-col justify-start items-center gap-5">
              <div className="self-stretch h-0" style={{ opacity: 0.30, outline: '1px #B2B2B2 solid', outlineOffset: '-0.50px' }} />
              <div className="w-[347px] text-center text-[#757575] text-xs font-normal leading-[16.80px] break-words">
                {t('privacy_text')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}