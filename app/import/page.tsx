'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Papa from 'papaparse'
import PageHeader from '@/components/PageHeader'

// ── types ──────────────────────────────────────────────────────────────────

type Shop = 'rakuten' | 'base' | 'yahoo'
type MappingKey =
  | 'orderId' | 'purchasedAt' | 'customerId' | 'product'
  | 'revenue' | 'quantity' | 'isSubscription' | '__skip__'

interface Stats {
  totalPurchases: number
  lastImportedAt: string | null
  isMockData: boolean
}

interface ValidationError {
  row: number
  message: string
  isWarning: boolean
}

// ── constants ──────────────────────────────────────────────────────────────

const SHOPS: { key: Shop; label: string }[] = [
  { key: 'rakuten', label: '楽天市場' },
  { key: 'base',    label: 'BASE' },
  { key: 'yahoo',   label: 'Yahoo!ショッピング' },
]

const FORMAT_HEADERS: Record<Shop, { csv: string; field: string; required: boolean }[]> = {
  rakuten: [
    { csv: '注文番号',       field: 'orderId',        required: true },
    { csv: '注文日時',       field: 'purchasedAt',    required: true },
    { csv: '注文者ID',       field: 'customerId',     required: true },
    { csv: '商品名',         field: 'product（自動判定）', required: true },
    { csv: '注文金額',       field: 'revenue',        required: true },
    { csv: '注文個数',       field: 'quantity',       required: true },
    { csv: '定期購入フラグ', field: 'isSubscription', required: false },
  ],
  base: [
    { csv: '注文ID',       field: 'orderId',        required: true },
    { csv: '注文日',       field: 'purchasedAt',    required: true },
    { csv: '購入者ID',     field: 'customerId',     required: true },
    { csv: '商品タイトル', field: 'product（自動判定）', required: true },
    { csv: '支払金額',     field: 'revenue',        required: true },
    { csv: '数量',         field: 'quantity',       required: true },
  ],
  yahoo: [
    { csv: '注文ID',     field: 'orderId',        required: true },
    { csv: '注文日時',   field: 'purchasedAt',    required: true },
    { csv: 'ユーザーID', field: 'customerId',     required: true },
    { csv: '商品名',     field: 'product（自動判定）', required: true },
    { csv: '合計金額',   field: 'revenue',        required: true },
    { csv: '個数',       field: 'quantity',       required: true },
  ],
}

const DEFAULT_MAPPING: Record<Shop, Record<string, MappingKey>> = {
  rakuten: {
    '注文番号': 'orderId', '注文日時': 'purchasedAt', '注文者ID': 'customerId',
    '商品名': 'product', '注文金額': 'revenue', '注文個数': 'quantity',
    '定期購入フラグ': 'isSubscription',
  },
  base: {
    '注文ID': 'orderId', '注文日': 'purchasedAt', '購入者ID': 'customerId',
    '商品タイトル': 'product', '支払金額': 'revenue', '数量': 'quantity',
  },
  yahoo: {
    '注文ID': 'orderId', '注文日時': 'purchasedAt', 'ユーザーID': 'customerId',
    '商品名': 'product', '合計金額': 'revenue', '個数': 'quantity',
  },
}

const MAPPING_OPTIONS: { value: MappingKey; label: string }[] = [
  { value: 'orderId',        label: 'orderId' },
  { value: 'purchasedAt',    label: 'purchasedAt' },
  { value: 'customerId',     label: 'customerId' },
  { value: 'product',        label: 'product' },
  { value: 'revenue',        label: 'revenue' },
  { value: 'quantity',       label: 'quantity' },
  { value: 'isSubscription', label: 'isSubscription' },
  { value: '__skip__',       label: '（スキップ）' },
]

const LS_KEY = (shop: Shop) => `csv_mapping_${shop}`

// ── helpers ────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

