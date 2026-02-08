"use client";

import { MatchResult } from "@/lib/types";

interface ResultTableProps {
  results: MatchResult[];
  totalCount: number;
}

export default function ResultTable({ results, totalCount }: ResultTableProps) {
  const mismatchCount = results.filter((r) => !r.isMatch).length;
  const matchCount = totalCount - mismatchCount;

  return (
    <div>
      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-blue-50 border-primary">
          <p className="text-sm text-gray-600 mb-1">総データ件数</p>
          <p className="text-3xl font-bold text-primary">{totalCount}</p>
        </div>
        <div className="card bg-green-50 border-green-500">
          <p className="text-sm text-gray-600 mb-1">住所一致</p>
          <p className="text-3xl font-bold text-green-600">{matchCount}</p>
        </div>
        <div className="card bg-red-50 border-red-500">
          <p className="text-sm text-gray-600 mb-1">住所不一致</p>
          <p className="text-3xl font-bold text-red-600">{mismatchCount}</p>
        </div>
      </div>

      {/* 不一致データテーブル */}
      {mismatchCount > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-text mb-4">
            住所不一致データ一覧 ({mismatchCount}件)
          </h3>
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">求人番号</th>
                  <th className="table-header">ジョブオプ住所</th>
                  <th className="table-header">HOT犬索住所</th>
                  <th className="table-header">HOT犬索郵便番号</th>
                  <th className="table-header">HOT犬索番地</th>
                </tr>
              </thead>
              <tbody>
                {results
                  .filter((r) => !r.isMatch)
                  .map((result, index) => (
                    <tr key={index} className="hover:bg-hover">
                      <td className="table-cell font-mono text-xs">
                        {result.jobNumber}
                      </td>
                      <td className="table-cell">{result.jobOpAddress}</td>
                      <td className="table-cell">{result.hotKensakuAddress}</td>
                      <td className="table-cell font-mono text-xs">
                        {result.hotKensakuPostalCode || "-"}
                      </td>
                      <td className="table-cell">
                        {result.hotKensakuStreet || "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 一致データがすべての場合 */}
      {mismatchCount === 0 && (
        <div className="card bg-green-50 border-green-500 text-center py-8">
          <p className="text-lg font-semibold text-green-700">
            すべての住所が一致しています
          </p>
          <p className="text-sm text-gray-600 mt-2">
            修正が必要なデータはありませんでした
          </p>
        </div>
      )}
    </div>
  );
}
