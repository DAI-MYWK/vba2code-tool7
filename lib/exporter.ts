import * as XLSX from "xlsx";
import { ParsedCSV, MatchResult } from "./types";
import { getCellValue } from "./parser";

/**
 * 不一致データをDATAシート形式でエクスポート
 * - 操作コード: "02" (更新)
 * - 住所フィールド: HOT犬索の値で置換
 * - その他のフィールド: ジョブオプデータから引き継ぎ
 */
export function generateOutputCSV(
  jobOpParsed: ParsedCSV,
  mismatchedResults: MatchResult[],
  hotKensakuMap: Map<string, any>
): string[][] {
  // 不一致の求人番号セット
  const mismatchedJobNumbers = new Set(
    mismatchedResults.map((r) => r.jobNumber)
  );

  // 出力データ配列 (ヘッダー + データ行)
  const outputData: string[][] = [];

  // ヘッダー行を追加
  outputData.push(jobOpParsed.headers);

  // ジョブオプデータの各行を処理
  for (const row of jobOpParsed.rows) {
    // 管理コメントから求人番号を抽出
    const managementComment = getCellValue(
      row,
      jobOpParsed.headers,
      "管理コメント"
    );
    const jobNumber = extractJobNumberFromComment(managementComment);

    // 不一致リストに含まれていない場合はスキップ
    if (!mismatchedJobNumbers.has(jobNumber)) {
      continue;
    }

    // HOT犬索データを取得
    const hotKensakuData = hotKensakuMap.get(jobNumber);
    if (!hotKensakuData) {
      continue; // データがない場合はスキップ
    }

    // 出力行を構築
    const outputRow: string[] = [];

    for (let i = 0; i < jobOpParsed.headers.length; i++) {
      const header = jobOpParsed.headers[i];

      switch (header) {
        case "操作コード":
          // 操作コードは "02" (更新) 固定
          outputRow.push("02");
          break;

        case "郵便番号":
          // HOT犬索の郵便番号からハイフンを除去
          const postalCode = hotKensakuData.postalCode.replace(/-/g, "");
          outputRow.push(postalCode);
          break;

        case "都道府県市区町村":
          // HOT犬索の都道府県 + 市区町村
          outputRow.push(
            hotKensakuData.prefecture + hotKensakuData.city
          );
          break;

        case "番地":
          // HOT犬索の番地
          outputRow.push(hotKensakuData.streetAddress || "");
          break;

        default:
          // その他の列はジョブオプデータから引き継ぎ
          outputRow.push(row[i] || "");
          break;
      }
    }

    outputData.push(outputRow);
  }

  return outputData;
}

/**
 * 管理コメントから求人IDを抽出 (matcher.tsと同じロジック)
 */
function extractJobNumberFromComment(managementComment: string): string {
  if (!managementComment) return "";
  const slashIndex = managementComment.indexOf("/");
  if (slashIndex === -1) return "";
  const jobId = managementComment.substring(slashIndex + 1);
  return `[${jobId}]`;
}

/**
 * CSV形式の文字列を生成
 * - RFC 4180準拠
 * - ダブルクォートでエスケープ
 */
export function arrayToCSV(data: string[][]): string {
  return data
    .map((row) =>
      row
        .map((cell) => {
          // セルにカンマ、改行、ダブルクォートが含まれる場合はエスケープ
          if (cell.includes(",") || cell.includes("\n") || cell.includes('"')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(",")
    )
    .join("\n");
}

/**
 * CSVファイルとしてダウンロード
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // BOM付きUTF-8で出力 (Excelで文字化けしないように)
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Excel形式でエクスポート (オプション)
 */
export function downloadExcel(data: string[][], filename: string): void {
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DATA");

  XLSX.writeFile(workbook, filename);
}
