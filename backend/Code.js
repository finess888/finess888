/**
 * แผนการกิน (Finess Meal & Nutrition Management) Backend API
 * Google Apps Script
 * Connected to Spreadsheet: 1yP5DwepfHxGoP0_OYx3zTXZTEdijbIt0aQj_1wTPuGs
 */

const SPREADSHEET_ID = '1yP5DwepfHxGoP0_OYx3zTXZTEdijbIt0aQj_1wTPuGs';

// Default sheet names
const SHEET_MEAL_PLAN = 'MealPlan';
const SHEET_FOOD_DB = 'FoodDatabase';
const SHEET_WEIGHT_LOG = 'WeightLog';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrInitSheet(ss, name, defaultHeaders) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (defaultHeaders && defaultHeaders.length > 0) {
      sheet.appendRow(defaultHeaders);
      sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight('bold');
    }
  }
  return sheet;
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

    // 2. Validate passcode for other actions
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
      case 'GET_RAW_SHEETS': {
        result = handleGetRawSheets(ss);
        break;
      }
      case 'ADD_MEAL': {
        result = handleAddMeal(ss, payload);
        break;
      }
      case 'UPDATE_MEAL_STATUS': {
        result = handleUpdateMealStatus(ss, payload);
        break;
      }
      case 'DELETE_MEAL': {
        result = handleDeleteMeal(ss, payload);
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

function handleGetRawSheets(ss) {
  const sheets = ss.getSheets();
  return sheets.map(s => {
    const lastRow = s.getLastRow();
    const lastCol = s.getLastColumn();
    let rows = [];
    if (lastRow > 0 && lastCol > 0) {
      rows = s.getRange(1, 1, lastRow, lastCol).getValues();
    }
    return {
      name: s.getName(),
      id: s.getSheetId(),
      rows: rows
    };
  });
}

function handleGetInitialData(ss) {
  // 1. Check all existing sheets in user's spreadsheet
  const allSheets = ss.getSheets();
  const rawSheetsData = allSheets.map(s => {
    const lr = s.getLastRow();
    const lc = s.getLastColumn();
    let headers = [];
    let rows = [];
    if (lr > 0 && lc > 0) {
      const data = s.getRange(1, 1, lr, lc).getValues();
      headers = data[0] || [];
      rows = data.slice(1);
    }
    return {
      name: s.getName(),
      sheetId: s.getSheetId(),
      headers: headers,
      rows: rows
    };
  });

  // 2. Meal Plan sheet
  const mealSheet = getOrInitSheet(ss, SHEET_MEAL_PLAN, [
    'ID', 'Date', 'DayOfWeek', 'MealType', 'FoodName', 'Portion', 'Calories', 'Protein', 'Carbs', 'Fat', 'Status', 'Notes', 'CreatedAt'
  ]);
  const mealData = readSheetAsObjects(mealSheet);

  // 3. Food Database sheet
  const foodSheet = getOrInitSheet(ss, SHEET_FOOD_DB, [
    'ID', 'Name', 'Category', 'ServingSize', 'Calories', 'Protein', 'Carbs', 'Fat', 'Fiber', 'Notes'
  ]);
  let foodData = readSheetAsObjects(foodSheet);

  // Seed standard Thai healthy foods if empty
  if (foodData.length === 0) {
    seedDefaultFoods(foodSheet);
    foodData = readSheetAsObjects(foodSheet);
  }

  // 4. Weight Log sheet
  const weightSheet = getOrInitSheet(ss, SHEET_WEIGHT_LOG, [
    'ID', 'Date', 'Weight', 'BodyFat', 'MuscleMass', 'Notes', 'CreatedAt'
  ]);
  const weightData = readSheetAsObjects(weightSheet);

  return {
    spreadsheetName: ss.getName(),
    meals: mealData,
    foods: foodData,
    weightLogs: weightData,
    rawSheets: rawSheetsData
  };
}

function handleAddMeal(ss, payload) {
  const mealSheet = getOrInitSheet(ss, SHEET_MEAL_PLAN, [
    'ID', 'Date', 'DayOfWeek', 'MealType', 'FoodName', 'Portion', 'Calories', 'Protein', 'Carbs', 'Fat', 'Status', 'Notes', 'CreatedAt'
  ]);

  const id = 'M-' + Date.now();
  const date = payload.date || Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd');
  const dayOfWeek = payload.dayOfWeek || getThaiDayName(new Date(date));
  const mealType = payload.mealType || 'มื้อเช้า';
  const foodName = payload.foodName || '-';
  const portion = payload.portion || '1 จาน';
  const calories = Number(payload.calories || 0);
  const protein = Number(payload.protein || 0);
  const carbs = Number(payload.carbs || 0);
  const fat = Number(payload.fat || 0);
  const status = payload.status || 'ยังไม่ได้กิน';
  const notes = payload.notes || '';
  const createdAt = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');

  mealSheet.appendRow([
    id, date, dayOfWeek, mealType, foodName, portion, calories, protein, carbs, fat, status, notes, createdAt
  ]);

  return {
    id, date, dayOfWeek, mealType, foodName, portion, calories, protein, carbs, fat, status, notes, createdAt
  };
}

function handleUpdateMealStatus(ss, payload) {
  const mealSheet = getOrInitSheet(ss, SHEET_MEAL_PLAN);
  const data = mealSheet.getDataRange().getValues();
  if (data.length <= 1) return { updated: false };

  const idCol = 0;
  const statusCol = 10; // 0-based for Status column

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(payload.id)) {
      mealSheet.getRange(i + 1, statusCol + 1).setValue(payload.status);
      return { updated: true, id: payload.id, status: payload.status };
    }
  }
  return { updated: false };
}

