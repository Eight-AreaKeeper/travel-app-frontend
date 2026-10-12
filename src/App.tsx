import { Route, Routes } from 'react-router-dom';
import { Nav } from './components/Nav';
import { ToastHost } from './components/Toast';
import { Home } from './pages/Home';
import { Guides } from './pages/Guides';
import { NoteDetail } from './pages/NoteDetail';
import { NoteEditor } from './pages/NoteEditor';
import { Login } from './pages/Login';
import { Customize } from './pages/Customize';
import { Profile } from './pages/Profile';
import { Favorites } from './pages/Favorites';
import { ItineraryResult } from './pages/ItineraryResult';
import { MyTrips } from './pages/MyTrips';

export function App() {
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/guides/:id" element={<NoteDetail />} />
          <Route path="/notes/new" element={<NoteEditor />} />
          <Route path="/customize" element={<Customize />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/itinerary/:planId" element={<ItineraryResult />} />
          <Route path="/trips" element={<MyTrips />} />
        </Routes>
      </main>
      <footer className="site-footer">TravelTicket · Recording every journey, one ticket at a time</footer>
      <ToastHost />
    </>
  );
}
