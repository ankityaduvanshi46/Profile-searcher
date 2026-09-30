import { google } from "googleapis";
import { ScoredProfile } from "../types";

export interface SheetsWriterResult {
  success: boolean;
  appendedCount: number;
  skippedCount: number;
  sheetUrl?: string;
  error?: string;
}

export class SheetsWriterAgent {
  public readonly name = "sheets_writer" as const;

  private getAuthClient() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!email || !privateKey) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY must be configured");
    }

    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");

    return new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
  }

  async execute(profiles: ScoredProfile[]): Promise<SheetsWriterResult> {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      throw new Error("GOOGLE_SHEET_ID must be configured in environment");
    }

    if (profiles.length === 0) {
      return {
        success: true,
        appendedCount: 0,
        skippedCount: 0,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
      };
    }

    const auth = this.getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets(properties(sheetId,title,gridProperties))"
    });

    const firstSheet = metadata.data.sheets?.[0];
    const sheetId = firstSheet?.properties?.sheetId || 0;
    const sheetTitle = firstSheet?.properties?.title || "Sheet1";

    const headerRange = `${sheetTitle}!A1:J1`;
    const headerCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange
    });

    const existingHeaders = headerCheck.data.values?.[0];
    const needsHeader = !existingHeaders || existingHeaders.length === 0;

    if (needsHeader) {
      const headers = [
        "Rank",
        "Profile Name",
        "Username",
        "Profile Link",
        "Followers",
        "Avg Reel Views (last 10)",
        "Engagement Rate",
        "Score",
        "Niche",
        "Date Added"
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A1:J1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] }
      });

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId,
                  gridProperties: {
                    frozenRowCount: 1
                  }
                },
                fields: "gridProperties.frozenRowCount"
              }
            },
            {
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 10
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.05, green: 0.08, blue: 0.05 },
                    textFormat: {
                      foregroundColor: { red: 0.0, green: 1.0, blue: 0.25 },
                      bold: true,
                      fontSize: 11
                    },
                    horizontalAlignment: "CENTER",
                    verticalAlignment: "MIDDLE"
                  }
                },
                fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)"
              }
            },
            {
              updateDimensionProperties: {
                range: {
                  sheetId,
                  dimension: "COLUMNS",
                  startIndex: 0,
                  endIndex: 1
                },
                properties: { pixelSize: 70 },
                fields: "pixelSize"
              }
            },
            {
              updateDimensionProperties: {
                range: {
                  sheetId,
                  dimension: "COLUMNS",
                  startIndex: 1,
                  endIndex: 4
                },
                properties: { pixelSize: 180 },
                fields: "pixelSize"
              }
            },
            {
              updateDimensionProperties: {
                range: {
                  sheetId,
                  dimension: "COLUMNS",
                  startIndex: 4,
                  endIndex: 10
                },
                properties: { pixelSize: 130 },
                fields: "pixelSize"
              }
            }
          ]
        }
      });
    }

    const existingUsersRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!C2:C`
    });

    const liveHandles = new Set<string>();
    if (existingUsersRes.data.values) {
      for (const row of existingUsersRes.data.values) {
        if (row[0]) {
          liveHandles.add(String(row[0]).replace("@", "").toLowerCase().trim());
        }
      }
    }

    const rowsToAppend: (string | number)[][] = [];
    let skipped = 0;

    for (const p of profiles) {
      const clean = p.username.toLowerCase().trim();
      if (liveHandles.has(clean)) {
        skipped++;
        continue;
      }

      liveHandles.add(clean);
      rowsToAppend.push([
        p.rank,
        p.fullName,
        `@${p.username}`,
        `=HYPERLINK("${p.profileUrl}", "View Profile")`,
        p.followersCount,
        p.avgReelViews,
        `${p.engagementRate.toFixed(2)}%`,
        p.score,
        p.niche,
        p.dateAdded
      ]);
    }

    if (rowsToAppend.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetTitle}!A2`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: rowsToAppend }
      });

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              sortRange: {
                range: {
                  sheetId,
                  startRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 10
                },
                sortSpecs: [
                  {
                    dimensionIndex: 0,
                    sortOrder: "ASCENDING"
                  }
                ]
              }
            }
          ]
        }
      });
    }

    return {
      success: true,
      appendedCount: rowsToAppend.length,
      skippedCount: skipped,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    };
  }
}
