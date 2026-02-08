// ジョブオプデータの型定義
export interface JobOpData {
  operationCode: string; // A列: 操作コード
  recruitmentPageId: string; // B列: 採用ホームページID
  recruitmentPageName: string; // C列: 採用ホームページ名
  jobId: string; // D列: 求人案件ID
  storeId: string; // E列: 店舗ID
  storeName: string; // F列: 店舗名
  workLocationCode: string; // G列: 勤務地コード
  workLocationName: string; // H列: 勤務地名称
  workLocationDisplayName: string; // I列: 勤務地表示名
  workLocationAlias: string; // J列: 勤務地別名
  postalCode: string; // K列: 郵便番号
  cityAddress: string; // L列: 都道府県市区町村
  streetAddress: string; // M列: 番地
  buildingName: string; // N列: 建物名
  // ... 他のフィールド (O～IQ列)
  managementComment: string; // AB列: 管理コメント (求人ID抽出元)
  [key: string]: string; // 動的キー対応
}

// HOT犬索データの型定義
export interface HotKensakuData {
  dataType: string; // A列: データ区分
  jobCode: string; // B列: 求人コード [251073560040]形式
  branchCode: string; // C列: 拠点コード
  companyName: string; // D列: 企業名
  department: string; // E列: 部署
  jobTitle: string; // F列: 求人タイトル
  jobCategoryCode: string; // G列: 業種(職種)小カテゴリコード
  jobRemarks: string; // H列: 業種(職種)備考
  postalCode: string; // I列: 勤務地(郵便番号)
  cityCode: string; // J列: 勤務地(市区町村コード)
  prefecture: string; // K列: 勤務地(都道府県)
  city: string; // L列: 勤務地(市区町村)
  streetAddress: string; // M列: 勤務地(番地、ビル名)
  locationRemarks: string; // N列: 勤務地備考
  companyAddress: string; // O列: 勤務地(企業)住所
}

// 判定結果の型定義
export interface MatchResult {
  jobNumber: string; // 求人番号
  jobOpAddress: string; // ジョブオプの住所
  hotKensakuAddress: string; // HOT犬索の住所
  isMatch: boolean; // TRUE=一致, FALSE=不一致
  hotKensakuPostalCode?: string; // HOT犬索の郵便番号 (不一致時のみ)
  hotKensakuCity?: string; // HOT犬索の市区町村 (不一致時のみ)
  hotKensakuStreet?: string; // HOT犬索の番地 (不一致時のみ)
  streetDuplicationCheck: number; // 番地重複チェック結果
}

// 出力データ(DATAシート)の型定義
export interface OutputData extends JobOpData {
  operationCode: "02"; // 更新操作固定
  postalCode: string; // HOT犬索の郵便番号(ハイフン除去済み)
  cityAddress: string; // HOT犬索の都道府県市区町村
  streetAddress: string; // HOT犬索の番地
}

// CSVパース結果の型定義
export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

// エラー型定義
export interface ProcessingError {
  type: "parsing" | "validation" | "matching" | "export";
  message: string;
  details?: string;
}