function handleDeleteMeal(ss, payload) {
  const mealSheet = getOrInitSheet(ss, SHEET_MEAL_PLAN);
  const data = mealSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(payload.id)) {
      mealSheet.deleteRow(i + 1);
      return { deleted: true, id: payload.id };
    }
  }
  return { deleted: false };
}

function handleAddFoodItem(ss, payload) {
  const foodSheet = getOrInitSheet(ss, SHEET_FOOD_DB, [
    'ID', 'Name', 'Category', 'ServingSize', 'Calories', 'Protein', 'Carbs', 'Fat', 'Fiber', 'Notes'
  ]);

  const id = 'F-' + Date.now();
  const name = payload.name || '-';
  const category = payload.category || 'ทั่วไป';
  const servingSize = payload.servingSize || '100g';
  const calories = Number(payload.calories || 0);
  const protein = Number(payload.protein || 0);
  const carbs = Number(payload.carbs || 0);
  const fat = Number(payload.fat || 0);
  const fiber = Number(payload.fiber || 0);
  const notes = payload.notes || '';

  foodSheet.appendRow([
    id, name, category, servingSize, calories, protein, carbs, fat, fiber, notes
  ]);

  return { id, name, category, servingSize, calories, protein, carbs, fat, fiber, notes };
}

function handleAddWeightLog(ss, payload) {
  const weightSheet = getOrInitSheet(ss, SHEET_WEIGHT_LOG, [
    'ID', 'Date', 'Weight', 'BodyFat', 'MuscleMass', 'Notes', 'CreatedAt'
  ]);

  const id = 'W-' + Date.now();
  const date = payload.date || Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd');
  const weight = Number(payload.weight || 0);
  const bodyFat = payload.bodyFat ? Number(payload.bodyFat) : '';
  const muscleMass = payload.muscleMass ? Number(payload.muscleMass) : '';
  const notes = payload.notes || '';
  const createdAt = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');

  weightSheet.appendRow([
    id, date, weight, bodyFat, muscleMass, notes, createdAt
  ]);

  return { id, date, weight, bodyFat, muscleMass, notes, createdAt };
}

function readSheetAsObjects(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(h => String(h || '').trim());
  const rows = values.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      if (h) {
        obj[h] = row[idx];
        obj[h.toLowerCase()] = row[idx];
      }
    });
    return obj;
  });
}

