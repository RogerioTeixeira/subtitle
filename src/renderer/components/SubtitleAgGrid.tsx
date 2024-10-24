import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import {
  ColDef,
  ModuleRegistry,
  RowSelectedEvent,
} from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { GridApi } from 'ag-grid-community';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';
import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface IRow {
  id: string;
  start: number | null;
  end: number | null;
  english: string;
  french: string;
  arabic: string;
}

interface Props {
  subtitles: IRow[];
  videoPlayerRef: React.RefObject<any>; // Riferimento al VideoPlayer
}

const SubtitleAgGrid = forwardRef(
  ({ subtitles, videoPlayerRef }: Props, ref) => {
    const gridRef = useRef<AgGridReact<IRow>>(null); // Riferimento alla griglia
    const [gridApi, setGridApi] = useState<GridApi | null>(null); // Stato per mantenere il riferimento al GridApi
    const [buttonLabel, setButtonLabel] = useState<string>('Show'); // Label del pulsante

    // Stato per le lingue selezionate nella select
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
      'english',
      'french',
      'arabic',
    ]);

    const [colDefs] = useState<ColDef<IRow>[]>([
      { field: 'id', width: 60 },
      { field: 'start', width: 80 },
      { field: 'end', width: 80 },
      { field: 'english', headerName: 'English', flex: 1 },
      { field: 'french', headerName: 'French', flex: 1 },
      { field: 'arabic', headerName: 'Arabic', flex: 1 },
    ]);

    // Funzione per ottenere la riga selezionata direttamente dall'API
    const getSelectedRowNode = (): any => {
      if (!gridApi) {
        console.error('Grid API non disponibile');
        return null;
      }
      const selectedNodes = gridApi.getSelectedNodes();
      return selectedNodes?.length ? selectedNodes[0] : null;
    };

    // Gestire l'inizializzazione della griglia e salvare l'API quando è pronta
    const onGridReady = (params: any) => {
      setGridApi(params.api); // Salva l'API della griglia
    };

    // Funzione per gestire l'evento di selezione riga
    const onRowSelected = (event: RowSelectedEvent) => {
      if (event.node.isSelected()) {
        const selectedNode = event.node;
        console.log('event', selectedNode?.data);
        if (selectedNode?.data?.start) {
          setButtonLabel('Show Next'); // Se c'è già un timestamp di start, mostra "Show Next"
        } else {
          setButtonLabel('Show'); // Altrimenti, mostra "Show"
        }
      }
    };

    // Funzione per aggiungere il timestamp di inizio e visualizzare i sottotitoli
    const handleShow = () => {
      const selectedNode = getSelectedRowNode();
      if (selectedNode && videoPlayerRef.current) {
        const currentTime = videoPlayerRef.current.getCurrentTime();
        const startTime = currentTime.toFixed(2);
        const temporaryEndTime = (currentTime + 60).toFixed(2); // Solo per visualizzare nel video, non nella tabella

        selectedNode.setDataValue('start', startTime); // Aggiungi il timestamp di inizio nella tabella

        // Aggiungi i sottotitoli alla traccia corretta solo per la visualizzazione
        videoPlayerRef.current.addSubtitle(
          'english',
          startTime,
          temporaryEndTime,
          selectedNode.data.english,
        );
        videoPlayerRef.current.addSubtitle(
          'french',
          startTime,
          temporaryEndTime,
          selectedNode.data.french,
        );
        videoPlayerRef.current.addSubtitle(
          'arabic',
          startTime,
          temporaryEndTime,
          selectedNode.data.arabic,
        );

        setButtonLabel('Show Next'); // Aggiorna la label a "Show Next"
      }
    };

    // Funzione per aggiungere timestamp di fine e avanzare alla riga successiva
    const handleShowNext = () => {
      const selectedNode = getSelectedRowNode();
      if (selectedNode && videoPlayerRef.current) {
        const currentTime = videoPlayerRef.current.getCurrentTime();
        const endTime = currentTime.toFixed(2);

        // Imposta il timestamp di fine solo nella tabella (valore reale)
        selectedNode.setDataValue('end', endTime);

        // Aggiorna il sottotitolo corrente con il nuovo endTime nel video player
        videoPlayerRef.current.updateSubtitleEndTime(
          'english',
          parseFloat(selectedNode.data.start),
          endTime,
        );
        videoPlayerRef.current.updateSubtitleEndTime(
          'french',
          parseFloat(selectedNode.data.start),
          endTime,
        );
        videoPlayerRef.current.updateSubtitleEndTime(
          'arabic',
          parseFloat(selectedNode.data.start),
          endTime,
        );

        // Passa alla riga successiva
        if (gridApi) {
          const nextNode = gridApi.getDisplayedRowAtIndex(
            selectedNode.rowIndex + 1,
          );
          if (nextNode) {
            const nextStartTime = currentTime.toFixed(2);
            nextNode.setDataValue('start', nextStartTime); // Imposta solo l'inizio nella tabella
            nextNode.setSelected(true);
            gridApi.ensureNodeVisible(nextNode, 'middle');

            // Visualizza il sottotitolo della riga successiva nel video player (tempo di fine temporaneo)
            videoPlayerRef.current.addSubtitle(
              'english',
              nextStartTime,
              (parseFloat(nextStartTime) + 60).toFixed(2),
              nextNode.data.english,
            );
            videoPlayerRef.current.addSubtitle(
              'french',
              nextStartTime,
              (parseFloat(nextStartTime) + 60).toFixed(2),
              nextNode.data.french,
            );
            videoPlayerRef.current.addSubtitle(
              'arabic',
              nextStartTime,
              (parseFloat(nextStartTime) + 60).toFixed(2),
              nextNode.data.arabic,
            );

            setButtonLabel('Show Next');
          }
        }
      }
    };

    // Funzione per saltare al tempo di inizio della riga selezionata
    const handleJumpToStart = () => {
      const selectedNode = getSelectedRowNode();
      if (selectedNode && selectedNode.data.start && videoPlayerRef.current) {
        const startTime = parseFloat(selectedNode.data.start);
        videoPlayerRef.current.seekToTime(startTime); // Salta al tempo di inizio della riga
      }
    };

    // Funzione per nascondere il sottotitolo senza avanzare alla riga successiva
    const handleHide = () => {
      const selectedNode = getSelectedRowNode();
      if (selectedNode && videoPlayerRef.current) {
        const currentTime = videoPlayerRef.current.getCurrentTime();
        const endTime = currentTime.toFixed(2);

        // Imposta il timestamp di fine solo nella tabella (valore reale)
        selectedNode.setDataValue('end', endTime);

        // Aggiorna il sottotitolo corrente con il nuovo endTime nel video player
        videoPlayerRef.current.updateSubtitleEndTime(
          'english',
          parseFloat(selectedNode.data.start),
          endTime,
        );
        videoPlayerRef.current.updateSubtitleEndTime(
          'french',
          parseFloat(selectedNode.data.start),
          endTime,
        );
        videoPlayerRef.current.updateSubtitleEndTime(
          'arabic',
          parseFloat(selectedNode.data.start),
          endTime,
        );

        // Non avanza alla riga successiva
      }
    };

    // Funzione per rimuovere i sottotitoli per una lingua specifica e un tempo di inizio specifico
    const removeSubtitleCues = (lang, startTime) => {
      videoPlayerRef.current.removeSubtitleCue(lang, startTime);
    };

    // Funzione per resettare il tempo di inizio e fine di una riga
    const handleReset = () => {
      const selectedNode = getSelectedRowNode();
      if (selectedNode && videoPlayerRef.current) {
        const startTime = parseFloat(selectedNode.data.start);

        // Resetta i valori di start ed end nella tabella
        selectedNode.setDataValue('start', null);
        selectedNode.setDataValue('end', null);

        // Rimuovi i sottotitoli per questa riga dal video player
        removeSubtitleCues('english', startTime);
        removeSubtitleCues('french', startTime);
        removeSubtitleCues('arabic', startTime);

        setButtonLabel('Show'); // Resetta la label del pulsante
      }
    };

    // Funzione per gestire la selezione delle lingue
    const handleLanguageChange = (event) => {
      const selected = event.target.value;
      setSelectedLanguages(selected);

      if (gridApi) {
        // Nascondi tutte le colonne
        gridApi.setColumnsVisible(['english', 'french', 'arabic'], false);

        gridApi.setColumnsVisible([...selected], true);
      }
    };

    useImperativeHandle(ref, () => ({
      getGridData: () => {
        const updatedData: IRow[] = [];
        gridApi?.forEachNode((node) => updatedData.push(node.data)); // Ottiene i dati aggiornati della griglia
        return updatedData;
      },
    }));

    return (
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid size={10}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Languages</InputLabel>
              <Select
                multiple
                value={selectedLanguages}
                onChange={handleLanguageChange}
                renderValue={(selected) => selected.join(', ')}
              >
                {['english', 'french', 'arabic'].map((language) => (
                  <MenuItem key={language} value={language}>
                    <Checkbox
                      checked={selectedLanguages.indexOf(language) > -1}
                    />
                    <ListItemText
                      primary={
                        language.charAt(0).toUpperCase() + language.slice(1)
                      }
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <div
            className="ag-theme-quartz"
            style={{ width: '100%', height: '100%' }}
          >
            <AgGridReact
              ref={gridRef}
              rowData={subtitles}
              columnDefs={colDefs}
              rowSelection="single"
              suppressCellFocus
              onGridReady={onGridReady} // Funzione per salvare l'API della griglia quando è pronta
              onRowSelected={onRowSelected} // Evento che aggiorna lo stato del pulsante
              getRowId={(params) => String(params.data.id)}
            />
          </div>
        </Grid>
        <Grid
          size={2}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Stack spacing={2}>
            <Button
              variant="outlined"
              onClick={buttonLabel === 'Show' ? handleShow : handleShowNext}
              sx={{ width: 120 }}
            >
              {buttonLabel}
            </Button>
            <Button variant="outlined" onClick={handleHide} sx={{ width: 120 }}>
              Hide
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              sx={{ width: 120 }}
            >
              Reset
            </Button>
            <Button
              variant="outlined"
              onClick={handleJumpToStart}
              disabled={!getSelectedRowNode()?.data?.start} // Disabilita il pulsante se non c'è uno start time
              sx={{ width: 120 }}
            >
              Go to
            </Button>
            <Button
              variant="outlined"
              onClick={() => console.log('Edit button clicked')}
              sx={{ width: 120 }}
            >
              Edit
            </Button>
          </Stack>
        </Grid>
      </Grid>
    );
  },
);

export default SubtitleAgGrid;
