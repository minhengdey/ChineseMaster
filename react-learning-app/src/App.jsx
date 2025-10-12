import { useState, useEffect } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import CurriculumPage from "./pages/CurriculumPage";
import LessonsPage from "./pages/LessonsPage";
import LessonDetailPage from "./pages/LessonDetailPage";
import VocabularyPracticePage from "./pages/VocabularyPracticePage";
import SpeakingPracticePage from "./pages/SpeakingPracticePage";
import FlashcardsPage from "./pages/FlashcardsPage";
import PronunciationPage from "./pages/PronunciationPage";
import QuizPage from "./pages/QuizPage";
import ProfilePage from "./pages/ProfilePage";
import AlphabetPage from "./pages/AlphabetPage";

import "./App.css";
import { authAPI } from "./services/api";

function App() {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem("accessToken");
        const userData = localStorage.getItem("user");

        if (token && userData) {
            setUser(JSON.parse(userData));
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const handleLogout = () => {
        authAPI.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <Router>
            <div className="min-h-screen bg-base-100">
                {isAuthenticated ? (
                    <>
                        <Navbar user={user} onLogout={handleLogout} />
                        <Routes>
                            <Route
                                path="/"
                                element={<HomePage user={user} />}
                            />
                            <Route path="/curriculum" element={<CurriculumPage />} />
                            <Route
                                path="/curriculum/:curriculumId/lessons"
                                element={<LessonsPage />}
                            />
                            <Route
                                path="/curriculum/:curriculumId/lesson/:lessonId"
                                element={<LessonDetailPage />}
                            />
                            <Route
                                path="/curriculum/:curriculumId/lesson/:lessonId/practice"
                                element={<VocabularyPracticePage />}
                            />
                            <Route
                                path="/curriculum/:curriculumId/lesson/:lessonId/speaking"
                                element={<SpeakingPracticePage />}
                            />
                            {/* Daily mixed speaking practice (from Pronunciation tab) */}
                            <Route
                                path="/speaking/daily"
                                element={<SpeakingPracticePage />}
                            />
                            {/* Legacy routes */}
                            <Route path="/lessons" element={<Navigate to="/curriculum" replace />} />
                            <Route
                                path="/lesson/:id"
                                element={<Navigate to="/curriculum/1/lesson/:id" replace />}
                            />
                            <Route
                                path="/flashcards"
                                element={<FlashcardsPage />}
                            />
                            <Route
                                path="/pronunciation"
                                element={<PronunciationPage />}
                            />
                            <Route
                                path="/alphabet"
                                element={<AlphabetPage />}
                            />
                            <Route path="/quiz" element={<QuizPage />} />
                            <Route
                                path="/profile"
                                element={<ProfilePage user={user} />}
                            />
                            <Route
                                path="*"
                                element={<Navigate to="/" replace />}
                            />
                        </Routes>
                    </>
                ) : (
                    <HomePage onLogin={handleLogin} />
                )}
            </div>
        </Router>
    );
}

export default App;
