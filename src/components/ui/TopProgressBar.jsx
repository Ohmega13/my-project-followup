import React, { useEffect, useState } from 'react';

export const TopProgressBar = ({ isLoading }) => {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let interval;
        if (isLoading) {
            setVisible(true);
            setProgress(10); // Start immediately

            // Increment slowly up to 90%
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev < 90) {
                        // Slow down as we get closer to 90
                        const diff = 90 - prev;
                        return prev + (diff * 0.1);
                    }
                    return prev;
                });
            }, 200);

        } else {
            // Finish
            if (visible) {
                setProgress(100);
                setTimeout(() => {
                    setVisible(false);
                    setProgress(0);
                }, 400); // Wait for transition
            }
        }

        return () => clearInterval(interval);
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 h-1 z-[9999] pointer-events-none">
            <div
                className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-300 ease-out"
                style={{
                    width: `${progress}%`,
                    opacity: progress === 100 ? 0 : 1,
                    transition: progress === 100 ? 'all 0.4s ease-out' : 'width 0.2s linear'
                }}
            />
        </div>
    );
};
