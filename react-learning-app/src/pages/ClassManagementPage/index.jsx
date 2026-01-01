import { useEffect, useState } from "react";
import { classAPI, adminUserAPI, handleApiError } from "../../services/api";
import { useUserStore } from "../../store/UserStore";
import { Plus, Edit2, Trash2, Search, Users, X, UserPlus, UserMinus } from "lucide-react";

const ClassManagementPage = () => {
    useEffect(() => {
        localStorage.clear();
        sessionStorage.clear();
    }, []);
    const user = useUserStore((state) => state.user);
    const [classes, setClasses] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [modalSuccess, setModalSuccess] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewMembersModalOpen, setIsViewMembersModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

    // Form data
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedMembers, setSelectedMembers] = useState([]);

    // Check if user is admin
    useEffect(() => {
        if (!user || user.role !== "ADMIN") {
            window.location.href = "/";
        }
    }, [user]);

    // Load classes
    useEffect(() => {
        loadClasses();
        loadAllUsers();
    }, []);

    const loadClasses = async () => {
        try {
            setLoading(true);
            const data = await classAPI.getAll();
            setClasses(data);
            setError(null);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const loadAllUsers = async () => {
        try {
            const data = await adminUserAPI.listUsers();
            setAllUsers(data.filter(u => u.role !== "ADMIN")); // Exclude admins
        } catch (err) {
            console.error("Failed to load users:", err);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadClasses();
            return;
        }
        try {
            setLoading(true);
            const data = await classAPI.search(searchQuery);
            setClasses(data);
            setError(null);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await classAPI.create(formData);
            setIsCreateModalOpen(false);
            setFormData({ name: "", description: "" });
            setSuccess("Tạo lớp học thành công!");
            setTimeout(() => setSuccess(null), 3000);
            loadClasses();
        } catch (err) {
            alert(handleApiError(err));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await classAPI.update(selectedClass.id, formData);
            setIsEditModalOpen(false);
            setFormData({ name: "", description: "" });
            setSelectedClass(null);
            setSuccess("Cập nhật lớp học thành công!");
            setTimeout(() => setSuccess(null), 3000);
            loadClasses();
        } catch (err) {
            alert(handleApiError(err));
        }
    };

    const handleDelete = async (classId) => {
        if (!confirm("Bạn có chắc muốn xóa lớp học này?")) return;
        try {
            await classAPI.delete(classId);
            setSuccess("Xóa lớp học thành công!");
            setTimeout(() => setSuccess(null), 3000);
            loadClasses();
        } catch (err) {
            alert(handleApiError(err));
        }
    };

    const openEditModal = (classItem) => {
        setSelectedClass(classItem);
        setFormData({ name: classItem.name, description: classItem.description || "" });
        setIsEditModalOpen(true);
    };

    const openViewMembersModal = async (classItem) => {
        setSelectedClass(classItem);
        setIsViewMembersModalOpen(true);
    };

    const openAddMemberModal = (classItem) => {
        setSelectedClass(classItem);
        setSelectedMembers([]);
        setIsAddMemberModalOpen(true);
    };

    const handleAddMembers = async () => {
        if (selectedMembers.length === 0) return;
        try {
            if (selectedMembers.length === 1) {
                await classAPI.addMember(selectedClass.id, selectedMembers[0]);
            } else {
                await classAPI.addMultipleMembers(selectedClass.id, selectedMembers);
            }
            setIsAddMemberModalOpen(false);
            setSelectedMembers([]);
            setSuccess(`Đã thêm ${selectedMembers.length} học viên vào lớp!`);
            setTimeout(() => setSuccess(null), 3000);
            loadClasses();
        } catch (err) {
            alert(handleApiError(err));
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm("Bạn có chắc muốn xóa học viên này khỏi lớp?")) return;
        try {
            await classAPI.removeMember(selectedClass.id, userId);
            setModalSuccess("Đã xóa học viên khỏi lớp!");
            setTimeout(() => setModalSuccess(null), 3000);
            loadClasses();
            // Refresh members if modal is still open
            if (isViewMembersModalOpen) {
                const updated = await classAPI.getById(selectedClass.id);
                setSelectedClass(updated);
            }
        } catch (err) {
            alert(handleApiError(err));
        }
    };

    const toggleMemberSelection = (userId) => {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Get available users (not already in the class)
    const getAvailableUsers = () => {
        if (!selectedClass) return [];
        const memberIds = selectedClass.members?.map(m => m.userId) || [];
        return allUsers.filter(u => !memberIds.includes(u.id));
    };

    if (loading && classes.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Quản lý lớp học</h1>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {success}
                    </div>
                )}

                {/* Search and Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                placeholder="Tìm kiếm lớp học..."
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                            />
                            <button
                                onClick={handleSearch}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                            >
                                <Search size={18} /> Tìm kiếm
                            </button>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 justify-center"
                        >
                            <Plus size={18} /> Tạo lớp mới
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Classes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((classItem) => (
                        <div key={classItem.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-800 mb-1">{classItem.name}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-2">{classItem.description || "Không có mô tả"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-slate-600 mb-4">
                                    <Users size={18} className="text-purple-600" />
                                    <span className="text-sm font-medium">{classItem.memberCount || 0} học viên</span>
                                </div>

                                <div className="text-xs text-slate-400 mb-4">
                                    Tạo: {new Date(classItem.createdAt).toLocaleDateString("vi-VN")}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openViewMembersModal(classItem)}
                                        className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition text-sm font-medium"
                                    >
                                        Xem học viên
                                    </button>
                                    <button
                                        onClick={() => openAddMemberModal(classItem)}
                                        className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                                        title="Thêm học viên"
                                    >
                                        <UserPlus size={18} />
                                    </button>
                                    <button
                                        onClick={() => openEditModal(classItem)}
                                        className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                        title="Sửa"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(classItem.id)}
                                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                        title="Xóa"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {classes.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📚</div>
                        <p className="text-slate-600 text-lg">Chưa có lớp học nào</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <Modal title="Tạo lớp học mới" onClose={() => setIsCreateModalOpen(false)}>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tên lớp *</label>
                            <input
                                type="text"
                                required
                                minLength={3}
                                maxLength={100}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
                            <textarea
                                maxLength={500}
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Tạo lớp
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <Modal title="Chỉnh sửa lớp học" onClose={() => setIsEditModalOpen(false)}>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tên lớp *</label>
                            <input
                                type="text"
                                required
                                minLength={3}
                                maxLength={100}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
                            <textarea
                                maxLength={500}
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Cập nhật
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* View Members Modal */}
            {isViewMembersModalOpen && selectedClass && (
                <Modal
                    title={`Học viên lớp ${selectedClass.name}`}
                    onClose={() => {
                        setIsViewMembersModalOpen(false);
                        setModalSuccess(null);
                    }}
                    wide
                >
                    {modalSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {modalSuccess}
                        </div>
                    )}
                    <div className="mb-4">
                        <p className="text-slate-600">Tổng số: <span className="font-bold text-purple-600">{selectedClass.members?.length || 0}</span> học viên</p>
                    </div>

                    {selectedClass.members && selectedClass.members.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full">
                                <thead className="bg-purple-100 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tên</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {selectedClass.members.map((member) => (
                                        <tr key={member.userId} className="border-b border-slate-100 hover:bg-purple-50">
                                            <td className="px-4 py-3 text-sm">{member.name || "N/A"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{member.email}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleRemoveMember(member.userId)}
                                                    className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-sm"
                                                >
                                                    <UserMinus size={16} className="inline" /> Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            Lớp học chưa có học viên nào
                        </div>
                    )}
                </Modal>
            )}

            {/* Add Members Modal */}
            {isAddMemberModalOpen && selectedClass && (
                <Modal
                    title={`Thêm học viên vào lớp ${selectedClass.name}`}
                    onClose={() => setIsAddMemberModalOpen(false)}
                    wide
                >
                    <div className="mb-4">
                        <p className="text-sm text-slate-600">Đã chọn: <span className="font-bold text-blue-600">{selectedMembers.length}</span> học viên</p>
                    </div>

                    {getAvailableUsers().length > 0 ? (
                        <div className="max-h-96 overflow-y-auto mb-4">
                            <table className="w-full">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Chọn</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tên</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getAvailableUsers().map((user) => (
                                        <tr
                                            key={user.id}
                                            className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${selectedMembers.includes(user.id) ? "bg-blue-50" : ""
                                                }`}
                                            onClick={() => toggleMemberSelection(user.id)}
                                        >
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMembers.includes(user.id)}
                                                    onChange={() => { }}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm">{user.name || "N/A"}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 mb-4">
                            Không còn người dùng nào để thêm
                        </div>
                    )}

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => setIsAddMemberModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleAddMembers}
                            disabled={selectedMembers.length === 0}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Thêm ({selectedMembers.length})
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// Modal Component
const Modal = ({ title, children, onClose, wide = false }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-xl shadow-xl ${wide ? "max-w-4xl" : "max-w-md"} w-full max-h-[90vh] overflow-y-auto`}>
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ClassManagementPage;
