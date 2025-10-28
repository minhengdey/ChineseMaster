// no React hooks used directly here; routes rely on global store
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
import FlashcardsIndex, { FlashcardsCurriculum } from "./pages/FlashcardsPage";
import FlashCardsLessonPage from "./pages/FlashCardsLessonPage";
import SpeakingPracticePage from "./pages/SpeakingPracticePage";
import PronunciationPage from "./pages/PronunciationPage";
import ProfilePage from "./pages/ProfilePage";
import AlphabetPage from "./pages/AlphabetPage";
import Login from "./pages/LoginPage/index";
import AdminDashboard from "./pages/AdminDashboard";

import "./App.css";
import { authAPI } from "./services/api";
import ProtectedRoute from "./components/ProtectedRoute";

import { useUserStore } from "./store/UserStore";

function App() {
   // Use global user store so admin role is available immediately
   const storeUser = useUserStore((s) => s.user);
   const user = storeUser; // keep compatible name used by ProfilePage prop

   return (
      <Router>
         <div className="min-h-screen bg-base-100">
            <Routes>
               {/* If admin, expose only admin routes */}
               {user && user.role === "ROLE_ADMIN" ? (
                  <Route
                     element={
                        <ProtectedRoute>
                           <Navbar />
                        </ProtectedRoute>
                     }
                  >
                     <Route index element={<AdminDashboard />} />
                     <Route path="admin" element={<AdminDashboard />} />
                     <Route path="profile" element={<ProfilePage user={user} />} />
                  </Route>
               ) : (
                  <Route
                     element={
                        <ProtectedRoute>
                           <Navbar />
                        </ProtectedRoute>
                     }
                  >
                     <Route index element={<HomePage />} />
                     <Route path="curriculum" element={<CurriculumPage />} />
                     <Route
                        path="curriculum/:curriculumId/lessons"
                        element={<LessonsPage />}
                     />
                     <Route
                        path="curriculum/:curriculumId/lesson/:lessonId"
                        element={<LessonDetailPage />}
                     />
                     <Route
                        path="curriculum/:curriculumId/lesson/:lessonId/practice"
                        element={<VocabularyPracticePage />}
                     />
                     <Route
                        path="/flashcard/:curriculumId/lesson/:lessonId"
                        element={<FlashCardsLessonPage />}
                     />
                     <Route path="flashcards" element={<FlashcardsIndex />} />
                     <Route path="flashcards/:curriculumId" element={<FlashcardsCurriculum />} />
                     <Route
                        path="curriculum/:curriculumId/lesson/:lessonId/speaking"
                        element={<SpeakingPracticePage />}
                     />
                     {/* Legacy routes */}
                     <Route
                        path="lessons"
                        element={<Navigate to="/curriculum" replace />}
                     />
                     <Route
                        path="lesson/:id"
                        element={
                           <Navigate to="/curriculum/1/lesson/:id" replace />
                        }
                     />
                     <Route path="pronunciation" element={<PronunciationPage />} />
                     <Route path="alphabet" element={<AlphabetPage />} />
                     <Route path="profile" element={<ProfilePage user={user} />} />
                     <Route path="admin" element={<AdminDashboard />} />
                     <Route
                        path="/curriculum/:curriculumId/lesson/:lessonId/speaking"
                        element={<SpeakingPracticePage />}
                     />
                     {/* Daily mixed speaking practice (from Pronunciation tab) */}
                     <Route
                        path="/speaking/daily"
                        element={<SpeakingPracticePage />}
                     />
                  </Route>
               )}

               <Route path="/login" element={<Login />} />
               <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
         </div>
      </Router>
   );
}

export default App;
