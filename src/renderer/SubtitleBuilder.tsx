/* eslint-disable react/prop-types */
/* eslint-disable react/function-component-definition */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useRef, useContext } from 'react';
import { Box, Toolbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { PageContainer } from '@toolpad/core/PageContainer';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Button from '@mui/material/Button';
import VideoPlayer from './components/VideoPlayer';
import SubtitleAgGrid from './components/SubtitleAgGrid';

import readExcelAndBuildJson from './utils/ImportUtil';
import { GlobalContext } from './GlobalContext';

function PageToolbar({
  onChangeVideo,
  onChangeSubtitle,
  saveDataGrid,
  exportSubtitle,
}) {
  const handleSelectVideo = async () => {
    // Chiamata all'API esposta per selezionare un file
    const uri = await window.electron.ipcRenderer.selectFile();
    if (uri) {
      onChangeVideo(uri); // Imposta l'URI file:// nel componente
    }
  };

  const handleSubtitlesUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target.result;
      const subtitles = await readExcelAndBuildJson(buffer);
      if (onChangeSubtitle) onChangeSubtitle(subtitles);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSave = () => {
    saveDataGrid();
  };
  const handleNew = () => {};
  const handleExportSubtitles = () => exportSubtitle();

  return (
    <Toolbar sx={{ width: '100%' }}>
      {/* Save button on the left */}
      <Box sx={{ display: 'flex', gap: 2, marginRight: 'auto' }}>
        <Button startIcon={<AddIcon />} color="primary" onClick={handleNew}>
          New
        </Button>

        <Button startIcon={<SaveIcon />} color="primary" onClick={handleSave}>
          Save
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          startIcon={<FileDownloadIcon />}
          color="inherit"
          onClick={handleSelectVideo}
        >
          Import Video
        </Button>

        <input
          accept=".srt, .vtt ,.xls, .xlsx"
          style={{ display: 'none' }}
          id="subtitle-input"
          type="file"
          onChange={handleSubtitlesUpload}
        />
        <label htmlFor="subtitle-input">
          <Button
            startIcon={<FileDownloadIcon />}
            color="inherit"
            component="span"
          >
            Import Subtitle
          </Button>
        </label>

        <Button
          startIcon={<FileUploadIcon />}
          color="inherit"
          onClick={handleExportSubtitles}
        >
          Export Subtitle
        </Button>
      </Box>
    </Toolbar>
  );
}

export default function SubtitleBuilder() {
  const playerRef = useRef(null);
  const context = useContext(GlobalContext);
  const { state, updateSubtitles, updateVideoPath } = context;
  const gridRef = useRef(null);

  const { subtitles, videoPath } = state;

  const exportSubtitle = async () => {
    // Chiamata all'API esposta per selezionare un file
    const uri = await window.electron.ipcRenderer.exportSubtitles(subtitles);
  };

  const handlePlayerReady = (player) => {
    console.log('Player ready:', player);

    // Puoi gestire eventi del player qui, se necessario
    player.on('waiting', () => {
      console.log('Player is waiting');
    });

    player.on('dispose', () => {
      console.log('Player will dispose');
    });
  };

  const onChangeSubtitle = (subtitles) => {
    updateSubtitles(subtitles);
  };

  const onChangeVideo = (url) => {
    updateVideoPath(url);
  };
  const saveDataGrid = () => {
    const newSubtitles = gridRef?.current?.getGridData();
    if (newSubtitles) {
      updateSubtitles(newSubtitles);
    }
  };

  return (
    <PageContainer
      maxWidth={false}
      slotProps={{
        toolbar: {
          onChangeVideo,
          onChangeSubtitle,
          saveDataGrid,
          exportSubtitle,
        },
      }}
      slots={{ toolbar: PageToolbar }}
    >
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Grid container spacing={1} sx={{ height: '50vh' }}>
          <Grid size={6}>
            {/* Passiamo il playerRef al componente SubtitleAgGrid */}
            <SubtitleAgGrid
              ref={gridRef}
              subtitles={subtitles}
              videoPlayerRef={playerRef}
            />
          </Grid>
          <Grid size={6}>
            <VideoPlayer
              ref={playerRef} // Passiamo il ref al player
              src={videoPath}
              type={'video/mp4'}
              onReady={handlePlayerReady} // Funzione chiamata quando il player è pronto
            />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
