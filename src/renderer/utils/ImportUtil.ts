import ExcelJS from 'exceljs';

function getTextSafe(row, columnIndex) {
  // Check if the column index is valid and the cell exists; handle empty cells
  const cell = columnIndex && row.getCell(columnIndex);
  //  console.log("cell", cell)
  if (cell?.value?.richText) {
    return cell?.value?.richText?.map((i) => i.text).join();
  }
  return cell ? cell.value || '' : ''; // Ensure empty cells return empty string
}


async function readExcelAndBuildJson(buffer) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch (e) {
    console.error('Failed to read the Excel file:', e);
    return;
  }

  const subtitles = [];
  workbook.eachSheet((sheet, id) => {
    console.log('Sheet name:', sheet.name);
    const columns = {};
    const headerRow = sheet.getRow(1);
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (cell && cell.text) {
        const header = cell.text.trim().toUpperCase();
        if (header.includes('FR')) columns['french'] = colNumber;
        else if (header.includes('EN')) columns['english'] = colNumber;
        else if (header.includes('AR')) columns['arabic'] = colNumber;
      }
    });

    sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber > 1) {
        // Skipping header row
        subtitles.push({
          id: subtitles.length + 1,
          english: getTextSafe(row, columns['english']),
          french: getTextSafe(row, columns['french']),
          arabic: getTextSafe(row, columns['arabic']),
          isNew: false,
        });
      }
    });
  });

  return subtitles
}

export default readExcelAndBuildJson;
