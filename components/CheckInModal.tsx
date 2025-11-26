import React, { useState, useEffect, useRef } from 'react';
import Button from './ui/Button';
import { CameraIcon, MapPinIcon, CloseIcon } from './icons';

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (photo: string, location: { lat: number, lon: number }) => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [status, setStatus] = useState('Initializing...');
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number, lon: number } | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isOpen) {
            // Cleanup: stop camera stream when modal is closed
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
            return;
        }

        // Reset state on open
        setStatus('Initializing...');
        setError(null);
        setLocation(null);
        setIsReady(false);
        setIsConfirming(false);

        // Request permissions and start processes
        const setupCheckIn = async () => {
            try {
                // 1. Get Geolocation
                setStatus('Acquiring location...');
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    });
                });
                setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });

                // 2. Get Camera Stream
                setStatus('Starting camera...');
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                
                setStatus('Ready for check-in.');
                setIsReady(true);
            } catch (err: any) {
                if (err.name === 'PermissionDeniedError' || err.code === 1) {
                    setError('Camera and location access is required. Please enable it in your browser settings.');
                } else if (err.name === 'TimeoutError') {
                    setError('Could not get location. Please ensure you have a stable connection and GPS is enabled.');
                } else {
                    setError('An unexpected error occurred. Could not start camera or get location.');
                }
                setStatus('Failed to initialize.');
            }
        };

        setupCheckIn();

    }, [isOpen]);
    
    const handleConfirm = () => {
        if (!videoRef.current || !canvasRef.current || !location) return;
        
        setIsConfirming(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        // Get image data from canvas
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        onConfirm(photoDataUrl, location);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Confirm Check-in</h2>
                     <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6">
                    <div className="mb-4">
                        <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden flex items-center justify-center">
                            {error ? (
                                <p className="text-red-500 text-center p-4">{error}</p>
                            ) : (
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            )}
                             <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>
                    </div>
                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                         <div className={`flex items-center gap-3 p-3 rounded-md ${error ? 'bg-red-50 dark:bg-red-900/50' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                            {isReady ? <span className="text-2xl">✅</span> : <div className="w-5 h-5 border-2 border-dashed rounded-full border-gray-400 animate-spin"></div>}
                            <p>{status}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <MapPinIcon className="h-5 w-5 text-gray-400" />
                           <p>Location: {location ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` : 'Acquiring...'}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end gap-4 rounded-b-lg">
                    <Button variant="secondary" onClick={onClose} disabled={isConfirming}>Cancel</Button>
                    <Button variant="primary" onClick={handleConfirm} disabled={!isReady || isConfirming} isLoading={isConfirming}>
                        Capture & Check In
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CheckInModal;
