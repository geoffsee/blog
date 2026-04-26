import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Post from './pages/Post';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="posts/:slug" element={<Post />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
