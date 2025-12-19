import { ModeToggle } from "./components/mode-toggle";
import { ThemeProvider } from "./components/theme-provider";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import { Search, Database } from "lucide-react";

import { Toaster } from "./components/ui/toaster";
import NotFound from "./NotFound";
import { LectureSeriesManagement } from "./components/LectureSeriesManagement";
import { LectureSeriesDetail } from "./components/LectureSeriesDetail";
import { SearchInterface } from "./components/SearchInterface";
import {
  ExportDataButton,
  ImportDataButton,
} from "./components/DataManagementButtons";

const ACTIVE_NAV = "text-sm font-medium text-primary";
const NON_ACTIVE_NAV =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-primary";

function Navbar() {
  return (
    <div className="sticky top-0 w-full border-b shadow-sm bg-background z-50">
      <div className="container mx-auto flex h-16 items-center px-4">
        <nav className="flex items-center space-x-4 lg:space-x-6">
          <NavLink
            to="/search"
            className={({ isActive }) =>
              isActive ? ACTIVE_NAV : NON_ACTIVE_NAV
            }
          >
            <Search className="mr-2 h-4 w-4 inline" />
            Search
          </NavLink>
          <NavLink
            to="/data"
            className={({ isActive }) =>
              isActive ? ACTIVE_NAV : NON_ACTIVE_NAV
            }
          >
            <Database className="mr-2 h-4 w-4 inline" />
            Data
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center space-x-2">
          <ImportDataButton />
          <ExportDataButton />
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 container mx-auto py-6">
            <Routes>
              <Route path="/" element={<Navigate to="/search" replace />} />
              <Route path="/search" element={<SearchInterface />} />
              <Route path="/data" element={<LectureSeriesManagement />} />
              <Route path="/data/:seriesId" element={<LectureSeriesDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
