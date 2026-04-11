import { createContext, useContext, useState, useRef } from 'react';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';

const BulkImportContext = createContext();

export const useBulkImport = () => useContext(BulkImportContext);

export const BulkImportProvider = ({ children }) => {
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkStatus, setBulkStatus] = useState('idle');
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState('');

  // We use a ref to prevent overlapping processes if clicked multiple times
  const isRunning = useRef(false);

  const handleBulkSubmit = async () => {
    if (!bulkRows.length || isRunning.current) return;
    setBulkStatus('loading');
    setBulkResult(null);
    setBulkError('');
    isRunning.current = true;

    let currentRows = [...bulkRows];
    let totalCreated = 0;
    let totalSkipped = 0;
    let totalSubmitted = 0;
    const CHUNK_SIZE = 25; // Processes in fast chunks for visual 'evaporation'

    try {
      while (currentRows.length > 0 && isRunning.current) {
        const chunk = currentRows.slice(0, CHUNK_SIZE);
        const result = await api.post('/students/bulk', { students: chunk });
        
        totalSubmitted += result.submitted || chunk.length;
        totalCreated   += result.created   || 0;
        totalSkipped   += result.skipped   || 0;

        currentRows = currentRows.slice(CHUNK_SIZE);
        setBulkRows([...currentRows]);

        // Small delay guarantees UI paints smoothly and gives continuous animation feedback
        await new Promise(r => setTimeout(r, 60)); 
      }
      setBulkResult({ submitted: totalSubmitted, created: totalCreated, skipped: totalSkipped });
      setBulkStatus('success');
    } catch (err) {
      setBulkError(getUserFriendlyApiError(err, 'Bulk import stopped midway due to an error.'));
      setBulkStatus('error');
      if (totalSubmitted > 0) {
        setBulkResult({ submitted: totalSubmitted, created: totalCreated, skipped: totalSkipped });
      }
    } finally {
      isRunning.current = false;
    }
  };

  const handleClearBulk = () => {
    setBulkRows([]);
    setBulkFileName('');
    setBulkResult(null);
    setBulkStatus('idle');
    setBulkError('');
    isRunning.current = false;
  };

  return (
    <BulkImportContext.Provider value={{
      bulkRows, setBulkRows,
      bulkFileName, setBulkFileName,
      bulkStatus, setBulkStatus,
      bulkResult, setBulkResult,
      bulkError, setBulkError,
      handleBulkSubmit, handleClearBulk
    }}>
      {children}
    </BulkImportContext.Provider>
  );
};
