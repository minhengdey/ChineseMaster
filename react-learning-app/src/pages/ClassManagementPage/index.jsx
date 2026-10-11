import { useEffect, useState } from "react";
import { classAPI, adminUserAPI, handleApiError } from "../../services/api";
import { useUserStore } from "../../store/UserStore";
import { UserMinus } from "lucide-react";
import PageLayout from "../../components/layout/PageLayout";
import Modal from "./components/Modal";
import ClassCard from "./components/ClassCard";
import SearchBar from "./components/SearchBar";
import ScoreStatsModal from "./components/ScoreStatsModal";

// Cache + in-flight: chỉ gọi classes + users 1 lần khi vào trang
const _classPageCache = { classes: null, users: null };
const _classPageInFlight = { promise: null };

const ClassManagementPage = () => {
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
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

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

    // Load classes + users một lần (cache + in-flight dedupe)
    useEffect(() => {
        if (!user || user.role !== "ADMIN") return;
        let mounted = true;
        setLoading(true);
        const run = async () => {
            if (_classPageCache.classes != null && _classPageCache.users != null) {
                setClasses(_classPageCache.classes);
                setAllUsers(_classPageCache.users);
                setLoading(false);
                setError(null);
                return;
            }
            if (_classPageInFlight.promise) {
                try {
                    const r = await _classPageInFlight.promise;
                    if (mounted && r) {
                        setClasses(r.classes ?? []);
                        setAllUsers(r.users ?? []);
                        setError(null);
                    }
                } catch (err) {
                    if (mounted) setError(handleApiError(err));
                } finally {
                    if (mounted) setLoading(false);
                }
                return;
            }
            _classPageInFlight.promise = (async () => {
                try {
                    const [classesData, usersData] = await Promise.all([
                        classAPI.getAll(),
                        adminUserAPI.listUsers(),
                    ]);
                    const classesList = Array.isArray(classesData) ? classesData : [];
                    const usersList = (Array.isArray(usersData) ? usersData : []).filter(u => u.role !== "ADMIN");
                    _classPageCache.classes = classesList;
                    _classPageCache.users = usersList;
                    if (mounted) {
                        setClasses(classesList);
                        setAllUsers(usersList);
                        setError(null);
                    }
                    return { classes: classesList, users: usersList };
                } catch (err) {
                    if (mounted) setError(handleApiError(err));
                    throw err;
                } finally {
                    _classPageInFlight.promise = null;
                    if (mounted) setLoading(false);
                }
            })();
            await _classPageInFlight.promise;
        };
        run();
        return () => { mounted = false; };
    }, [user?.role]);

    const loadClasses = async () => {
        try {
            setLoading(true);
            const data = await classAPI.getAll();
            const list = Array.isArray(data) ? data : [];
            _classPageCache.classes = list;
            setClasses(list);
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
            const list = (Array.isArray(data) ? data : []).filter(u => u.role !== "ADMIN");
            _classPageCache.users = list;
            setAllUsers(list);
        } catch (err) {
            console.error("Failed to load users:", err);
        }
    };

    // Debounce search: khi rỗng dùng lại cache, khi có chữ gọi search API
    useEffect(() => {
        const t = setTimeout(() => {
            if (!searchQuery.trim()) {
                if (_classPageCache.classes != null) setClasses(_classPageCache.classes);
                return;
            }
            let mounted = true;
            (async () => {
                try {
                    setLoading(true);
                    const data = await classAPI.search(searchQuery.trim());
                    if (mounted) setClasses(Array.isArray(data) ? data : []), setError(null);
                } catch (err) {
                    if (mounted) setError(handleApiError(err));
                } finally {
                    if (mounted) setLoading(false);
                }
            })();
        }, 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadClasses();
            return;
        }
        try {
            setLoading(true);
            const data = await classAPI.search(searchQuery.trim());
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

    const openStatsModal = (classItem) => {
        setSelectedClass(classItem);
        setIsStatsModalOpen(true);
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
            <PageLayout>
                <div className="flex items-center justify-center min-h-48">
                    <span className="loading loading-spinner loading-lg text-purple-500" />
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Quản lý lớp học</h1>
                </div>

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {success}
                    </div>
                )}

                <SearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onSearch={handleSearch}
                    onCreateClass={() => setIsCreateModalOpen(true)}
                />

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((classItem) => (
                        <ClassCard
                            key={classItem.id}
                            classItem={classItem}
                            onViewMembers={openViewMembersModal}
                            onStats={openStatsModal}
                            onAddMember={openAddMemberModal}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>

                {classes.length === 0 && !loading && (
                    <div className="text-center py-12 rounded-xl bg-slate-50 border border-slate-200">
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

            {isStatsModalOpen && selectedClass && (
                <ScoreStatsModal
                    classId={selectedClass.id}
                    className={selectedClass.name}
                    onClose={() => setIsStatsModalOpen(false)}
                />
            )}
        </PageLayout>
    );
};

export default ClassManagementPage;
