/* eslint-disable promise/always-return */
import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface AppState {
  subtitles: any[];
  videoPath?: string;
}

interface GlobalContextProps {
  state: AppState;
  updateSubtitles: (newState:  any[]) => void;
  updateVideoPath: (newState: string) => void;
}

export const GlobalContext = createContext<GlobalContextProps | undefined>(
  undefined,
);

interface ProviderProps {
  children: ReactNode;
}

const initialState: AppState = {
  subtitles: [],
  videoPath: undefined,
};

export const GlobalProvider: React.FC<ProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    window.electron.ipcRenderer.getAppState().then((savedState: AppState) => {
      if (savedState) {
        setState(savedState);
      }
    });
  }, []);

  const updateSubtitles = (subtitles: any[]) => {
    setState((prevState) => {
      const updatedState = { ...prevState, subtitles };
      window.electron.ipcRenderer.setAppState(updatedState); // Salva su disco tramite IPC
      return updatedState;
    });
  };

  const updateVideoPath = (videoPath: string) => {
    setState((prevState) => {
      const updatedState = { ...prevState, videoPath };
      window.electron.ipcRenderer.setAppState(updatedState); // Salva su disco tramite IPC
      return updatedState;
    });
  };

  return (
    <GlobalContext.Provider value={{ state, updateSubtitles , updateVideoPath }}>
      {children}
    </GlobalContext.Provider>
  );
};
