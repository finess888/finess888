/**
 * แผนการกิน (Finess Meal & Nutrition Management) Backend API
 * Google Apps Script
 * Connected to Spreadsheet: 1yP5DwepfHxGoP0_OYx3zTXZTEdijbIt0aQj_1wTPuGs
 */

const SPREADSHEET_ID = '1yP5DwepfHxGoP0_OYx3zTXZTEdijbIt0aQj_1wTPuGs';

const SHEET_FOOD_DB = 'A หน้าเก็บเมนูอาหาร';
const SHEET_DAILY_LOG = 'B หน้าจดบันทึก';
const SHEET_DASHBOARD = 'C หน้าแสดงผลลัพธ์รายวัน';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function doGet(e) {
  try {
    const ss = getSpreadsheet();
    const sheets = ss.getSheets();
    const sheetSummaries = sheets.map(s => {
      const lastRow = s.getLastRow();
      const lastCol = s.getLastColumn();
      let headers = [];
      let sample = [];
      if (lastRow > 0 && lastCol > 0) {
        const data = s.getRange(1, 1, Math.min(lastRow, 10), lastCol).getValues();
        headers = data[0] || [];
        sample = data.slice(1);
      }
      return {
        name: s.getName(),
        id: s.getSheetId(),
        rows: lastRow,
        cols: lastCol,
        headers: headers,
        sample: sample
      };
    });

    return createJsonResponse({
      status: 'success',
      service: 'Finess Meal Plan API',
      spreadsheetName: ss.getName(),
      sheets: sheetSummaries,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'Empty request body' });
    }

    const contents = JSON.parse(e.postData.contents);
    const { action, payload = {}, passcode } = contents;

    if (!action) {
      return createJsonResponse({ status: 'error', message: 'Missing action field' });
    }

    // 1. Passcode verification endpoint
    if (action === 'VERIFY_PASSCODE') {
      const configuredPasscode = PropertiesService.getScriptProperties().getProperty('APP_PASSCODE') || '1234';
      const codeToVerify = String(payload.passcode !== undefined ? payload.passcode : passcode || '').trim();
      const isValid = (configuredPasscode === 'NONE') || (codeToVerify === configuredPasscode);
      return createJsonResponse({
        status: 'success',
        data: { valid: isValid }
      });
    }

    // 2. Passcode verification
    const configuredPasscode = PropertiesService.getScriptProperties().getProperty('APP_PASSCODE') || '1234';
    if (configuredPasscode && configuredPasscode !== 'NONE') {
      const reqPass = String(passcode || '').trim();
      if (reqPass !== configuredPasscode) {
        return createJsonResponse({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'รหัสผ่านไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่'
        });
      }
    }

    const ss = getSpreadsheet();
    let result;

    switch (action) {
      case 'GET_INITIAL_DATA': {
        result = handleGetInitialData(ss);
        break;
      }
      case 'ADD_MEAL': {
        result = handleAddMeal(ss, payload);
        break;
      }
      case 'ADD_FOOD_ITEM': {
        result = handleAddFoodItem(ss, payload);
        break;
      }
      case 'ADD_WEIGHT_LOG': {
        result = handleAddWeightLog(ss, payload);
        break;
      }
      case 'SAVE_SETTINGS': {
        if (payload.newPasscode) {
          PropertiesService.getScriptProperties().setProperty('APP_PASSCODE', String(payload.newPasscode).trim());
        }
        result = { success: true };
        break;
      }
      default:
        return createJsonResponse({ status: 'error', message: 'Unknown action: ' + action });
    }

    return createJsonResponse({ status: 'success', data: result });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function handleGetInitialData(ss) {
  // 1. Food Database from 'A หน้าเก็บเมนูอาหาร'
  const foods = [];
  const foodSheet = ss.getSheetByName(SHEET_FOOD_DB) || ss.getSheets()[0];
  if (foodSheet && foodSheet.getLastRow() >= 4) {
    const data = foodSheet.getRange(4, 1, foodSheet.getLastRow() - 3, Math.min(foodSheet.getLastColumn(), 10)).getValues();
    data.forEach((row, i) => {
      if (row[2] && String(row[2]).trim() !== '') {
        foods.push({
          id: String(row[0] || 'F-' + (i + 1)),
          code: String(row[0] || ''),
          category: String(row[1] || 'ทั่วไป'),
          name: String(row[2] || ''),
          servingSize: String(row[3] || '1 เสิร์ฟ'),
          calories: Number(row[4] || 0),
          protein: Number(row[5] || 0),
          carbs: Number(row[6] || 0),
          fat: Number(row[7] || 0),
          targetGroup: String(row[8] || 'ทั้งคู่'),
          notes: String(row[9] || '')
        });
      }
    });
  }

  // 2. Meals & Daily Summaries from 'B หน้าจดบันทึก'
  const meals = [];
  const healthLogs = [];
  const logSheet = ss.getSheetByName(SHEET_DAILY_LOG) || ss.getSheets()[1];
  if (logSheet && logSheet.getLastRow() >= 4) {
    const lastRow = logSheet.getLastRow();
    const lastCol = logSheet.getLastColumn();
    const fullData = logSheet.getRange(4, 1, lastRow - 3, lastCol).getValues();

    fullData.forEach((row, idx) => {
      // Left side: Meals (Cols A-J -> 0-9)
      const mealName = row[3];
      if (mealName && String(mealName).trim() !== '') {
        const rawDate = row[0];
        let dateStr = '';
        if (rawDate instanceof Date) {
          dateStr = Utilities.formatDate(rawDate, 'Asia/Bangkok', 'yyyy-MM-dd');
        } else if (rawDate) {
          dateStr = String(rawDate).split('T')[0];
        }

        meals.push({
          id: 'M-' + (idx + 4),
          rowNumber: idx + 4,
          date: dateStr,
          person: String(row[1] || 'ฝ่ายชาย').trim(), // ฝ่ายชาย / ฝ่ายหญิง
          mealType: String(row[2] || '01. มื้อเช้า').trim(),
          foodName: String(row[3] || '').trim(),
          servings: Number(row[4] || 1),
          calories: Number(row[5] || 0),
          protein: Number(row[6] || 0),
          carbs: Number(row[7] || 0),
          fat: Number(row[8] || 0),
          notes: String(row[9] || ''),
          status: 'กินแล้ว'
        });
      }

      // Right side: Health & Weight Log (Cols L-U -> 11-20)
      if (row.length > 11 && row[11]) {
        const rawDate = row[11];
        let dateStr = '';
        if (rawDate instanceof Date) {
          dateStr = Utilities.formatDate(rawDate, 'Asia/Bangkok', 'yyyy-MM-dd');
        } else if (rawDate) {
          dateStr = String(rawDate).split('T')[0];
        }

        if (dateStr) {
          healthLogs.push({
            date: dateStr,
            dayName: String(row[12] || ''),
            dayType: String(row[13] || 'วันปกติ'),
            maleWeight: row[14] !== '' ? Number(row[14]) : null,
            maleCalories: row[15] !== '' ? Number(row[15]) : null,
            maleProtein: row[16] !== '' ? Number(row[16]) : null,
            femaleWeight: row[17] !== '' ? Number(row[17]) : null,
            femaleCalories: row[18] !== '' ? Number(row[18]) : null,
            femaleProtein: row[19] !== '' ? Number(row[19]) : null,
            activity: String(row[20] || '')
          });
        }
      }
    });
  }

  // 3. Raw sheets metadata
  const rawSheets = ss.getSheets().map(s => {
    const lr = s.getLastRow();
    const lc = s.getLastColumn();
    let rows = [];
    let headers = [];
    if (lr > 0 && lc > 0) {
      const d = s.getRange(1, 1, Math.min(lr, 100), lc).getValues();
      headers = d[2] || d[0] || [];
      rows = d.slice(3);
    }
    return {
      name: s.getName(),
      sheetId: s.getSheetId(),
      headers: headers,
      rows: rows
    };
  });

  return {
    spreadsheetName: ss.getName(),
    foods: foods,
    meals: meals,
    healthLogs: healthLogs,
    rawSheets: rawSheets,
    targets: {
      male: { calories: 2000, protein: 160, carbs: 210, fat: 60, targetWeight: 70 },
      female: { calories: 1400, protein: 104, carbs: 130, fat: 40, targetWeight: 50 }
    }
  };
}

function handleAddMeal(ss, payload) {
  const logSheet = ss.getSheetByName(SHEET_DAILY_LOG) || ss.getSheets()[1];
  const lastRow = logSheet.getLastRow();

  // Find next empty row in Column D (Food Name)
  let targetRow = lastRow + 1;
  const colD = logSheet.getRange(4, 4, Math.max(1, lastRow - 3), 1).getValues();
  for (let i = 0; i < colD.length; i++) {
    if (!colD[i][0] || String(colD[i][0]).trim() === '') {
      targetRow = i + 4;
      break;
    }
  }

  const dateVal = payload.date ? new Date(payload.date) : new Date();
  const person = payload.person || 'ฝ่ายชาย';
  const mealType = payload.mealType || '01. มื้อเช้า';
  const foodName = payload.foodName || '-';
  const servings = Number(payload.servings || 1);
  const calories = Number(payload.calories || 0);
  const protein = Number(payload.protein || 0);
  const carbs = Number(payload.carbs || 0);
  const fat = Number(payload.fat || 0);
  const notes = payload.notes || '';

  logSheet.getRange(targetRow, 1, 1, 10).setValues([[
    dateVal, person, mealType, foodName, servings, calories, protein, carbs, fat, notes
  ]]);

  return {
    success: true,
    rowNumber: targetRow,
    meal: { date: payload.date, person, mealType, foodName, servings, calories, protein, carbs, fat, notes }
  };
}

function handleAddWeightLog(ss, payload) {
  const logSheet = ss.getSheetByName(SHEET_DAILY_LOG) || ss.getSheets()[1];
  const lastRow = logSheet.getLastRow();
  const dateStr = payload.date ? String(payload.date).split('T')[0] : Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd');
  const person = String(payload.person || 'ฝ่ายชาย').trim();
  const weight = Number(payload.weight || 0);
  const notes = payload.notes || '';

  // Scan Column L (12 in 1-based, index 11 in 0-based) for the matching date
  let matchedRow = -1;
  if (lastRow >= 4) {
    const datesCol = logSheet.getRange(4, 12, lastRow - 3, 1).getValues();
    for (let i = 0; i < datesCol.length; i++) {
      let d = datesCol[i][0];
      let rowDateStr = '';
      if (d instanceof Date) {
        rowDateStr = Utilities.formatDate(d, 'Asia/Bangkok', 'yyyy-MM-dd');
      } else if (d) {
        rowDateStr = String(d).split('T')[0];
      }
      if (rowDateStr === dateStr) {
        matchedRow = i + 4;
        break;
      }
    }
  }

  // Col O (15) for male, Col R (18) for female
  const colToUpdate = person === 'ฝ่ายชาย' ? 15 : 18;
  if (matchedRow > 0) {
    if (weight > 0) {
      logSheet.getRange(matchedRow, colToUpdate).setValue(weight);
    }
    if (notes) {
      const currentNotes = logSheet.getRange(matchedRow, 21).getValue();
      const newNotes = currentNotes ? currentNotes + '; ' + notes : notes;
      logSheet.getRange(matchedRow, 21).setValue(newNotes);
    }
    return { success: true, updatedRow: matchedRow, date: dateStr, person, weight };
  } else {
    const targetRow = lastRow + 1;
    const dateVal = new Date(dateStr);
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const dayName = dayNames[dateVal.getDay()] || 'จันทร์';
    const rowValues = new Array(21).fill('');
    rowValues[11] = dateVal;
    rowValues[12] = dayName;
    rowValues[13] = 'วันปกติ';
    rowValues[colToUpdate - 1] = weight;
    rowValues[20] = notes;
    logSheet.getRange(targetRow, 1, 1, 21).setValues([rowValues]);
    return { success: true, newRow: targetRow, date: dateStr, person, weight };
  }
}

function handleAddFoodItem(ss, payload) {
  const foodSheet = ss.getSheetByName(SHEET_FOOD_DB) || ss.getSheets()[0];
  const lastRow = foodSheet.getLastRow();

  const code = payload.code || ('M' + String(lastRow - 2).padStart(2, '0'));
  const category = payload.category || 'ทั่วไป';
  const name = payload.name || '-';
  const servingSize = payload.servingSize || '1 เสิร์ฟ';
  const calories = Number(payload.calories || 0);
  const protein = Number(payload.protein || 0);
  const carbs = Number(payload.carbs || 0);
  const fat = Number(payload.fat || 0);
  const targetGroup = payload.targetGroup || 'ทั้งคู่';
  const notes = payload.notes || '';

  foodSheet.appendRow([
    code, category, name, servingSize, calories, protein, carbs, fat, targetGroup, notes
  ]);

  return {
    success: true,
    food: { code, category, name, servingSize, calories, protein, carbs, fat, targetGroup, notes }
  };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function inspectSpreadsheet() {
  const ss = getSpreadsheet();
  Logger.log('Spreadsheet Name: ' + ss.getName());
  const sheets = ss.getSheets();
  sheets.forEach(sheet => {
    Logger.log('Sheet: ' + sheet.getName() + ' (ID: ' + sheet.getSheetId() + ', Rows: ' + sheet.getLastRow() + ', Cols: ' + sheet.getLastColumn() + ')');
  });
}
