import React from 'react';
import './LoaderOverlay.css';

const LoaderOverlay = ({ isLoading }) => {
    return (
        isLoading && (
            <div className="loader-overlay">
                <div className="loader"></div>
            </div>
        )
    );
};

export default LoaderOverlay;