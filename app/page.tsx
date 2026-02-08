"use client";

import { useState } from "react";
import FileUploader from "@/components/FileUploader";
import ProgressBar from "@/components/ProgressBar";
import ResultTable from "@/components/ResultTable";
import { parseFile, validateParsedData } from "@/lib/parser";
import { createHotKensakuMap, matchAddresses, filterMismatchedData } from "@/lib/matcher";
import { generateOutputCSV, arrayToCSV, downloadCSV } from "@/lib/exporter";
import { MatchResult, ParsedCSV } from "@/lib/types";

export default function Home() {
  const [jobOpFile, setJobOpFile] = useState<File | null>(null);
  const [hotKensakuFile, setHotKensakuFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [outputData, setOutputData] = useState<string[][] | null>(null);

  // 必須列定義
  const JOBOP_REQUIRED_COLUMNS = [
    "管理コメント",
    "都道府県市区町村",
    "番地",
    "郵便番号",
  ];

  const HOTKENSAKU_REQUIRED_COLUMNS = [
    "求人コード",
    "勤務地(郵便番号)",
    "勤務地(都道府県)",
    "勤務地(市区町村)",
    "勤務地(番地、ビル名)",
  ];

  const handleProcess = async () => {
    if (!jobOpFile || !hotKensakuFile) {
      setError("両方のファイルを選択してください");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setProgressMessage("処理を開始しています...");

    try {
      // ステップ1: ジョブオプデータのパース
      setProgress(10);
      setProgressMessage("ジョブオプデータを読み込んでいます...");
      const jobOpParsed = await parseFile(jobOpFile);
      validateParsedData(jobOpParsed, JOBOP_REQUIRED_COLUMNS);

      // ステップ2: HOT犬索データのパース
      setProgress(30);
      setProgressMessage("HOT犬索データを読み込んでいます...");
      const hotKensakuParsed = await parseFile(hotKensakuFile);
      validateParsedData(hotKensakuParsed, HOTKENSAKU_REQUIRED_COLUMNS);

      // ステップ3: HOT犬索データをMap化
      setProgress(50);
      setProgressMessage("HOT犬索データをインデックス化しています...");
      const hotKensakuMap = createHotKensakuMap(hotKensakuParsed);

      // ステップ4: 住所照合処理
      setProgress(70);
      setProgressMessage("住所を照合しています...");
      const matchResults = matchAddresses(jobOpParsed, hotKensakuMap);
      setTotalCount(matchResults.length);

      // ステップ5: 不一致データのフィルタリング
      setProgress(85);
      setProgressMessage("不一致データを抽出しています...");
      const mismatchedResults = filterMismatchedData(matchResults);

      // ステップ6: 出力データ生成
      setProgress(95);
      setProgressMessage("出力データを生成しています...");
      const output = generateOutputCSV(jobOpParsed, mismatchedResults, hotKensakuMap);

      // 完了
      setProgress(100);
      setProgressMessage("処理が完了しました");
      setResults(matchResults);
      setOutputData(output);

      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    } catch (err: any) {
      console.error("処理エラー:", err);
      setError(err.message || "処理中にエラーが発生しました");
      setIsProcessing(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!outputData) return;

    const csvContent = arrayToCSV(outputData);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    downloadCSV(csvContent, `住所修正データ_${timestamp}.csv`);
  };

  const handleReset = () => {
    setJobOpFile(null);
    setHotKensakuFile(null);
    setResults(null);
    setOutputData(null);
    setError(null);
    setProgress(0);
    setProgressMessage("");
  };

  return (
    <div className="space-y-8">
      {/* 説明カード */}
      <div className="card bg-blue-50 border-primary">
        <h2 className="text-xl font-bold text-primary mb-3">使い方</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>ジョブオプから全求人データをCSVでエクスポートしてください</li>
          <li>HOT犬索から全求人データをCSVでエクスポートしてください</li>
          <li>2つのファイルをアップロードして「照合開始」をクリック</li>
          <li>住所不一致のデータが検出されます</li>
          <li>「修正用CSVをダウンロード」でジョブオプにアップロード可能なファイルを取得</li>
        </ol>
      </div>

      {/* ファイルアップロードエリア */}
      {!results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUploader
            label="1. ジョブオプデータ"
            onFileSelect={setJobOpFile}
            selectedFileName={jobOpFile?.name}
          />
          <FileUploader
            label="2. HOT犬索データ"
            onFileSelect={setHotKensakuFile}
            selectedFileName={hotKensakuFile?.name}
          />
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="card bg-red-50 border-red-500">
          <p className="text-red-700 font-semibold">エラー</p>
          <p className="text-sm text-red-600 mt-2">{error}</p>
        </div>
      )}

      {/* 進捗表示 */}
      {isProcessing && (
        <ProgressBar progress={progress} message={progressMessage} />
      )}

      {/* 実行ボタン */}
      {!results && !isProcessing && (
        <div className="flex justify-center">
          <button
            onClick={handleProcess}
            disabled={!jobOpFile || !hotKensakuFile}
            className="btn-primary text-lg px-12 py-4"
          >
            照合開始
          </button>
        </div>
      )}

      {/* 結果表示 */}
      {results && !isProcessing && (
        <div className="space-y-6">
          <ResultTable results={results} totalCount={totalCount} />

          {/* アクションボタン */}
          <div className="flex justify-center gap-4">
            {outputData && outputData.length > 1 && (
              <button onClick={handleDownloadCSV} className="btn-primary">
                修正用CSVをダウンロード
              </button>
            )}
            <button onClick={handleReset} className="btn-secondary">
              最初からやり直す
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
