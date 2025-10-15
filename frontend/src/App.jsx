import React from 'react';
import { Switch, Route } from "wouter";
import LandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import StartDemo from "./pages/StartDemo";
import AgentPage from "./pages/Agent";

function Router() {
  return (
    <div>
      <Navbar />
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/start" component={StartDemo} />
    <Route path="/agent" component={AgentPage} />
      </Switch>
    </div>
  );
}

function App() {
  return <Router />;
}

export default App;
