import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { BookDetails } from "./BookDetails";
import { BookPage } from "./BookPage";
import { CharactersPage } from "./CharactersPage";
import { DataPage } from "./DataPage";
import { Header } from "./Header";
import { HomePage } from "./HomePage";
import { LocationsPage } from "./LocationsPage";
import { PlotBoard } from "./PlotBoard";
import { SceneEditor } from "./SceneEditor";
import { WorkspaceProvider } from "./WorkspaceProvider";

/**
 * Root component. Uses hash routing so the static build works on GitHub Pages
 * without server-side rewrites.
 */
export function App() {
  return (
    <HashRouter>
      <Header />
      <main>
        <WorkspaceProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/data" element={<DataPage />} />
            <Route path="/book/:bookId" element={<BookPage />}>
              <Route index element={<Navigate to="plot" replace />} />
              <Route path="plot" element={<PlotBoard />} />
              <Route path="scene/:sceneId" element={<SceneEditor />} />
              <Route path="characters/:entityId?" element={<CharactersPage />} />
              <Route path="locations/:entityId?" element={<LocationsPage />} />
              <Route path="details" element={<BookDetails />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WorkspaceProvider>
      </main>
    </HashRouter>
  );
}
