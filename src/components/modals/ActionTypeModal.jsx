import React from 'react';
import { Plus, StickyNote } from 'lucide-react';

export default function ActionTypeModal({ isOpen, onClose, date, onSelect, language = "th" }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">
                    {date?.toLocaleDateString('th-TH', { dateStyle: 'full' })}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => onSelect('task')}
                        className="flex flex-col items-center justify-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border-2 border-blue-200 transition-all font-bold"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center">
                            <Plus size={24} />
                        </div>
                        เพิ่มงาน (Task)
                    </button>
                    <button
                        onClick={() => onSelect('note')}
                        className="flex flex-col items-center justify-center gap-3 p-4 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border-2 border-amber-200 transition-all font-bold"
                    >
                        <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center">
                            <StickyNote size={24} />
                        </div>
                        เพิ่มบันทึก (Note)
                    </button>
                </div>
            </div>
        </div>
    );
}
