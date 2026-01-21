import React, { useState, useEffect } from 'react';
import { Settings, Calculator, MousePointerClick } from 'lucide-react';

export default function ProjectModal({ isOpen, onClose, onSave, project, folders = [] }) {
    const [formData, setFormData] = useState({
        name: '',
        client: '',
        deadline: '',
        folder: '',
        statusMode: 'auto', // 'auto' | 'manual'
        manualStatus: 'In Progress'
    });

    useEffect(() => {
        if (isOpen) {
            if (project) {
                // Determine if AUTO based on special flag or value
                // We assume App.jsx will pass _originalStatus if it was computed 
                // OR we check if the raw status is 'AUTO' (if we haven't processed it yet)
                const isAuto = project.status === 'AUTO' || project._originalStatus === 'AUTO';

                setFormData({
                    name: project.name || '',
                    client: project.client || '',
                    deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
                    folder: project.folder || '',
                    statusMode: isAuto ? 'auto' : 'manual',
                    manualStatus: (isAuto || project.status === 'AUTO') ? 'In Progress' : project.status // Default fallback if auto
                });
            } else {
                // New Project Default
                setFormData({
                    name: '',
                    client: '',
                    deadline: '',
                    folder: '',
                    statusMode: 'auto',
                    manualStatus: 'Not Started'
                });
            }
        }
    }, [isOpen, project]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            name: formData.name,
            client: formData.client,
            deadline: formData.deadline,
            folder: formData.folder,
            // If Auto, save 'AUTO'. If Manual, save the specific status.
            status: formData.statusMode === 'auto' ? 'AUTO' : formData.manualStatus
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">{project ? 'แก้ไขโปรเจกต์' : 'เพิ่มโปรเจกต์ใหม่'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อโปรเจกต์</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required autoFocus />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ลูกค้า (Client)</label>
                            <input name="client" value={formData.client} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none" placeholder="ระบุชื่อลูกค้า" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">กำหนดส่ง (Deadline)</label>
                            <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">โฟลเดอร์ (กลุ่มงาน)</label>
                        <input name="folder" value={formData.folder} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none" placeholder="เช่น Development, Marketing (ไม่บังคับ)" list="folder-suggestions" />
                        <datalist id="folder-suggestions">
                            {folders.map(f => (
                                <option key={f.id || f.name} value={f.name} />
                            ))}
                        </datalist>
                    </div>

                    {/* Status Configuration */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Settings size={14} /> ตั้งค่าสถานะโครงการ (Project Status)
                        </h4>

                        <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, statusMode: 'auto' }))}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${formData.statusMode === 'auto' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Calculator size={14} /> อัตโนมัติ (Auto)
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, statusMode: 'manual' }))}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${formData.statusMode === 'manual' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <MousePointerClick size={14} /> เลือกเอง (Manual)
                            </button>
                        </div>

                        {formData.statusMode === 'auto' ? (
                            <div className="text-xs text-slate-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><b>ยังไม่เริ่ม:</b> ไม่มีงานเริ่มทำ และไม่ล่าช้า</li>
                                    <li><b>กำลังดำเนินการ:</b> มีอย่างน้อย 1 งานกำลังทำ</li>
                                    <li><b>ล่าช้า:</b> มีงานที่เลยกำหนดส่ง</li>
                                    <li><b>เสร็จสิ้น:</b> ทุกงานเสร็จสมบูรณ์</li>
                                </ul>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">เลือกสถานะ</label>
                                <select
                                    name="manualStatus"
                                    value={formData.manualStatus}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none bg-white font-medium text-slate-700"
                                >
                                    <option value="Not Started">⚪ ยังไม่เริ่ม (Not Started)</option>
                                    <option value="In Progress">🔵 กำลังดำเนินการ (In Progress)</option>
                                    <option value="Delayed">🔴 ล่าช้า (Delayed)</option>
                                    <option value="Paused">🟠 หยุดชั่วคราว (Paused)</option>
                                    <option value="Cancelled">⚫ ยกเลิก (Cancelled)</option>
                                    <option value="Done">🟢 เสร็จสิ้น (Done)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">ยกเลิก</button>
                        <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm shadow-blue-200">
                            {project ? 'บันทึกการแก้ไข' : 'สร้างโปรเจกต์'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
