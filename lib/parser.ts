import * as XLSX from "xlsx";
import { ParsedCSV, ProcessingError } from "./types";

/**
 * ファイルをCSV/Excelとしてパースする
 * @param file アップロードされたファイル
 * @returns パース結果 (ヘッダー行 + データ行)
 */
export async function parseFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("ファイルの読み込みに失敗しました");
        }

        let workbook: XLSX.WorkBook;

        // ファイル形式に応じて処理
        if (file.name.endsWith(".csv")) {
          // CSVファイル
          const text = new TextDecoder("utf-8").decode(data as ArrayBuffer);
          workbook = XLSX.read(text, { type: "string" });
        } else {
          // Excel形式 (.xlsx, .xls)
          workbook = XLSX.read(data, { type: "array" });
        }

        // 最初のシートを取得
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // シートをJSON配列に変換 (header: 1 でヘッダーを配列として扱う)
        const jsonData: string[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "", // 空セルは空文字列
          raw: false, // 数値も文字列として取得
        });

        if (jsonData.length === 0) {
          throw new Error("ファイルにデータが含まれていません");
        }

        // ヘッダー行と データ行を分離
        const [headers, ...rows] = jsonData;

        resolve({
          headers: headers as string[],
          rows,
        });
      } catch (error) {
        const err: ProcessingError = {
          type: "parsing",
          message: "ファイルの解析に失敗しました",
          details: error instanceof Error ? error.message : String(error),
        };
        reject(err);
      }
    };

    reader.onerror = () => {
      const err: ProcessingError = {
        type: "parsing",
        message: "ファイルの読み込みに失敗しました",
      };
      reject(err);
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * パースされたCSVデータを検証する
 * @param parsed パース結果
 * @param requiredColumns 必須列名のリスト
 */
export function validateParsedData(
  parsed: ParsedCSV,
  requiredColumns: string[]
): void {
  // ヘッダーの存在チェック
  if (!parsed.headers || parsed.headers.length === 0) {
    throw new Error("ヘッダー行が見つかりません");
  }

  // 必須列の存在チェック
  const missingColumns = requiredColumns.filter(
    (col) => !parsed.headers.includes(col)
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `必須列が不足しています: ${missingColumns.join(", ")}`
    );
  }

  // データ行の存在チェック
  if (parsed.rows.length === 0) {
    throw new Error("データ行が見つかりません");
  }
}

/**
 * 列名から列インデックスを取得する
 * @param headers ヘッダー配列
 * @param columnName 列名
 * @returns 列インデックス (0始まり)
 */
export function getColumnIndex(headers: string[], columnName: string): number {
  const index = headers.indexOf(columnName);
  if (index === -1) {
    throw new Error(`列 "${columnName}" が見つかりません`);
  }
  return index;
}

/**
 * 行データから特定の列の値を取得する
 * @param row 行データ
 * @param headers ヘッダー配列
 * @param columnName 列名
 * @returns 列の値
 */
export function getCellValue(
  row: string[],
  headers: string[],
  columnName: string
): string {
  const index = getColumnIndex(headers, columnName);
  return row[index] || "";
}