// ── component ──────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeShop, setActiveShop] = useState<Shop>('rakuten')
  const [formatOpen, setFormatOpen] = useState(false)

  // file state
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, MappingKey>>({})

  // validation
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(false)

  // import
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ inserted: number; skipped: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // reset
  const [resetOpen, setResetOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // drag
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── fetch stats ──

  async function fetchStats() {
    const res = await fetch('/api/import/stats')
    const data: Stats = await res.json()
    setStats(data)
  }

  useEffect(() => { fetchStats() }, [])

  // ── tab change ──

  function switchShop(shop: Shop) {
    setActiveShop(shop)
    setFile(null)
    setCsvHeaders([])
    setCsvRows([])
    setMapping({})
    setErrors([])
    setValidated(false)
    setImportResult(null)
    setImportError(null)
    setFormatOpen(false)
  }

  // ── CSV parse ──

  function loadMapping(shop: Shop, headers: string[]): Record<string, MappingKey> {
    try {
      const saved = localStorage.getItem(LS_KEY(shop))
      if (saved) {
        const parsed: Record<string, MappingKey> = JSON.parse(saved)
        const m: Record<string, MappingKey> = {}
        for (const h of headers) m[h] = parsed[h] ?? DEFAULT_MAPPING[shop][h] ?? '__skip__'
        return m
      }
    } catch { /* ignore */ }
    const m: Record<string, MappingKey> = {}
    for (const h of headers) m[h] = DEFAULT_MAPPING[shop][h] ?? '__skip__'
    return m
  }

  function parseFile(f: File) {
    setFile(f)
    setErrors([])
    setValidated(false)
    setImportResult(null)
    setImportError(null)

    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? []
        const rows = result.data
        setCsvHeaders(headers)
        setCsvRows(rows)
        const m = loadMapping(activeShop, headers)
        setMapping(m)
      },
    })
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) parseFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.csv')) parseFile(f)
  }

  function updateMapping(header: string, value: MappingKey) {
    const next = { ...mapping, [header]: value }
    setMapping(next)
    try { localStorage.setItem(LS_KEY(activeShop), JSON.stringify(next)) } catch { /* ignore */ }
    setValidated(false)
    setErrors([])
  }

  // ── validation ──

  const validate = useCallback(async () => {
    setValidating(true)
    setErrors([])
    const errs: ValidationError[] = []

    const getVal = (row: Record<string, string>, key: MappingKey) => {
      const header = Object.entries(mapping).find(([, v]) => v === key)?.[0]
      return header ? row[header] ?? '' : ''
    }

    // client-side checks
    const orderIds: string[] = []
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i]
      const rowNum = i + 2  // header=1

      const orderId = getVal(row, 'orderId')
      if (!orderId) {
        errs.push({ row: rowNum, message: `${rowNum}行目: orderId が空です`, isWarning: false })
      } else {
        orderIds.push(orderId)
      }

      const purchasedAt = getVal(row, 'purchasedAt')
      if (purchasedAt && isNaN(Date.parse(purchasedAt))) {
        errs.push({ row: rowNum, message: `${rowNum}行目: purchasedAt が無効な日付です (${purchasedAt})`, isWarning: false })
      }

      const revenue = getVal(row, 'revenue')
      if (revenue && isNaN(Number(revenue))) {
        errs.push({ row: rowNum, message: `${rowNum}行目: revenue が数値ではありません (${revenue})`, isWarning: false })
      }
    }

    // duplicate check against DB
    if (orderIds.length > 0) {
      try {
        const res = await fetch('/api/import/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIds }),
        })
        const { duplicates }: { duplicates: string[] } = await res.json()
        if (duplicates.length > 0) {
          const dupSet = new Set(duplicates)
          for (let i = 0; i < csvRows.length; i++) {
            const oid = getVal(csvRows[i], 'orderId')
            if (dupSet.has(oid)) {
              errs.push({
                row: i + 2,
                message: `${i + 2}行目: orderId が重複しています（スキップされます）`,
                isWarning: true,
              })
            }
          }
        }
      } catch { /* ignore */ }
    }

    setErrors(errs)
    setValidated(true)
    setValidating(false)
  }, [csvRows, mapping])

  useEffect(() => {
    if (csvRows.length > 0 && Object.keys(mapping).length > 0) {
      validate()
    }
  }, [csvRows, mapping, validate])

  // ── import ──

  const hardErrors = errors.filter((e) => !e.isWarning)
  const warnings   = errors.filter((e) => e.isWarning)
  const validRows  = csvRows.length - warnings.length

  function buildMappedRows() {
    return csvRows
      .map((row) => {
        const get = (key: MappingKey) => {
          const header = Object.entries(mapping).find(([, v]) => v === key)?.[0]
          return header ? row[header] ?? '' : ''
        }
        const orderId = get('orderId')
        if (warnings.some((w) => w.message.includes(orderId))) return null
        return {
          orderId,
          purchasedAt: get('purchasedAt'),
          customerId: get('customerId'),
          product: get('product'),
          revenue: Number(get('revenue')),
          quantity: Number(get('quantity')) || 1,
          isSubscription: ['1', 'true', 'yes', '○'].includes(get('isSubscription').toLowerCase()),
        }
      })
      .filter(Boolean)
  }

  async function doImport() {
    setShowConfirm(false)
    setImporting(true)
    setImportError(null)
    setImportResult(null)

    try {
      const rows = buildMappedRows()
      const res = await fetch('/api/import/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: activeShop, rows }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'インポート失敗')
      }
      const result: { inserted: number; skipped: number } = await res.json()
      setImportResult(result)
      await fetchStats()
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setImporting(false)
    }
  }

  // ── reset ──

  async function doReset() {
    setShowResetConfirm(false)
    setResetting(true)
    setResetMsg(null)
    try {
      const res = await fetch('/api/import/reset', { method: 'POST' })
      const data = await res.json()
      setResetMsg(data.message ?? 'リセット完了')
      await fetchStats()
      // clear file state
      setFile(null)
      setCsvHeaders([])
      setCsvRows([])
      setMapping({})
      setErrors([])
      setValidated(false)
      setImportResult(null)
    } catch {
      setResetMsg('リセットに失敗しました')
    } finally {
      setResetting(false)
    }
  }

  // ── render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="データインポート"
        subtitle="各ECショップのCSVをアップロードしてKPIデータを更新する"
      />

        {/* stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-1">購入履歴件数</p>
            <p className="text-2xl font-bold text-slate-900">{stats ? stats.totalPurchases.toLocaleString() : '…'}</p>
            <p className="text-xs text-slate-400 mt-1">総レコード数</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-1">直近インポート</p>
            <p className="text-base font-semibold text-slate-800">{stats ? fmtDateTime(stats.lastImportedAt) : '…'}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            {stats?.isMockData ? (
              <span className="text-xs font-medium bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
                モックデータ使用中
              </span>
            ) : (
              <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
                実データあり
              </span>
            )}
          </div>
        </div>

        {/* tabs */}
        <div>
          <div className="flex gap-1 border-b border-slate-200">
            {SHOPS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchShop(key)}
                className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeShop === key
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-b-xl rounded-tr-xl border border-slate-200 border-t-0 shadow-sm p-6 space-y-6">

            {/* area 1: format description */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setFormatOpen(!formatOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span>対応CSVフォーマットを確認する</span>
                <span className="text-slate-400">{formatOpen ? '▲' : '▼'}</span>
              </button>
              {formatOpen && (
                <div className="p-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-3">
                    {activeShop === 'rakuten' ? '楽天RMS 注文CSVフォーマット' :
                     activeShop === 'base'    ? 'BASE 注文CSVフォーマット' :
                                               'Yahoo!ショッピング 注文CSVフォーマット'}
                  </p>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-600">CSVのカラム名</th>
                        <th className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-600">取込先フィールド</th>
                        <th className="border border-slate-200 px-3 py-2 text-center font-medium text-slate-600">必須</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FORMAT_HEADERS[activeShop].map((row) => (
                        <tr key={row.csv} className="hover:bg-slate-50">
                          <td className="border border-slate-200 px-3 py-2 font-mono text-slate-700">{row.csv}</td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-600">{row.field}</td>
                          <td className="border border-slate-200 px-3 py-2 text-center">
                            {row.required ? <span className="text-emerald-600 font-bold">✓</span> : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* area 2: file upload */}
            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                }`}
              >
                <div className="text-4xl mb-3">📄</div>
                <p className="text-sm font-medium text-slate-700">CSVファイルをドラッグ&ドロップ</p>
                <p className="text-xs text-slate-400 mt-1">または <span className="text-emerald-600 underline">クリックしてファイルを選択</span></p>
                <p className="text-xs text-slate-400 mt-2">対応形式: .csv のみ</p>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <span className="text-2xl">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{fmtBytes(file.size)}</p>
                </div>
                <button
                  onClick={() => {
                    setFile(null)
                    setCsvHeaders([])
                    setCsvRows([])
                    setMapping({})
                    setErrors([])
                    setValidated(false)
                    setImportResult(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="text-slate-400 hover:text-red-500 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            )}

            {/* area 3: preview */}
            {csvRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">プレビュー</p>
                  <p className="text-xs text-slate-400">全 {csvRows.length}行 × {csvHeaders.length}列</p>
                </div>

                <div className="overflow-auto max-h-64 border border-slate-200 rounded-xl">
                  <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        {csvHeaders.map((h) => (
                          <th key={h} className="bg-slate-800 text-white px-3 py-2 text-left font-medium whitespace-nowrap border-r border-slate-700 last:border-r-0">
                            <div className="mb-1.5">{h}</div>
                            <select
                              value={mapping[h] ?? '__skip__'}
                              onChange={(e) => updateMapping(h, e.target.value as MappingKey)}
                              className="w-full text-xs bg-slate-700 text-white border border-slate-600 rounded px-1 py-0.5 font-normal focus:outline-none"
                            >
                              {MAPPING_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 10).map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          {csvHeaders.map((h) => (
                            <td key={h} className="px-3 py-1.5 border-r border-b border-slate-100 last:border-r-0 whitespace-nowrap text-slate-700">
                              {row[h] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvRows.length > 10 && (
                  <p className="text-xs text-slate-400 text-center">… 残り {csvRows.length - 10} 行は省略</p>
                )}
              </div>
            )}

            {/* area 4: validation */}
            {csvRows.length > 0 && validated && (
              <div>
                {hardErrors.length === 0 && warnings.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-lg">✓</span>
                    <p className="text-sm font-medium text-emerald-700">インポート準備完了</p>
                    <p className="text-xs text-emerald-600 ml-1">（{csvRows.length}件すべて正常）</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hardErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm font-semibold text-red-700 mb-2">エラー {hardErrors.length} 件</p>
                        <ul className="space-y-1">
                          {hardErrors.map((e, i) => (
                            <li key={i} className="text-xs text-red-600">• {e.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {warnings.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm font-semibold text-amber-700 mb-2">警告（スキップ） {warnings.length} 件</p>
                        <ul className="space-y-1">
                          {warnings.slice(0, 5).map((e, i) => (
                            <li key={i} className="text-xs text-amber-700">• {e.message}</li>
                          ))}
                          {warnings.length > 5 && (
                            <li className="text-xs text-amber-500">… 他 {warnings.length - 5} 件</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {hardErrors.length === 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                        <span className="text-emerald-600 font-bold text-lg">✓</span>
                        <p className="text-sm font-medium text-emerald-700">インポート準備完了</p>
                        <p className="text-xs text-emerald-600 ml-1">（警告行を除く {validRows} 件）</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {validating && (
              <p className="text-xs text-slate-400 text-center py-2">バリデーション中…</p>
            )}

            {/* area 5: import button */}
            {csvRows.length > 0 && validated && (
              <div className="space-y-3">
                {importResult ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 space-y-1">
                    <p className="text-sm font-semibold text-emerald-700">✓ {importResult.inserted}件をインポートしました</p>
                    {importResult.skipped > 0 && (
                      <p className="text-xs text-emerald-600">スキップ: {importResult.skipped}件（重複）</p>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      disabled={hardErrors.length > 0 || importing || validRows === 0}
                      onClick={() => setShowConfirm(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {importing ? (
                        <>
                          <span className="animate-spin text-base">⟳</span>
                          インポート中...
                        </>
                      ) : (
                        `${validRows}件をインポートする`
                      )}
                    </button>
                    {importError && (
                      <p className="text-xs text-red-600 text-center">{importError}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* area 6: reset */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setResetOpen(!resetOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span>開発用: データをリセット</span>
            <span className="text-slate-400">{resetOpen ? '▲' : '▼'}</span>
          </button>
          {resetOpen && (
            <div className="p-4 border-t border-slate-200 bg-white space-y-3">
              <p className="text-sm text-slate-600">
                ⚠️ この操作はすべての購入履歴を削除してモックデータに戻します
              </p>
              {resetMsg && (
                <p className={`text-sm font-medium ${resetMsg.includes('失敗') ? 'text-red-600' : 'text-emerald-700'}`}>
                  {resetMsg}
                </p>
              )}
              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={resetting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {resetting ? 'リセット中…' : 'モックデータをリセット'}
              </button>
            </div>
          )}
        </div>

      {/* import confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900">インポートの確認</h2>
            <p className="text-sm text-slate-600">
              {validRows}件の購入履歴をインポートします。よろしいですか？
            </p>
            <div className="flex gap-3">
              <button onClick={doImport} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors">
                実行
              </button>
              <button onClick={() => setShowConfirm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm py-2.5 rounded-xl transition-colors">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* reset confirm dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900">リセットの確認</h2>
            <p className="text-sm text-slate-600">
              すべての購入履歴・広告・SNSデータを削除し、モックデータに戻します。この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button onClick={doReset} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors">
                リセット実行
              </button>
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm py-2.5 rounded-xl transition-colors">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
