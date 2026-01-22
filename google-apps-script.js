
/**
 * โค้ดสำหรับ Google Apps Script (Backend)
 * กรุณานำไปวางใน Google Apps Script Editor และ Deploy เป็น Web App
 */

// --- ส่วนการตั้งค่า ---
const SPREADSHEET_ID = "1Y04VeKas2eKdkxoSyFjc0pWyxasKjhjA-mOtXq5xN8Y"; 
const SUBJECT_CODES = ["M1_History", "M1_Social", "M5_History", "M5_Social", "M6_Social"];
const METADATA_SHEET_NAME = "Metadata";

// ฟังก์ชันเตรียมโครงสร้างไฟล์ (เรียกใช้ครั้งเดียวตอนเริ่มระบบ)
function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  SUBJECT_CODES.forEach(code => {
    if (!ss.getSheetByName(code)) {
      const sheet = ss.insertSheet(code);
      sheet.appendRow(["ID", "Name", "A1", "A2", "A3", "A4", "A5", "A6", "Mid", "Fin", "Status", "Rights", "Redeemed"]);
    }
  });
  if (!ss.getSheetByName(METADATA_SHEET_NAME)) {
    const metaSheet = ss.insertSheet(METADATA_SHEET_NAME);
    metaSheet.appendRow(["Subject", "DataJSON"]);
  }
}

// --- การจัดการ GET Request ---
function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  if (action === "getAllStudents") {
    const students = []; // ใช้ Array เพื่อรักษาลำดับการค้นพบครั้งแรก
    const studentMap = {}; // ใช้ช่วยในการค้นหาว่าเพิ่มนักเรียนคนนี้ไปหรือยัง (Quick Lookup)
    
    SUBJECT_CODES.forEach(code => {
      const sheet = ss.getSheetByName(code);
      if (!sheet) return;
      const values = sheet.getDataRange().getValues();
      
      // วนลูปตามแถวในชีท (เริ่มที่ i=1 ข้ามหัวตาราง)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const id = String(row[0]);
        if (!id || id.trim() === "") continue;
        
        if (!studentMap[id]) {
          const newStudent = { id: id, name: row[1], subjects: {} };
          studentMap[id] = newStudent;
          students.push(newStudent);
        }
        
        // เพิ่มข้อมูลคะแนนและสถานะของวิชานั้นๆ ให้กับนักเรียน พร้อมบันทึก rowIndex
        studentMap[id].subjects[code] = {
          scores: {
            assignments: [row[2], row[3], row[4], row[5], row[6], row[7]].map(v => Number(v) || 0),
            midterm: Number(row[8]) || 0,
            final: Number(row[9]) || 0
          },
          status: row[10] || "Normal",
          rewardRights: Number(row[11]) || 0,
          redeemedCount: Number(row[12]) || 0,
          rowIndex: i // เก็บเลขแถวเพื่อใช้เรียงลำดับในฝั่ง Frontend
        };
      }
    });
    
    return ContentService.createTextOutput(JSON.stringify(students))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getMetadata") {
    const subject = e.parameter.subject;
    const metaSheet = ss.getSheetByName(METADATA_SHEET_NAME);
    const data = metaSheet.getDataRange().getValues();
    let result = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === subject) {
        result = JSON.parse(data[i][1]);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- การจัดการ POST Request ---
function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const params = JSON.parse(e.postData.contents);
  const action = params.action;

  if (action === "updateScore") {
    const sheet = ss.getSheetByName(params.subject);
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, msg: "Sheet not found" }));
    
    const data = sheet.getDataRange().getValues();
    let rowIdx = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(params.id)) {
        rowIdx = i + 1;
        break;
      }
    }

    if (rowIdx !== -1) {
      let colIdx = 1; 
      if (params.field === "assignments") colIdx = 3 + params.index; 
      else if (params.field === "midterm") colIdx = 9;
      else if (params.field === "final") colIdx = 10;
      else if (params.field === "status") colIdx = 11;
      else if (params.field === "rewardRights") colIdx = 12;
      else if (params.field === "redeemedCount") colIdx = 13;

      sheet.getRange(rowIdx, colIdx).setValue(params.value);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === "redeemReward") {
    const sheet = ss.getSheetByName(params.subject);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(params.id)) {
        const currentRights = Number(data[i][11]) || 0;
        const currentRedeemed = Number(data[i][12]) || 0;
        if (currentRights > 0) {
          sheet.getRange(i + 1, 12).setValue(currentRights - 1);
          sheet.getRange(i + 1, 13).setValue(currentRedeemed + 1);
          return ContentService.createTextOutput(JSON.stringify({ success: true }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "updateMetadata") {
    const metaSheet = ss.getSheetByName(METADATA_SHEET_NAME);
    const data = metaSheet.getDataRange().getValues();
    const subject = params.subject;
    const metaJSON = JSON.stringify(params.meta);
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === subject) {
        metaSheet.getRange(i + 1, 2).setValue(metaJSON);
        found = true;
        break;
      }
    }
    if (!found) metaSheet.appendRow([subject, metaJSON]);
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
