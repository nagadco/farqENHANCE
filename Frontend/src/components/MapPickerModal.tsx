import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../contexts/LanguageContext';

// Fix for default marker icons in React Leaflet
// This is a known issue with Leaflet + Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLocation: { lat: number; lng: number } | null;
    onLocationSelect: (lat: number, lng: number) => void;
}

// Component to handle map clicks and update marker position
function LocationMarker({
    position,
    setPosition
}: {
    position: [number, number];
    setPosition: (pos: [number, number]) => void;
}) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return <Marker position={position} />;
}

function AutoResizeMap({ position }: { position: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        // Fix map not rendering when inside hidden modal by invalidating size
        setTimeout(() => {
            map.invalidateSize();
            map.setView(position);
            console.log('Leaflet map invalidated and centered');
        }, 0);
    }, [map, position]);
    return null;
}

export default function MapPickerModal({
    isOpen,
    onClose,
    currentLocation,
    onLocationSelect
}: MapPickerModalProps) {
    const { language } = useLanguage();
    const isRTL = language === 'ar';

    console.log('MapPickerModal render - isOpen:', isOpen, 'currentLocation:', currentLocation);

    // Default to Riyadh if no location provided
    const defaultLat = currentLocation?.lat || 24.7136;
    const defaultLng = currentLocation?.lng || 46.6753;

    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([defaultLat, defaultLng]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Update position when current location changes
    useEffect(() => {
        if (currentLocation) {
            setSelectedPosition([currentLocation.lat, currentLocation.lng]);
        }
    }, [currentLocation]);

    // Live search with debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=sa&limit=5&accept-language=${isRTL ? 'ar' : 'en'}`
                );
                const data = await response.json();
                setSearchResults(data);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, isRTL]);

    const handleSelectResult = (result: any) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setSelectedPosition([lat, lng]);
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleConfirm = () => {
        onLocationSelect(selectedPosition[0], selectedPosition[1]);
        onClose();
    };

    const handleUseCurrentLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setSelectedPosition([latitude, longitude]);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert(
                        isRTL
                            ? 'لا يمكن الحصول على موقعك. يرجى التحقق من إعدادات المتصفح.'
                            : 'Unable to get your location. Please check browser settings.'
                    );
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        }
    };

    if (!isOpen) {
        console.log('MapPickerModal not rendering - isOpen is false');
        return null;
    }

    console.log('MapPickerModal rendering with selectedPosition:', selectedPosition);

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={(e) => {
            // Close if clicking on backdrop
            if (e.target === e.currentTarget) {
                console.log('Backdrop clicked');
                onClose();
            }
        }}>
            <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:w-[95%] sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-3 sm:p-6 border-b shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className={`text-lg sm:text-2xl font-bold text-[#043434] ${isRTL ? 'font-arabic' : ''}`}>
                            {isRTL ? 'اختر موقعك' : 'Choose Your Location'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-3xl leading-none p-1 -mt-1"
                        >
                            ×
                        </button>
                    </div>

                    {/* Search Box */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={isRTL ? 'ابحث عن مكان...' : 'Search for a place...'}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043434] text-sm bg-white text-gray-900 ${isRTL ? 'text-right font-arabic pr-10' : 'pl-10'}`}
                        />
                        {isSearching && (
                            <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'}`}>
                                <div className="w-4 h-4 border-2 border-[#043434] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto z-[100]">
                                {searchResults.map((result, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectResult(result)}
                                        className={`w-full px-3 py-2.5 text-sm text-gray-800 hover:bg-gray-100 active:bg-gray-200 border-b last:border-b-0 transition-colors ${isRTL ? 'text-right font-arabic' : 'text-left'}`}
                                    >
                                        {result.display_name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Container */}
                <div className="relative w-full" style={{ height: '50vh', minHeight: '300px', maxHeight: '500px' }}>
                    <MapContainer
                        key={`map-${isOpen}`}
                        center={selectedPosition}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        className="z-0"
                    >
                        <AutoResizeMap position={selectedPosition} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker
                            position={selectedPosition}
                            setPosition={setSelectedPosition}
                        />
                    </MapContainer>
                </div>

                {/* Info Text */}
                <div className={`p-2 sm:p-4 bg-gray-50 text-center text-xs sm:text-sm text-gray-600 shrink-0 ${isRTL ? 'font-arabic' : ''}`}>
                    {isRTL
                        ? 'اضغط على الخريطة لتحديد موقعك'
                        : 'Click on the map to set your location'}
                </div>

                {/* Coordinates Display - Hidden on mobile */}
                <div className={`hidden sm:block px-4 py-2 bg-gray-50 text-center text-xs text-gray-500 shrink-0 ${isRTL ? 'font-arabic' : ''}`}>
                    <span className="font-mono">
                        {isRTL ? 'الإحداثيات: ' : 'Coordinates: '}
                        {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
                    </span>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 sm:p-6 border-t shrink-0">
                    <button
                        onClick={handleUseCurrentLocation}
                        className={`flex-1 px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium text-sm sm:text-base ${isRTL ? 'font-arabic' : ''}`}
                    >
                        {isRTL ? 'استخدم موقعي الحالي' : 'Use My Current Location'}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 px-3 py-2.5 sm:px-4 sm:py-3 bg-[#043434] text-white rounded-lg hover:bg-[#032828] active:bg-[#021818] transition-colors font-medium text-sm sm:text-base ${isRTL ? 'font-arabic' : ''}`}
                    >
                        {isRTL ? 'تأكيد الموقع' : 'Confirm Location'}
                    </button>
                </div>
            </div>
        </div>
    );
}

