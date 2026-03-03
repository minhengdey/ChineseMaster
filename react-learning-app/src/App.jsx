import { useState, useEffect, lazy, Suspense } from "react";
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
import VocabularyPracticePage from "./pages/VocabularyPracticePage";
import PronunciationPage from "./pages/PronunciationPage";
import AssessmentsListPage from "./pages/AssessmentsListPage";
import Login from "./pages/LoginPage/index";
import RoleGuard from "./components/RoleGuard";
import "./App.css";
import ProtectedRoute from "./components/ProtectedRoute";
import { useUserStore } from "./store/UserStore";
import { ROUTES } from "./constants/routes";

const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const ClassManagementPage = lazy(() => import("./pages/ClassManagementPage"));
const LessonDetailPage = lazy(() => import("./pages/LessonDetailPage"));
const FlashcardsIndex = lazy(() => import("./pages/FlashcardsPage").then((m) => ({ default: m.default })));
const FlashcardsCurriculum = lazy(() => import("./pages/FlashcardsPage").then((m) => ({ default: m.FlashcardsCurriculum })));
const FlashCardsLessonPage = lazy(() => import("./pages/FlashCardsLessonPage"));
const SpeakingPracticePage = lazy(() => import("./pages/SpeakingPracticePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AlphabetPage = lazy(() => import("./pages/AlphabetPage"));
const AssessmentTestPage = lazy(() => import("./pages/AssessmentTestPage"));

const PageFallback = () => (
   <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
      <span className="loading loading-spinner loading-lg text-purple-500" />
   </div>
);

function App() {
   const [user, setUser] = useState(null);
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const storeUser = useUserStore((state) => state.user);

   useEffect(() => {
      // No localStorage - authentication is handled by httpOnly cookie
      // ProtectedRoute will verify token and fetch user when needed
   }, []);

   return (
      <Router>
         <div className="min-h-screen bg-base-100">
            <Suspense fallback={<PageFallback />}>
            <Routes>
               <Route
                  element={
                     <ProtectedRoute>
                        <RoleGuard allowedRoles={["USER"]} redirectTo="/admin">
                           <Navbar />
                        </RoleGuard>
                     </ProtectedRoute>
                  }
               >
                  <Route index element={<HomePage />} />
                  <Route path="curriculum" element={<CurriculumPage />} />
                  <Route
                     path="curriculum/:curriculumId/lessons"
                     element={<LessonsPage />}
                  />
                  <Route path="assessments" element={<AssessmentsListPage />} />
                  <Route
                     path="curriculum/:curriculumId/lesson/:lessonId"
                     element={<LessonDetailPage />}
                  />
                  <Route
                     path="assessment/:assessmentId"
                     element={<AssessmentTestPage />}
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
                  <Route
                     path="flashcards/:curriculumId"
                     element={<FlashcardsCurriculum />}
                  />
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
                     element={<Navigate to="/curriculum/1/lesson/:id" replace />}
                  />
                  <Route path="pronunciation" element={<PronunciationPage />} />
                  <Route path="alphabet" element={<AlphabetPage />} />
                  <Route path="profile" element={<ProfilePage user={user} />} />
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

               <Route
                  element={
                     <ProtectedRoute>
                        <RoleGuard allowedRoles={["ADMIN"]} redirectTo="/">
                           <Navbar />
                        </RoleGuard>
                     </ProtectedRoute>
                  }
               >
                  <Route path="admin" element={<AdminDashboardPage />} />
                  <Route path="admin/classes" element={<ClassManagementPage />} />
               </Route>

               <Route path={ROUTES.LOGIN} element={<Login />} />
               <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
         </div>
      </Router>
   );
}

export default App;
