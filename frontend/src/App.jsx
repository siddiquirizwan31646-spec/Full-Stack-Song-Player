import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import Home from './pages/Home'
import Hero from './components/ui/Hero'
import Signup from './pages/Signup'
import ForgotPassword from "./pages/ForgotPassword"
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import Verify from './pages/Verify'
import ChangePassword from './pages/ChangePassword'
import Upload from './pages/Upload'
import Naat from './pages/Naat'
import Quran from './pages/Quran'
import Qawwali from './pages/Qawwali'
import Nasheed from './pages/Nasheed'
import Podcasts from './pages/Podcasts'
import VerifyOTP from './pages/verifyOTP'
import Playlist from './pages/playlist'
import Favorite from './pages/Favorite'
import IslamicNewsSection from './pages/exprole'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ui/ProtectedRoute'
import Setting from './components/ui/Setting'

const router = createBrowserRouter([
    { path: '/', element: <Home /> },
    { path: '/signup', element: <Signup /> },
    { path: '/verify', element: <Navigate to="/verify-email" replace /> },
    { path: '/verify-email', element: <VerifyEmail /> },
    { path: '/verify/:token', element: <Verify /> },
    { path: '/login', element: <Login /> },
    { path: '/nasheed', element: <Nasheed /> },
    { path: '/podcasts', element: <Podcasts /> },
    { path: '/qawwali', element: <Qawwali /> },
    { path: '/quran', element: <Quran /> },
    { path: '/favorites', element: <Favorite /> },
    {
        path: '/explore',
        element: (
            <ProtectedRoute>
                <IslamicNewsSection />
            </ProtectedRoute>
        ),
    },
    {
        path: '/playlists',
        element: (
            <ProtectedRoute>
                <Playlist />
            </ProtectedRoute>
        ),
    },
    {
        path: '/settings',
        element: (
            <ProtectedRoute>
                <Setting />
            </ProtectedRoute>
        ),
    },
    {
        path: '/profile',
        element: (
            <ProtectedRoute>
                <Profile />
            </ProtectedRoute>
        ),
    },
    { path: '/ForgotPassword', element: <ForgotPassword /> },
    { path: '/forgot-password', element: <ForgotPassword /> },
    { path: '/verify-OTP/:email', element: <VerifyOTP /> },
    { path: '/verify-otp/:email', element: <VerifyOTP /> },
    {
        path: '/upload',
        element: (
            <ProtectedRoute>
                <Upload />
            </ProtectedRoute>
        ),
    },
    { path: '/naat', element: <Naat /> },
    { path: '/change-Password/:email', element: <ChangePassword /> },
    { path: '/change-password/:email', element: <ChangePassword /> },
    {
        path: '/hero', 
        element: (
            <ProtectedRoute>
                <Hero />
            </ProtectedRoute>
        ),
    },
])

const App = () => <RouterProvider router={router} />

export default App
