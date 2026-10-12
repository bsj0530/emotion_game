import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import type { GameSession } from "./types/game";

export default function RootRoute() {
  const [session, setSession] = useState<GameSession | null>(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage onStart={setSession} />} />
        <Route path="/game" element={<GamePage session={session} />} />
      </Routes>
    </BrowserRouter>
  );
}
