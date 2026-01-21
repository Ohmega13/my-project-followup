import React from 'react';

export const ProgressBar = ({ percent }) => {
    let color = "bg-blue-500";
    if (percent === 100) color = "bg-green-500";
    else if (percent < 30) color = "bg-yellow-500";

    return (
        <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div
                className={`${color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${percent}%` }}
            ></div>
        </div>
    );
};
