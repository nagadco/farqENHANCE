import { useLanguage } from '../contexts/LanguageContext';
import { useEffect, useState } from 'react';
import styles from './LoadingModal.module.css';

interface LoadingModalProps {
  isOpen: boolean;
}

export default function LoadingModal({ isOpen }: LoadingModalProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips = [
    { title: t('save_more_by_comparing'), description: t('save_more_description') },
    { title: t('tip_compare_prices'), description: t('tip_compare_prices_desc') },
    { title: t('tip_track_favorites'), description: t('tip_track_favorites_desc') },
    { title: t('tip_delivery_fees'), description: t('tip_delivery_fees_desc') },
  ];

  const handlePrevious = () => {
    setCurrentTipIndex((prev) => (prev === 0 ? tips.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentTipIndex((prev) => (prev === tips.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setProgress(0);
      setCurrentTipIndex(0);
      return;
    }

    // Total duration: 50 seconds
    // 6 steps, each step takes about 8.33 seconds
    const totalDuration = 50000; // 50 seconds
    const steps = 6;

    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + (100 / (totalDuration / 100)); // Increment every 100ms

        // Update current step based on progress
        const newStep = Math.min(Math.floor(newProgress / (100 / steps)), steps - 1);
        setCurrentStep(newStep);

        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }

        return newProgress;
      });
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isOpen]);

  const getLoadingText = () => {
    const messages = [
      t('searching_restaurants'),
      t('analyzing_prices'),
      t('comparing_offers'),
      t('finding_best_deals'),
      t('calculating_savings'),
      t('almost_ready')
    ];
    return messages[currentStep] || t('loading');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />

      {/* Modal - Bottom sheet on mobile, centered on desktop */}
      <div className="relative bg-[#F9FAFB] overflow-hidden w-full md:mx-4 md:max-w-md md:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-center gap-8 p-6 sm:p-8 lg:p-10 pt-6">
          {/* Progress bars */}
          <div className="w-full max-w-[363px] flex items-center gap-4">
            {Array.from({ length: 6 }, (_, index) => {
              const stepProgress = progress / (100 / 6); // Convert overall progress to step progress
              const isCompleted = stepProgress > index + 1;
              const isActive = Math.floor(stepProgress) === index;
              const currentStepProgress = isActive ? ((stepProgress - index) * 100) : 0;

              return (
                <div key={index} className="flex-1 h-1.5 relative">
                  <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full" />
                  <div
                    className="h-1.5 bg-[#043434] rounded-full absolute top-0 right-0 transition-all duration-300 ease-out"
                    style={{
                      width: isCompleted ? '100%' : isActive ? `${currentStepProgress}%` : '0%'
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Loading illustration and text */}
          <div className="flex flex-col items-center gap-3.5">
            {/* Loading illustration */}
            <div className="w-[243px] h-[180px] relative flex items-center justify-center">
              <div className={styles.motorcycleContainer}>
                <div className={styles.wheelGlow} />
                <img
                  src="/Loading.svg"
                  alt="Loading"
                  className={`w-full h-full object-contain ${styles.motorcycleAnimation} ${styles.engineVibration}`}
                />
              </div>
            </div>

            <div className="max-w-[318px] text-center text-[#757575] text-base font-medium leading-[22.4px]">
              {getLoadingText()}...
            </div>
          </div>

          {/* Tips section with navigation */}
          <div className="flex flex-col items-start gap-5 w-full max-w-[363px]">
            <div className="flex flex-col items-center gap-5 w-full">
              <div className="flex flex-col items-center gap-1 w-full min-h-[80px]">
                <div className="text-center text-[#282A33] text-xl sm:text-2xl font-semibold leading-[28.8px]">
                  {tips[currentTipIndex].title}
                </div>
                <div className="max-w-[318px] text-center text-[#757575] text-sm font-normal leading-[19.6px]">
                  {tips[currentTipIndex].description}
                </div>
              </div>

              {/* Tip indicators */}
              <div className="flex items-center gap-2">
                {tips.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentTipIndex ? 'w-6 bg-[#043434]' : 'w-1.5 bg-[#D9D9D9]'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-start gap-4 w-full max-w-[281px]">
                <button
                  onClick={handlePrevious}
                  className="flex-1 px-[18px] py-3 bg-white rounded-lg border border-[#D9D9D9] flex justify-center items-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="text-center text-[#040403] text-sm font-semibold leading-[17px]">
                    {t('previous')}
                  </div>
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 px-[18px] py-3 bg-white rounded-lg border border-[#D9D9D9] flex justify-center items-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="text-center text-[#040403] text-sm font-semibold leading-[17px]">
                    {t('next')}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}