function seedDefaultFoods(sheet) {
  const defaults = [
    ['F-1', 'อกไก่ต้ม/นึ่ง', 'โปรตีน', '100g', 165, 31, 0, 3.6, 0, 'แหล่งโปรตีนไขมันต่ำ'],
    ['F-2', 'ไข่ไก่ทั้งฟอง (ต้ม)', 'โปรตีน', '1 ฟอง (50g)', 72, 6.3, 0.4, 4.8, 0, 'ไข่ต้มสุก'],
    ['F-3', 'ไข่ขาวต้ม', 'โปรตีน', '1 ฟอง (33g)', 17, 3.6, 0.2, 0.1, 0, 'โปรตีนบริสุทธิ์'],
    ['F-4', 'สันในหมูย่าง', 'โปรตีน', '100g', 143, 26, 0, 3.5, 0, 'ไขมันต่ำ'],
    ['F-5', 'ปลาแซลมอนย่าง', 'โปรตีน/ไขมันดี', '100g', 208, 20, 0, 13, 0, 'มี Omega-3 สูง'],
    ['F-6', 'ปลาดอลลี่/แพนกาเซียส นึ่ง', 'โปรตีน', '100g', 90, 15, 0, 3, 0, 'ย่อยง่าย'],
    ['F-7', 'กุ้งลวก', 'โปรตีน', '100g', 99, 24, 0.2, 0.3, 0, 'โปรตีนสูง ไขมันต่ำมาก'],
    ['F-8', 'ข้าวกล้องสุก', 'คาร์โบไฮเดรต', '1 ทัพพี (100g)', 111, 2.6, 23, 0.9, 1.8, 'คาร์บเชิงซ้อน'],
    ['F-9', 'ข้าวสวยหอมมะลิสุก', 'คาร์โบไฮเดรต', '1 ทัพพี (100g)', 130, 2.7, 28, 0.3, 0.4, 'ข้าวขาว'],
    ['F-10', 'มันเทศหวานนึ่ง/เผา', 'คาร์โบไฮเดรต', '100g', 86, 1.6, 20, 0.1, 3, 'ดัชนีน้ำตาลต่ำ'],
    ['F-11', 'ข้าวโอ๊ตแห้ง', 'คาร์โบไฮเดรต', '40g', 150, 5, 27, 2.5, 4, 'ไฟเบอร์สูง บำรุงหัวใจ'],
    ['F-12', 'บรอกโคลีลวก', 'ผัก', '100g', 35, 2.4, 7, 0.4, 2.6, 'วิตามินซีและสารต้านอนุมูลอิสระ'],
    ['F-13', 'เวย์โปรตีน Isolate', 'อาหารเสริม', '1 Scoop (30g)', 120, 25, 1, 1, 0, 'เสริมหลังออกกำลังกาย'],
    ['F-14', 'นมอัลมอนด์ ไม่หวาน', 'เครื่องดื่ม', '1 กล่อง (180ml)', 30, 1, 1, 2.5, 1, 'แคลอรี่ต่ำมาก'],
    ['F-15', 'อะโวคาโด', 'ไขมันดี', 'ครึ่งลูก (100g)', 160, 2, 8.5, 14.7, 6.7, 'ไขมันไม่อิ่มตัวเชิงเดี่ยว']
  ];

  defaults.forEach(row => sheet.appendRow(row));
}

function getThaiDayName(d) {
  const days = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  return days[d.getDay()] || 'วันจันทร์';
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ฟังก์ชันตรวจสอบและขอสิทธิ์ Spreadsheet:
 * รันใน Google Apps Script Editor 1 ครั้งเพื่อให้สิทธิ์
 */
function inspectSpreadsheet() {
  const ss = getSpreadsheet();
  Logger.log('Spreadsheet Name: ' + ss.getName());
  const sheets = ss.getSheets();
  sheets.forEach(sheet => {
    Logger.log('--- Sheet: ' + sheet.getName() + ' (ID: ' + sheet.getSheetId() + ', Rows: ' + sheet.getLastRow() + ', Cols: ' + sheet.getLastColumn() + ') ---');
    if (sheet.getLastRow() > 0 && sheet.getLastColumn() > 0) {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      Logger.log('Headers: ' + JSON.stringify(headers));
      if (sheet.getLastRow() > 1) {
        const sample = sheet.getRange(2, 1, Math.min(sheet.getLastRow() - 1, 3), sheet.getLastColumn()).getValues();
        Logger.log('Sample rows: ' + JSON.stringify(sample));
      }
    }
  });
}
