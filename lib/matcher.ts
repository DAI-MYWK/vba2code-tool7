import { ParsedCSV, MatchResult, HotKensakuData } from "./types";
import { getCellValue } from "./parser";

/**
 * 管理コメントから求人IDを抽出する
 * Excel数式: =IF(AB2="","","["&RIGHT(AB2,LEN(AB2)-FIND("/",AB2))&"]")
 * 例: "派遣先企業:株式会社宮島,拠点コード:1032,求人ID/251125380015" → "[251125380015]"
 */
export function extractJobNumber(managementComment: string): string {
  if (!managementComment) return "";

  const slashIndex = managementComment.indexOf("/");
  if (slashIndex === -1) return "";

  const jobId = managementComment.substring(slashIndex + 1);
  return `[${jobId}]`;
}

/**
 * 住所文字列を正規化する
 * - 「ケ」を「ヶ」に統一
 * - 全角スペースを除去
 */
export function normalizeAddress(address: string): string {
  return address.replace(/ケ/g, "ヶ").replace(/\s+/g, "");
}

/**
 * HOT犬索データをMapに変換 (高速検索用)
 * キー: 求人コード (例: "[251125380015]")
 * 値: HOT犬索データ
 */
export function createHotKensakuMap(
  parsed: ParsedCSV
): Map<string, HotKensakuData> {
  const map = new Map<string, HotKensakuData>();

  for (const row of parsed.rows) {
    const jobCode = getCellValue(row, parsed.headers, "求人コード");
    if (!jobCode) continue;

    const data: HotKensakuData = {
      dataType: getCellValue(row, parsed.headers, "データ区分"),
      jobCode,
      branchCode: getCellValue(row, parsed.headers, "拠点コード"),
      companyName: getCellValue(row, parsed.headers, "企業名"),
      department: getCellValue(row, parsed.headers, "部署"),
      jobTitle: getCellValue(row, parsed.headers, "求人タイトル"),
      jobCategoryCode: getCellValue(row, parsed.headers, "業種(職種)小カテゴリコード"),
      jobRemarks: getCellValue(row, parsed.headers, "業種(職種)備考"),
      postalCode: getCellValue(row, parsed.headers, "勤務地(郵便番号)"),
      cityCode: getCellValue(row, parsed.headers, "勤務地(市区町村コード)"),
      prefecture: getCellValue(row, parsed.headers, "勤務地(都道府県)"),
      city: getCellValue(row, parsed.headers, "勤務地(市区町村)"),
      streetAddress: getCellValue(row, parsed.headers, "勤務地(番地、ビル名)"),
      locationRemarks: getCellValue(row, parsed.headers, "勤務地備考"),
      companyAddress: getCellValue(row, parsed.headers, "勤務地(企業)住所"),
    };

    map.set(jobCode, data);
  }

  return map;
}

/**
 * 番地が都道府県市区町村フィールドに重複して含まれているかチェック
 * Excel数式: =IF(A2="","",IF(M2="",0,COUNTIF(L2,"*"&M2)))
 */
function checkStreetDuplication(cityAddress: string, streetAddress: string): number {
  if (!streetAddress) return 0;
  return cityAddress.includes(streetAddress) ? 1 : 0;
}

/**
 * 住所の前方一致判定
 * Excel数式: =IF(A2="","",IF(OR(COUNTIF(B2,C2&"*")>0,COUNTIF(B2,SUBSTITUTE(C2,"ケ","ヶ")&"*")>0),IF(H2=0,TRUE,FALSE),FALSE))
 *
 * ジョブオプ住所がHOT犬索住所で始まるかをチェック
 * - 通常の前方一致
 * - 「ケ」→「ヶ」変換後の前方一致
 * - 番地重複がない場合のみTRUE
 */
function isAddressMatch(
  jobOpAddress: string,
  hotKensakuAddress: string,
  streetDuplication: number
): boolean {
  if (!jobOpAddress || !hotKensakuAddress) return false;

  // 正規化
  const normalizedJobOp = normalizeAddress(jobOpAddress);
  const normalizedHotKensaku = normalizeAddress(hotKensakuAddress);

  // 前方一致チェック
  const isMatch = normalizedJobOp.startsWith(normalizedHotKensaku);

  // 番地重複チェック: 重複がある場合はFALSE
  if (isMatch && streetDuplication === 0) {
    return true;
  }

  return false;
}

/**
 * ジョブオプデータとHOT犬索データを照合する
 */
export function matchAddresses(
  jobOpParsed: ParsedCSV,
  hotKensakuMap: Map<string, HotKensakuData>
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const row of jobOpParsed.rows) {
    // 管理コメントから求人番号を抽出
    const managementComment = getCellValue(row, jobOpParsed.headers, "管理コメント");
    const jobNumber = extractJobNumber(managementComment);

    if (!jobNumber) {
      // 求人番号が抽出できない場合はスキップ
      continue;
    }

    // ジョブオプの住所を結合 (都道府県市区町村 + 番地)
    const cityAddress = getCellValue(row, jobOpParsed.headers, "都道府県市区町村");
    const streetAddress = getCellValue(row, jobOpParsed.headers, "番地");
    const jobOpAddress = cityAddress + streetAddress;

    // HOT犬索データをXLOOKUP (Map検索)
    const hotKensakuData = hotKensakuMap.get(jobNumber);

    if (!hotKensakuData) {
      // HOT犬索にデータがない場合は不一致扱い
      results.push({
        jobNumber,
        jobOpAddress,
        hotKensakuAddress: "(データなし)",
        isMatch: false,
        streetDuplicationCheck: 0,
      });
      continue;
    }

    // HOT犬索の住所を結合 (都道府県 + 市区町村)
    const hotKensakuAddress = hotKensakuData.prefecture + hotKensakuData.city;

    // 番地重複チェック
    const streetDuplication = checkStreetDuplication(cityAddress, streetAddress);

    // 住所一致判定
    const isMatch = isAddressMatch(jobOpAddress, hotKensakuAddress, streetDuplication);

    // 結果を格納
    results.push({
      jobNumber,
      jobOpAddress,
      hotKensakuAddress,
      isMatch,
      hotKensakuPostalCode: isMatch ? undefined : hotKensakuData.postalCode,
      hotKensakuCity: isMatch ? undefined : hotKensakuData.prefecture + hotKensakuData.city,
      hotKensakuStreet: isMatch ? undefined : hotKensakuData.streetAddress,
      streetDuplicationCheck: streetDuplication,
    });
  }

  return results;
}

/**
 * 不一致データのみをフィルタリング (Excel FILTER関数相当)
 */
export function filterMismatchedData(results: MatchResult[]): MatchResult[] {
  return results.filter((result) => !result.isMatch);
}
