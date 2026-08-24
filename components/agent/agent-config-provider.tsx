"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { loadConfig, saveConfig, type AgentConfig, DEFAULT_CONFIG } from "@/lib/agent-config";

interface AgentConfigContext {
  config: AgentConfig;
  setConfig: (updater: (c: AgentConfig) => AgentConfig) => void;
  resetConfig: () => void;
}

const AgentConfigContext = createContext<AgentConfigContext | null>(null);

export function useAgentConfig() {
  const ctx = useContext(AgentConfigContext);
  if (!ctx) throw new Error("useAgentConfig must be used within AgentConfigProvider");
  return ctx;
}

export function AgentConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConfigState(loadConfig());
    setHydrated(true);
  }, []);

  const setConfig = useCallback((updater: (c: AgentConfig) => AgentConfig) => {
    setConfigState((prev) => {
      const next = updater(prev);
      saveConfig(next);
      return next;
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState({ ...DEFAULT_CONFIG });
    saveConfig({ ...DEFAULT_CONFIG });
  }, []);

  return (
    <AgentConfigContext.Provider value={{ config, setConfig, resetConfig }}>
      {hydrated ? children : null}
    </AgentConfigContext.Provider>
  );
}